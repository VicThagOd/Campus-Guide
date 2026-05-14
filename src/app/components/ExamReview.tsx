import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ExamReviewPayload, ExamReviewQuestion, getAppState } from "../lib/appState";

function getLetter(index: number) {
  return String.fromCharCode(65 + index);
}

function renderQuestionText(text: string): JSX.Element {
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
          return <span key={index} className="mx-1 rounded bg-yellow-100 px-2">_____</span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function getOptionStyle(params: {
  letter: string;
  selected: string;
  correct: string;
}) {
  const { letter, selected, correct } = params;
  const isCorrect = letter === correct;
  const isSelected = letter === selected;
  const isSelectedWrong = isSelected && selected !== "" && selected !== correct;
  const isSelectedCorrect = isSelected && isCorrect;

  if (isSelectedCorrect) {
    return { backgroundColor: "#22C55E", borderColor: "#16A34A", color: "#FFFFFF" };
  }
  if (isSelectedWrong) {
    return { backgroundColor: "#EF4444", borderColor: "#DC2626", color: "#FFFFFF" };
  }
  if (isCorrect) {
    return { backgroundColor: "#DCFCE7", borderColor: "#22C55E", color: "#000000" };
  }
  if (isSelected && selected === "") {
    return { backgroundColor: "#FFFFFF", borderColor: "#BFC3C6", color: "#000000" };
  }
  return { backgroundColor: "#FFFFFF", borderColor: "#BFC3C6", color: "#000000" };
}

function computeCorrectness(payload: ExamReviewPayload, index: number) {
  const q = payload.questions[index];
  const selected = payload.selectedAnswers[index] || "";
  if (selected === "") return "unanswered" as const;
  if (selected === q.correctAnswer) return "correct" as const;
  return "wrong" as const;
}

export function ExamReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const payload: ExamReviewPayload | null = useMemo(() => {
    const statePayload = (location.state as any)?.exam as ExamReviewPayload | undefined;
    if (statePayload?.questions?.length) return statePayload;

    const resultId = params.resultId;
    if (!resultId) return null;

    const saved = getAppState(user?.id).results.find((r) => r.id === resultId);
    return saved?.exam ?? null;
  }, [location.state, params.resultId, user?.id]);

  const questions: ExamReviewQuestion[] = payload?.questions ?? [];
  const answers = payload?.selectedAnswers ?? [];

  const counts = useMemo(() => {
    if (!payload) return { correct: 0, wrong: 0, unanswered: 0 };
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    for (let i = 0; i < payload.questions.length; i += 1) {
      const c = computeCorrectness(payload, i);
      if (c === "correct") correct += 1;
      else if (c === "wrong") wrong += 1;
      else unanswered += 1;
    }
    return { correct, wrong, unanswered };
  }, [payload]);

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#BFC3C6" }}>
        <div className="rounded-lg bg-white p-8 shadow-lg text-center max-w-md">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#000000" }}>No review data found</h2>
          <p className="mt-2 text-sm text-slate-600">
            Take a test first, then open the review immediately from the results page.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-5 rounded-lg px-6 py-3 transition-all hover:opacity-90"
            style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const current = questions[currentQuestion];
  const selected = answers[currentQuestion] || "";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#BFC3C6" }}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
             onClick={() => navigate('/')}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-gray-100"
                      style={{ color: '#2F4EA2', border: '1px solid #2F4EA2' }}
                    >
                      <ArrowLeft size={16} />
                      Back to Home
          </button>

          <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
              <CheckCircle2 size={16} color="#16A34A" />
              {counts.correct} correct
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
              <XCircle size={16} color="#DC2626" />
              {counts.wrong} wrong
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
              {counts.unanswered} unanswered
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.9fr_1fr]">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2F4EA2" }}>Exam Review</h2>
              <p className="text-sm text-slate-600">
                Question {currentQuestion + 1} of {questions.length} •{" "}
                <span className="font-medium text-slate-900">{current.subject}</span>
              </p>
            </div>

            <div className="mb-6">
              <h3 style={{ fontSize: "1.125rem", fontWeight: 500, color: "#000000", lineHeight: 1.6 }}>
                {renderQuestionText(current.question)}
              </h3>
            </div>

            <div className="space-y-3">
              {current.options.map((option, index) => {
                const letter = getLetter(index);
                const style = getOptionStyle({ letter, selected, correct: current.correctAnswer });
                const isSelected = letter === selected && selected !== "";
                const isCorrect = letter === current.correctAnswer;
                return (
                  <div
                    key={`${current.id}-${letter}`}
                    className="w-full rounded-lg border-2 px-6 py-4"
                    style={style}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="mr-3" style={{ fontWeight: 700 }}>
                          {letter}.
                        </span>
                        {option}
                      </div>
                      <div className="shrink-0 text-xs font-semibold">
                        {isCorrect ? "Correct" : isSelected ? "Your choice" : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentQuestion((v) => Math.max(0, v - 1))}
                disabled={currentQuestion === 0}
                className="rounded-lg border-2 px-6 py-3 transition-all disabled:opacity-40"
                style={{ borderColor: "#2F4EA2", color: "#2F4EA2", fontWeight: 500 }}
              >
                Previous
              </button>

              <button
                onClick={() => setCurrentQuestion((v) => Math.min(questions.length - 1, v + 1))}
                disabled={currentQuestion >= questions.length - 1}
                className="rounded-lg px-6 py-3 transition-all disabled:opacity-40"
                style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
              >
                Next
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-md lg:sticky lg:top-8">
            <p className="text-center" style={{ fontSize: "0.875rem", color: "#000000", opacity: 0.6 }}>
              Question Navigator
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {questions.map((_, index) => {
                const correctness = computeCorrectness(payload, index);
                const bg =
                  correctness === "correct"
                    ? "#16A34A"
                    : correctness === "wrong"
                      ? "#DC2626"
                      : "#FFFFFF";
                const fg = correctness === "unanswered" ? "#000000" : "#FFFFFF";
                const border = correctness === "unanswered" ? "1px solid #BFC3C6" : "1px solid transparent";
                const isActive = currentQuestion === index;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className="h-10 w-10 rounded-lg transition-all"
                    style={{
                      backgroundColor: isActive ? "#2F4EA2" : bg,
                      color: isActive ? "#FFFFFF" : fg,
                      border,
                      fontWeight: 600,
                    }}
                    aria-label={`Go to question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

