import type { SubjectName } from "../data/mockQuestions";
import { supabase } from "../../lib/supabase"; // <-- Added missing import
import { hasSupabaseEnv } from "../../lib/env";

export interface SubjectPerformance {
  subject: SubjectName | string;
  correct: number;
  total: number;
  score: number;
}

export interface IncorrectQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export interface ExamReviewQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface ExamReviewPayload {
  questions: ExamReviewQuestion[];
  selectedAnswers: string[];
}

export interface TestResultRecord {
  id: string;
  createdAt: string;
  score: number;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  pointsEarned: number;
  pointsPossible: number;
  subjectBreakdown: SubjectPerformance[];
  incorrectQuestions?: IncorrectQuestion[];
  exam?: ExamReviewPayload;
}

export interface PublishedReview {
  id: string;
  name: string;
  course: string;
  rating: number;
  review: string;
  createdAt: string;
}

export interface AppState {
  pdfAccess: boolean;
  liveTestAccess: boolean;
  cbtExpiresAt: string | null;
  freeTrialsUsed: number;
  reviews: PublishedReview[];
  results: TestResultRecord[];
}

const STORAGE_KEY_BASE = "campus-guide-state";
const FREE_TRIAL_LIMIT = 2;
const QUESTION_HISTORY_KEY_BASE = "campus-guide-question-history";
const MAX_QUESTION_HISTORY = 200;

function storageKey(userId?: string) {
  return userId ? `${STORAGE_KEY_BASE}-${userId}` : STORAGE_KEY_BASE;
}

function questionHistoryKey(userId?: string) {
  return userId ? `${QUESTION_HISTORY_KEY_BASE}-${userId}` : QUESTION_HISTORY_KEY_BASE;
}

export function getQuestionHistory(userId?: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(questionHistoryKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}

export function addQuestionHistory(questionIds: string[], userId?: string) {
  if (typeof window === "undefined") return;
  const previous = getQuestionHistory(userId);
  const merged = [...questionIds, ...previous].filter(
    (id, index, self) => self.indexOf(id) === index
  );
  const nextHistory = merged.slice(0, MAX_QUESTION_HISTORY);
  window.localStorage.setItem(questionHistoryKey(userId), JSON.stringify(nextHistory));
}

const defaultReviews: PublishedReview[] = [
  {
    id: "seed-1",
    name: "Chioma Okafor",
    course: "Engineering",
    rating: 5,
    review:
      "This platform helped me prepare effectively for my UNIPORT Post UTME. The past questions were accurate and the mock tests were just like the real exam!",
    createdAt: "2026-04-20T10:00:00.000Z",
  },
  {
    id: "seed-2",
    name: "Emmanuel Akinlade",
    course: "Medicine",
    rating: 5,
    review:
      "Excellent resource! The practice tests boosted my confidence and I scored 85% in my Post UTME. Highly recommended for serious students.",
    createdAt: "2026-04-19T10:00:00.000Z",
  },
  {
    id: "seed-3",
    name: "Blessing Chukwu",
    course: "Law",
    rating: 4,
    review:
      "Very helpful platform. The PDF materials are comprehensive and the test interface is user-friendly. Worth every naira!",
    createdAt: "2026-04-18T10:00:00.000Z",
  },
  {
    id: "seed-4",
    name: "David Okoro",
    course: "Business Admin",
    rating: 5,
    review:
      "I passed my RSU Post UTME with flying colors thanks to Campus Guide. The subject analysis helped me focus on my weak areas.",
    createdAt: "2026-04-17T10:00:00.000Z",
  },
];

const initialState: AppState = {
  pdfAccess: false,
  liveTestAccess: false,
  cbtExpiresAt: null,
  freeTrialsUsed: 0,
  reviews: defaultReviews,
  results: [],
};

export function getAppState(userId?: string): AppState {
  if (typeof window === "undefined") return initialState;
  const raw = window.localStorage.getItem(storageKey(userId));
  if (!raw) return initialState;
  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...initialState,
      ...parsed,
      reviews:
        Array.isArray(parsed.reviews) && parsed.reviews.length > 0
          ? parsed.reviews
          : defaultReviews,
      results: Array.isArray(parsed.results) ? parsed.results : [],
      cbtExpiresAt:
        typeof parsed.cbtExpiresAt === "string" ? parsed.cbtExpiresAt : null,
    };
  } catch {
    return initialState;
  }
}

export function setAppState(
  updater: (state: AppState) => AppState,
  userId?: string
): AppState {
  const nextState = updater(getAppState(userId));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(nextState));
  }
  return nextState;
}

/**
 * NEW: Fetch free trials used from the database
 * This ensures trials are synced across all devices
 */
export async function fetchFreeTrialsUsed(userId: string): Promise<number> {
  if (!hasSupabaseEnv || !userId) return 0;
  
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("free_trials_used")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching free trials:", error);
      return 0;
    }
    
    return data?.free_trials_used ?? 0;
  } catch (err) {
    console.error("Error fetching free trials:", err);
    return 0;
  }
}

/**
 * NEW: Update free trials used in the database
 */
export async function incrementFreeTrialsUsed(userId: string): Promise<boolean> {
  if (!hasSupabaseEnv || !userId) return false;
  
  try {
    // First, get the current value
    const { data: currentData, error: fetchError } = await supabase
      .from("profiles")
      .select("free_trials_used")
      .eq("id", userId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching current trials:", fetchError);
      return false;
    }
    
    const currentTrials = currentData?.free_trials_used ?? 0;
    const newTrials = currentTrials + 1;
    
    // Update the database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ free_trials_used: newTrials })
      .eq("id", userId);
    
    if (updateError) {
      console.error("Error updating trials:", updateError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error incrementing free trials:", err);
    return false;
  }
}

export function getFreeTrialsRemaining(state: AppState) {
  return Math.max(0, FREE_TRIAL_LIMIT - state.freeTrialsUsed);
}

export function isCbtExpired(state: AppState) {
  if (!state.cbtExpiresAt) return false;
  const expiresAt = new Date(state.cbtExpiresAt).getTime();
  return Date.now() > expiresAt;
}

export function canStartFreeLiveTest(state: AppState) {
  return (
    (state.liveTestAccess && !isCbtExpired(state)) ||
    getFreeTrialsRemaining(state) > 0
  );
}

/**
 * UPDATED: Now updates both localStorage AND database
 */
export async function startLiveTestSession(userId?: string): Promise<AppState> {
  // Update database first if userId is provided
  if (userId && hasSupabaseEnv) {
    const success = await incrementFreeTrialsUsed(userId);
    if (!success) {
      console.error("Failed to increment trials in database");
    }
  }
  
  // Then update localStorage
  return setAppState(
    (state) => {
      if (state.liveTestAccess || state.freeTrialsUsed >= FREE_TRIAL_LIMIT) {
        return state;
      }
      return {
        ...state,
        freeTrialsUsed: state.freeTrialsUsed + 1,
      };
    },
    userId
  );
}

export function unlockPdfAccess(userId?: string) {
  return setAppState(
    (state) => ({
      ...state,
      pdfAccess: true,
    }),
    userId
  );
}

export function unlockLiveTestAccess(
  userId?: string,
  expiresAt: string | null = null
) {
  return setAppState(
    (state) => ({
      ...state,
      liveTestAccess: true,
      cbtExpiresAt: expiresAt,
    }),
    userId
  );
}

export async function saveReviewToSupabase(review: {
  name: string;
  course: string;
  rating: number;
  review: string;
}) {
  if (!hasSupabaseEnv) {
    throw new Error("Supabase environment variables are missing.");
  }
  const { error } = await supabase.from("reviews").insert([review]);
  if (error) throw new Error(error.message);
}

export function saveResult(result: TestResultRecord, userId?: string) {
  return setAppState(
    (state) => ({
      ...state,
      results: [result, ...state.results].slice(0, 12),
    }),
    userId
  );
}

export function getWeakSubjects(results: TestResultRecord[]) {
  if (results.length === 0) return [];
  const aggregate = new Map<
    SubjectName,
    { correct: number; total: number }
  >();
  for (const result of results) {
    for (const subject of result.subjectBreakdown) {
      const current = aggregate.get(subject.subject) ?? {
        correct: 0,
        total: 0,
      };
      aggregate.set(subject.subject, {
        correct: current.correct + subject.correct,
        total: current.total + subject.total,
      });
    }
  }
  return Array.from(aggregate.entries())
    .map(([subject, values]) => ({
      subject,
      score:
        values.total === 0
          ? 0
          : Math.round((values.correct / values.total) * 100),
    }))
    .sort((a, b) => a.score - b.score)
    .filter((item) => item.score < 70);
}

export const testConfig = {
  totalQuestions: 50,
  durationSeconds: 30 * 60,
  totalPoints: 400,
  freeTrialLimit: FREE_TRIAL_LIMIT,
  pdfPrice: 2010.75,
  liveTestPrice: 2010.75,
};