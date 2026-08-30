export interface ExamQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: string; // A, B, C, or D
  faculty: string;
  source: string; // batch file name
}

interface JSONQuestion {
  number: number;
  question: string;
  options: string[];
  answer: string;
}

interface JSONSession {
  session: string;
  questions: Record<string, JSONQuestion[]>;
}

interface JSONFile {
  book: string;
  sessions: JSONSession[];
}

// Cache for loaded questions
let questionsCache: Record<string, ExamQuestion[]> = {};

// Import all JSON files using Vite's glob
const jsonModules = import.meta.glob<{ default: JSONFile }>("../../data/**/*.json", { eager: true });

// Parse all JSON files on initialization
function initializeQuestions(): void {
  if (Object.keys(questionsCache).length > 0) return; // Already initialized

  Object.entries(jsonModules).forEach(([path, module]) => {
    try {
      const data: JSONFile = module.default;
      const pathParts = path.split("/");
      const fileName = pathParts[pathParts.length - 1].replace(".json", "");

      // Extract folder name (faculty)
      const folderName = pathParts[pathParts.length - 2];

      const questions: ExamQuestion[] = [];

      // Flatten all questions from all sessions
      data.sessions.forEach((session) => {
        Object.entries(session.questions).forEach(([subject, subjectQuestions]) => {
          subjectQuestions.forEach((q) => {
            questions.push({
              id: `${fileName}-${subject}-${q.number}`,
              subject: subject.toUpperCase(),
              question: q.question,
              options: q.options,
              correctAnswer: q.answer,
              faculty: data.book,
              source: fileName,
            });
          });
        });
      });

      questionsCache[folderName] = [
        ...(questionsCache[folderName] || []),
        ...questions,
      ];
    } catch (error) {
      console.error(`Failed to parse JSON file: ${path}`, error);
    }
  });
}

// Map faculty keywords to cache keys
function mapFacultyToFolderKey(faculty: string): string {
  const upper = faculty.toUpperCase();

  if (
    upper.includes("MEDICINE") ||
    upper.includes("PHARMACY") ||
    upper.includes("NURSING") ||
    upper.includes("DENTISTRY")
  ) {
    return "MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT";
  }

  if (
    upper.includes("ENGINEERING") ||
    upper.includes("COMPUTING") ||
    upper.includes("GEOLOGY")
  ) {
    return "FACULTY OF ENGINEERING, COMPUTING, GEOLOGY, INDUSTRIAL CHEMISTRY";
  }

  if (upper.includes("LAW") || upper.includes("HUMANITIES")) {
    return "LAW, HUMANITIES AND COMMUNICATION AND MEDIA STUDIES";
  }

  if (upper.includes("MANAGEMENT") || upper.includes("SOCIAL")) {
    return "FACULTY OF MANAGEMENT AND SOCIAL SCIENCES";
  }

  // Default to medicine
  return "MEDICINE, PHARMACY, ANATOMY PHYSIOLOGY NURSING, DENTISTRY AND SSLT";
}

// Load all questions for a faculty from all batches
export function loadAllQuestionsForFaculty(faculty: string): ExamQuestion[] {
  initializeQuestions();

  const folderKey = mapFacultyToFolderKey(faculty);
  return questionsCache[folderKey] || [];
}

// Group questions by subject
function groupBySubject(questions: ExamQuestion[]): Record<string, ExamQuestion[]> {
  return questions.reduce(
    (acc, question) => {
      if (!acc[question.subject]) {
        acc[question.subject] = [];
      }
      acc[question.subject].push(question);
      return acc;
    },
    {} as Record<string, ExamQuestion[]>
  );
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Select random items from array
function selectRandom<T>(array: T[], count: number): T[] {
  if (array.length <= count) {
    return [...array];
  }
  
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

// Generate exam questions - always exactly totalQuestions (default 50)
export function generateExam(
  faculty: string,
  excludedQuestionIds: string[] = [],
  totalQuestions: number = 50
): ExamQuestion[] {
  try {
    // Load all questions
    const allQuestions = loadAllQuestionsForFaculty(faculty);

    if (allQuestions.length === 0) {
      throw new Error("No available questions for this faculty");
    }

    // Filter out already used questions
    const availableQuestions = allQuestions.filter(
      (q) => !excludedQuestionIds.includes(q.id)
    );

    if (availableQuestions.length === 0) {
      console.warn("No new questions available, resetting history");
      return generateExam(faculty, [], totalQuestions);
    }

    // If not enough questions, reset and try again
    if (availableQuestions.length < totalQuestions) {
      console.warn(`Only ${availableQuestions.length} questions available, resetting history`);
      return generateExam(faculty, [], totalQuestions);
    }

    // Shuffle and select exactly totalQuestions (default 50)
    const shuffled = shuffleArray(availableQuestions);
    const selectedQuestions = shuffled.slice(0, totalQuestions);

    return selectedQuestions;
  } catch (error) {
    console.error("Error generating exam:", error);
    return [];
  }
}

// Calculate score per subject
export function calculateSubjectScores(
  questions: ExamQuestion[],
  selectedAnswers: (string | null)[] // Answer indices converted to letters
): Record<
  string,
  { correct: number; total: number; percentage: number; questions: ExamQuestion[] }
> {
  const scoresBySubject: Record<
    string,
    { correct: number; total: number; questions: ExamQuestion[] }
  > = {};

  questions.forEach((question, index) => {
    if (!scoresBySubject[question.subject]) {
      scoresBySubject[question.subject] = { correct: 0, total: 0, questions: [] };
    }

    scoresBySubject[question.subject].total += 1;
    scoresBySubject[question.subject].questions.push(question);

    // Check if answer is correct
    if (selectedAnswers[index] === question.correctAnswer) {
      scoresBySubject[question.subject].correct += 1;
    }
  });

  // Convert to percentages
  const result: Record<
    string,
    { correct: number; total: number; percentage: number; questions: ExamQuestion[] }
  > = {};

  Object.entries(scoresBySubject).forEach(([subject, data]) => {
    result[subject] = {
      correct: data.correct,
      total: data.total,
      percentage: Math.round((data.correct / data.total) * 100),
      questions: data.questions,
    };
  });

  return result;
}

// Find weak subjects (lowest scores)
export function getWeakSubjects(
  scoresBySubject: Record<string, { correct: number; total: number; percentage: number }>
): string[] {
  const percentages = Object.entries(scoresBySubject).map(([subject, score]) => ({
    subject,
    percentage: score.percentage,
  }));

  if (percentages.length === 0) return [];

  // Get subjects with lowest score
  const minPercentage = Math.min(...percentages.map((s) => s.percentage));
  return percentages.filter((s) => s.percentage === minPercentage).map((s) => s.subject);
}
