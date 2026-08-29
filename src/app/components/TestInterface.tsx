import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock01Icon, ArrowLeft01Icon } from "hugeicons-react";
import { useAuth } from "../../context/AuthContext";
import { generateExam, ExamQuestion } from "../lib/examGenerator";
import {
  getQuestionHistory,
  addQuestionHistory,
  SubjectPerformance,
  saveResult,
  testConfig,
  canStartFreeLiveTest,
  getAppState,
  startLiveTestSession,
  IncorrectQuestion,
  ExamReviewQuestion,
} from "../lib/appState";
import { fetchUserAccess, isCbtAccessExpired } from "../lib/userAccess";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Calculator } from "./Calculator";

const MATH_SUBJECTS = ["MATHEMATICS", "PHYSICS", "CHEMISTRY"];

function isCalculationQuestion(subject: string): boolean {
  return MATH_SUBJECTS.includes(subject);
}

function renderFormattedQuestion(text: string): JSX.Element {
  // Replace highlighted text patterns like **text**, _text_, ~text~ with formatting
  const parts = text.split(/(\*\*.*?\*\*|__.*?__|~~.*?~~|…)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} style={{ fontWeight: 700, color: "#2F4EA2" }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("__") && part.endsWith("__")) {
          return (
            <u key={index} style={{ textDecoration: "underline", color: "#2F4EA2" }}>
              {part.slice(2, -2)}
            </u>
          );
        }
        if (part.startsWith("~~") && part.endsWith("~~")) {
          return (
            <s key={index} style={{ textDecoration: "line-through", color: "#999" }}>
              {part.slice(2, -2)}
            </s>
          );
        }
        if (part === "…") {
          return <span key={index} className="mx-1 bg-yellow-100 px-2 rounded">_____</span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

const pointsPerQuestion = testConfig.totalPoints / testConfig.totalQuestions;
const TOTAL_QUESTIONS = 50;

function buildQuestionExplanation(question: ExamQuestion): string {
  const correctIndex = question.correctAnswer.charCodeAt(0) - 65;
  const correctOption = question.options[correctIndex] ?? "";
  return `Correct answer: ${question.correctAnswer}. ${correctOption}`;
}

function buildIncorrectQuestions(questions: ExamQuestion[], selectedAnswers: string[]): IncorrectQuestion[] {
  return questions.reduce<IncorrectQuestion[]>((acc, question, index) => {
    const selectedAnswer = selectedAnswers[index] || "";
    if (selectedAnswer === question.correctAnswer) {
      return acc;
    }

    acc.push({
      id: question.id,
      subject: question.subject,
      question: question.question,
      options: question.options,
      selectedAnswer: selectedAnswer || "No answer",
      correctAnswer: question.correctAnswer,
      explanation: buildQuestionExplanation(question),
    });

    return acc;
  }, []);
}

export function TestInterface() {
  const { profile, user } = useAuth();
  const course = profile?.course ?? "Post UTME Candidate";
  const userId = user?.id;
  const [testQuestions, setTestQuestions] = useState<ExamQuestion[]>([]);
  const [testCourse, setTestCourse] = useState(course);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]); // Now stores letters A/B/C/D
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(testConfig.durationSeconds);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [canAccessTest, setCanAccessTest] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((previous) => (previous <= 1 ? 0 : previous - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      submitTest();
    }
  }, [timeLeft]);

  useEffect(() => {
    let cancelled = false;

    async function checkAccessAndStart() {
      const appState = getAppState(userId);

      // Paid access (Supabase) OR free trials (local)
      const access = userId ? await fetchUserAccess(userId) : null;
      const hasPaidCbt = !!access?.cbt_access && !isCbtAccessExpired(access?.cbt_expires_at ?? null);
      const hasFreeTrial = canStartFreeLiveTest(appState);

      if (!hasPaidCbt && !hasFreeTrial) {
        navigate("/post-utme");
        return;
      }

      if (cancelled) return;
      setCanAccessTest(true);

      // Only consume a free trial when user is NOT paid.
      if (!hasPaidCbt) {
        startLiveTestSession(userId);
      }
    }

    checkAccessAndStart();
    return () => {
      cancelled = true;
    };
  }, [userId, navigate]);

  useEffect(() => {
    if (!canAccessTest || (testQuestions.length > 0 && course === testCourse)) {
      return;
    }

    const history = getQuestionHistory(userId);
    const questions = generateExam(course, history, TOTAL_QUESTIONS);

    setTestQuestions(questions);
    setSelectedAnswers(new Array(questions.length).fill(""));
    setCurrentQuestion(0);
    setTestCourse(course);
    addQuestionHistory(questions.map((question) => question.id), userId);
  }, [canAccessTest, course, testCourse, testQuestions.length, userId]);

  // Convert answer index to letter
  const handleSelectAnswer = (optionIndex: number) => {
    const nextAnswers = [...selectedAnswers];
    nextAnswers[currentQuestion] = String.fromCharCode(65 + optionIndex); // Convert 0→A, 1→B, etc.
    setSelectedAnswers(nextAnswers);
  };

  const handleSubmitClick = () => {
    setShowConfirmDialog(true);
  };

  const confirmSubmit = () => {
    setShowConfirmDialog(false);
    submitTest();
  };

  const submitTest = () => {
    // Count correct answers
    const correct = selectedAnswers.reduce((total, answer, index) => {
      return total + (answer === testQuestions[index].correctAnswer ? 1 : 0);
    }, 0);

    const answered = selectedAnswers.filter((answer) => answer !== "").length;
    const unanswered = testQuestions.length - answered;
    const incorrect = answered - correct;
    const score = Math.round((correct / testQuestions.length) * 100);
    const pointsEarned = correct * pointsPerQuestion;
    const subjectBreakdown = buildSubjectBreakdown(selectedAnswers, testQuestions);

    const result = {
      id: `result-${Date.now()}`,
      createdAt: new Date().toISOString(),
      score,
      total: testQuestions.length,
      correct,
      incorrect,
      unanswered,
      pointsEarned,
      pointsPossible: testConfig.totalPoints,
      subjectBreakdown,
      incorrectQuestions: buildIncorrectQuestions(testQuestions, selectedAnswers),
      exam: {
        questions: testQuestions.map(
          (q): ExamReviewQuestion => ({
            id: q.id,
            subject: q.subject,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
          }),
        ),
        selectedAnswers,
      },
    };

    saveResult(result, userId);
    navigate("/results", { state: result });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = selectedAnswers.filter((answer) => answer !== "").length;
  const unansweredCount = testQuestions.length - answeredCount;
  const current = testQuestions[currentQuestion];

  if (testQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#BFC3C6" }}>
        <div className="rounded-lg bg-white p-8 shadow-lg text-center">
          <p style={{ fontSize: "1rem", color: "#2F4EA2", fontWeight: 600 }}>
            Preparing your course-specific CBT questions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#BFC3C6" }}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.9fr_1fr]">
          <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#2F4EA2" }}>Post UTME Practice Test</h2>
              <p style={{ color: "#000000", opacity: 0.65, fontSize: "0.875rem" }}>
                UNIPORT format: {testConfig.totalQuestions} questions, 30 minutes, scored over {testConfig.totalPoints}
              </p>
            </div>
            <div className="flex items-center gap-2" style={{ color: "#2F4EA2", fontWeight: 600 }}>
              <Clock01Icon size={20} />
              <span>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span style={{ color: "#000000", opacity: 0.7, fontSize: "0.875rem" }}>
                Question {currentQuestion + 1} of {testQuestions.length}
              </span>
              <span style={{ color: "#2F4EA2", fontWeight: 500, fontSize: "0.875rem" }}>
                {answeredCount} answered, {unansweredCount} left
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full transition-all"
                style={{
                  width: `${((currentQuestion + 1) / testQuestions.length) * 100}%`,
                  backgroundColor: "#2F4EA2",
                }}
              />
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-2" style={{ fontSize: "0.875rem", color: "#2F4EA2", fontWeight: 600 }}>
              {current.subject}
            </p>
            <h3 className="mb-6" style={{ fontSize: "1.125rem", fontWeight: 500, color: "#000000", lineHeight: 1.6 }}>
              {renderFormattedQuestion(current.question)}
            </h3>
            {isCalculationQuestion(current.subject) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p style={{ fontSize: "0.75rem", color: "#2F4EA2", fontWeight: 500 }}>
                  💡 Calculator available - Use the calculator in the bottom-right corner
                </p>
              </div>
            )}

            <div className="space-y-3">
              {current.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className="w-full rounded-lg border-2 px-6 py-4 text-left transition-all"
                  style={{
                    backgroundColor: selectedAnswers[currentQuestion] === String.fromCharCode(65 + index) ? "#2F4EA2" : "#FFFFFF",
                    color: selectedAnswers[currentQuestion] === String.fromCharCode(65 + index) ? "#FFFFFF" : "#000000",
                    borderColor: selectedAnswers[currentQuestion] === String.fromCharCode(65 + index) ? "#2F4EA2" : "#BFC3C6",
                  }}
                >
                  <span className="mr-3" style={{ fontWeight: 600 }}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {isCalculationQuestion(current.subject) && (
              <button
                onClick={() => setShowCalculator(true)}
                className="rounded-lg px-4 py-3 transition-all"
                style={{ backgroundColor: "#7c3aed", color: "#FFFFFF", fontWeight: 500, fontSize: "0.875rem" }}
              >
                🧮 Calculator
              </button>
            )}
            <button
              onClick={() => setCurrentQuestion((value) => Math.max(0, value - 1))}
              disabled={currentQuestion === 0}
              className="rounded-lg border-2 px-6 py-3 transition-all disabled:opacity-40"
              style={{ borderColor: "#2F4EA2", color: "#2F4EA2", fontWeight: 500 }}
            >
              Previous
            </button>

            {currentQuestion < testQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion((value) => Math.min(testQuestions.length - 1, value + 1))}
                className="rounded-lg px-6 py-3 transition-all"
                style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitClick}
                className="rounded-lg px-6 py-3 transition-all"
                style={{ backgroundColor: "#ce0404", color: "#FFFFFF", fontWeight: 500 }}
              >
                Submit Test
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-md lg:sticky lg:top-8">
          <p className="text-center" style={{ fontSize: "0.875rem", color: "#000000", opacity: 0.6 }}>
            Question Navigator
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {testQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className="h-10 w-10 rounded-lg transition-all"
                style={{
                  backgroundColor: selectedAnswers[index] !== "" ? "#2F4EA2" : currentQuestion === index ? "#BFC3C6" : "#FFFFFF",
                  color: selectedAnswers[index] !== "" || currentQuestion === index ? "#FFFFFF" : "#000000",
                  border: "1px solid #BFC3C6",
                  fontWeight: 500,
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleSubmitClick}
              className="rounded-lg px-6 py-3 transition-all"
              style={{ backgroundColor: "#ce0404", color: "#FFFFFF", fontWeight: 500 }}
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
      {showCalculator && isCalculationQuestion(current.subject) && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}
    </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit the test? You have answered {answeredCount} out of {testQuestions.length} questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function buildSubjectBreakdown(answers: string[], questions: ExamQuestion[]): SubjectPerformance[] {
  const grouped = new Map<string, { correct: number; total: number }>();

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const current = grouped.get(question.subject) ?? { correct: 0, total: 0 };
    grouped.set(question.subject, {
      total: current.total + 1,
      correct: current.correct + (answers[index] === question.correctAnswer ? 1 : 0),
    });
  }

  return Array.from(grouped.entries()).map(([subject, value]) => ({
    subject: subject as string,
    correct: value.correct,
    total: value.total,
    score: Math.round((value.correct / value.total) * 100),
  }));
}
