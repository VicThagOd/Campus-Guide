import { ExamQuestion, calculateSubjectScores, getWeakSubjects } from "./examGenerator";

/**
 * Analyze test performance and provide recommendations
 */
export interface PerformanceAnalysis {
  totalScore: number;
  weakSubjects: string[];
  strongSubjects: string[];
  subjectDetails: Array<{
    subject: string;
    score: number;
    correct: number;
    total: number;
    percentage: number;
  }>;
  recommendation: string;
}

export function analyzePerformance(
  questions: ExamQuestion[],
  selectedAnswers: string[]
): PerformanceAnalysis {
  // Calculate subject scores
  const scoresBySubject = calculateSubjectScores(questions, selectedAnswers);

  // Get weak subjects
  const weakSubjectsList = getWeakSubjects(scoresBySubject);

  // Get strong subjects
  const allSubjects = Object.keys(scoresBySubject);
  const maxScore = Math.max(...allSubjects.map(s => scoresBySubject[s].percentage));
  const strongSubjectsList = allSubjects.filter(s => scoresBySubject[s].percentage === maxScore);

  // Calculate total score
  const totalCorrect = Object.values(scoresBySubject).reduce((sum, s) => sum + s.correct, 0);
  const totalQuestions = Object.values(scoresBySubject).reduce((sum, s) => sum + s.total, 0);
  const totalScore = Math.round((totalCorrect / totalQuestions) * 100);

  // Create subject details
  const subjectDetails = allSubjects.map(subject => ({
    subject,
    score: scoresBySubject[subject].percentage,
    correct: scoresBySubject[subject].correct,
    total: scoresBySubject[subject].total,
    percentage: scoresBySubject[subject].percentage,
  }));

  // Generate recommendation
  let recommendation = "";
  if (totalScore >= 80) {
    recommendation = "Excellent performance! You're well-prepared for the exam.";
  } else if (totalScore >= 60) {
    recommendation = `Good effort! Focus on improving ${weakSubjectsList.join(" and ")} for better results.`;
  } else {
    recommendation = `Keep practicing! Allocate more time to ${weakSubjectsList.join(" and ")} to strengthen your weak areas.`;
  }

  return {
    totalScore,
    weakSubjects: weakSubjectsList,
    strongSubjects: strongSubjectsList,
    subjectDetails: subjectDetails.sort((a, b) => a.percentage - b.percentage),
    recommendation,
  };
}
