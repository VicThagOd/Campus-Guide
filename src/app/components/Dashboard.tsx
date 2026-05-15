import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, FileDown, PlayCircle, Star, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PaymentModal } from "./PaymentModal";
import {
  AppState,
  canStartFreeLiveTest,
  getAppState,
  getFreeTrialsRemaining,
  getWeakSubjects,
  saveReviewToSupabase, // corrected import
  setAppState as setStoredAppState,
  testConfig,
} from "../lib/appState";
import { fetchUserAccess, isCbtAccessExpired, UserAccess } from "../lib/userAccess";
import { createPastQuestionsDownloadUrl, triggerBrowserDownload } from "../lib/pastQuestionsPdf";

type PaymentType = "pdf" | "cbt" | null;

export function Dashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const username = profile?.username || profile?.name || "Student";
  const course = profile?.course || "Post UTME Candidate";
  const userId = user?.id ?? "";
  const email = user?.email ?? "";

  const [appState, setAppState] = useState<AppState>(getAppState(userId));
  const [userAccess, setUserAccess] = useState<UserAccess>({
    pdf_access: false,
    cbt_access: false,
    cbt_expires_at: null,
  });
  const [accessLoading, setAccessLoading] = useState(true);
  const [activePayment, setActivePayment] = useState<PaymentType>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    async function loadUserData() {
      setAccessLoading(true);
      
      // Fetch user access (PDF, CBT)
      const access = await fetchUserAccess(userId);
      setUserAccess(access);
      
      // Fetch free trials from database and update localStorage
      const { fetchFreeTrialsUsed } = await import("../lib/appState");
      const dbTrialsUsed = await fetchFreeTrialsUsed(userId);
      
      // Update localStorage with database value
      const currentState = getAppState(userId);
      const updatedState = {
        ...currentState,
        freeTrialsUsed: dbTrialsUsed,
      };
      setStoredAppState(() => updatedState, userId);
      setAppState(updatedState);
      
      setAccessLoading(false);
    }
    
    loadUserData();
  }, [userId]);

  const results = appState.results;
  const lastResult = results[0];
  const weakSubjects = getWeakSubjects(results);
  const freeTrialsRemaining = getFreeTrialsRemaining(appState);

  const pdfAccess = userAccess.pdf_access;
  const cbtAccess = userAccess.cbt_access;
  const cbtExpired = isCbtAccessExpired(userAccess.cbt_expires_at);
  const cbtActive = cbtAccess && !cbtExpired;

  const handleDownloadPDF = async () => {
    if (!pdfAccess) {
      setActivePayment("pdf");
      return;
    }
    try {
      setPdfDownloading(true);
      const { url, filename } = await createPastQuestionsDownloadUrl({ course });
      triggerBrowserDownload(url, filename);
    } catch (err: any) {
      const message = err?.message || "Could not download your PDF. Please try again.";
      alert(message);
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleStartLiveTest = async () => {
    if (!userId) return;
    const currentState = getAppState(userId);
    if (!cbtActive && !canStartFreeLiveTest(currentState)) {
      setActivePayment("cbt");
      return;
    }
    
    // Update both database and localStorage
    const { startLiveTestSession } = await import("../lib/appState");
    await startLiveTestSession(userId);
    
    setAppState(getAppState(userId));
    navigate("/test-warning");
  };

  const handleAccessGranted = async () => {
    setActivePayment(null);
    if (userId) {
      const access = await fetchUserAccess(userId);
      setUserAccess(access);
    }
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    try {
      await saveReviewToSupabase({
        name: username,
        course,
        rating: reviewRating,
        review: reviewText,
      });
      setReviewText("");
      setReviewRating(5);
      alert("Thank you. Your review has been published on the landing page.");
    } catch (err: any) {
      alert(err?.message || "Could not publish review. Please try again.");
    }
  };

  const lastScoreDescription = lastResult
    ? `${lastResult.score}% (${lastResult.pointsEarned}/${lastResult.pointsPossible} points)`
    : "No live test taken yet";
  const lastScoreBadge = lastResult
    ? `${lastResult.correct} correct, ${lastResult.unanswered} unanswered`
    : "Take your first test";
  const weakSubjectDescription =
    weakSubjects.length > 0
      ? weakSubjects.slice(0, 3).map((item) => item.subject).join(", ")
      : "No weak subjects recorded yet";

  const liveTestLinkText = cbtActive
    ? "Begin Test"
    : freeTrialsRemaining > 0
      ? `${freeTrialsRemaining} free trial${freeTrialsRemaining === 1 ? "" : "s"} left`
      : "Pay ₦2,010.75 to unlock";

  const liveTestDescription = cbtActive
    ? `Take your full UNIPORT-style CBT mock examination`
    : cbtExpired
      ? `Your access expired on ${new Date(userAccess.cbt_expires_at!).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
      : `UNIPORT format: ${testConfig.totalQuestions} questions in 30 minutes, scored over ${testConfig.totalPoints}`;

  const cbtBadge = cbtActive && userAccess.cbt_expires_at
    ? `Expires: ${new Date(userAccess.cbt_expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    : cbtExpired
      ? "Subscription expired"
      : undefined;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#BFC3C6" }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-gray-100"
            style={{ color: '#2F4EA2', border: '1px solid #2F4EA2' }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>

        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 600, color: "#000000", marginBottom: "0.5rem" }}>
              Welcome, {username}
            </h1>
            <p style={{ color: "#000000", opacity: 0.7 }}>Ready to continue your preparation?</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg px-4 py-2 text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
          >
            Log Out
          </button>
        </header>

        {accessLoading ? (
          <div className="mb-6 rounded-lg bg-white p-4 text-center shadow-md">
            <p style={{ color: "#000000", opacity: 0.5 }}>Loading your access status...</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <button onClick={handleStartLiveTest} className="block w-full text-left">
            <DashboardCard
              icon={<PlayCircle size={32} color="#2F4EA2" />}
              title="Start Post UTME"
              description={liveTestDescription}
              linkText={liveTestLinkText}
              badge={cbtBadge}
              isClickable
            />
          </button>

          <button onClick={handleDownloadPDF} className="block w-full text-left">
            <DashboardCard
              icon={<FileDown size={32} color="#2F4EA2" />}
              title="Access Past Questions (PDF)"
              description="One-time unlock for all available PDF past questions and study packs"
              linkText={
                pdfAccess
                  ? (pdfDownloading ? "Preparing download..." : "Download your course PDF")
                  : `Pay ₦2,000 Once`
              }
              isClickable
            />
          </button>

          <DashboardCard
            icon={<TrendingUp size={32} color="#2F4EA2" />}
            title="Last Score"
            description={lastScoreDescription}
            badge={lastScoreBadge}
          />

          <DashboardCard
            icon={<AlertCircle size={32} color="#2F4EA2" />}
            title="Weak Subjects"
            description={weakSubjectDescription}
            badge={weakSubjects.length > 0 ? "Based on your lowest subject averages" : "Complete a live test for insights"}
          />
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Important:</span> PDF and CBT access are separate purchases. Payment for one does not unlock the other.
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#000000" }}>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {results.length > 0 ? (
              results.slice(0, 3).map((result) => (
                <ActivityItem
                  key={result.id}
                  subject="Live Test"
                  score={result.score}
                  date={new Date(result.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  meta={`${result.correct}/${result.total} correct | ${result.pointsEarned}/${result.pointsPossible} points`}
                />
              ))
            ) : (
              <p style={{ color: "#000000", opacity: 0.6 }}>No test history yet. Start a live test to track your progress.</p>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#000000" }}>
            Write a Review
          </h3>
          <form className="space-y-4" onSubmit={handleReviewSubmit}>
            <div>
              <p className="mb-2" style={{ color: "#000000", fontWeight: 500 }}>Your rating</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    className="transition-transform hover:scale-105"
                    aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                  >
                    <Star
                      size={24}
                      fill={value <= reviewRating ? "#2F4EA2" : "none"}
                      color={value <= reviewRating ? "#2F4EA2" : "#BFC3C6"}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="review-text" className="mb-2 block" style={{ color: "#000000", fontWeight: 500 }}>
                Share your experience
              </label>
              <textarea
                id="review-text"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2"
                style={{ backgroundColor: "#FFFFFF", color: "#000000", borderColor: "#BFC3C6" }}
                placeholder="How has Campus Guide helped you prepare for your Post UTME?"
                required
              />
            </div>
            <button
              type="submit"
              className="rounded-lg px-6 py-3 transition-all hover:opacity-90"
              style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
            >
              Publish Review
            </button>
          </form>
        </div>
      </div>

      {activePayment && (
        <PaymentModal
          paymentType={activePayment}
          userId={userId}
          userEmail={email}
          userName={username}
          course={course}
          amount={activePayment === "pdf" ? testConfig.pdfPrice : testConfig.liveTestPrice}
          title={activePayment === "pdf" ? "Unlock Past Questions" : "Unlock Live Tests"}
          description={
            activePayment === "pdf"
              ? "One-time payment for permanent PDF access"
              : "30-day access to unlimited CBT mock tests"
          }
          benefitText={
            activePayment === "pdf"
              ? "Instant access to your course PDF after confirmed payment"
              : "Instant 30-day CBT access after confirmed payment"
          }
          onAccessGranted={handleAccessGranted}
          onClose={() => setActivePayment(null)}
        />
      )}
    </div>
  );
}

// Default export in case routes.ts expects it
export default Dashboard;

function DashboardCard({
  icon, title, description, linkText, badge, isClickable = false,
}: {
  icon: React.ReactNode; title: string; description: string;
  linkText?: string; badge?: string; isClickable?: boolean;
}) {
  return (
    <div className={`rounded-lg bg-white p-6 shadow-md ${isClickable ? "cursor-pointer transition-shadow hover:shadow-lg" : ""}`}>
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#000000" }}>{title}</h3>
      <p className="mb-4" style={{ color: "#000000", opacity: 0.7 }}>{description}</p>
      {badge && (
        <span className="mb-3 inline-block rounded-full px-3 py-1" style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontSize: "0.875rem" }}>
          {badge}
        </span>
      )}
      {linkText && (
        <div className="mt-2 inline-block rounded-lg px-4 py-2" style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}>
          {linkText}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ subject, score, date, meta }: { subject: string; score: number; date: string; meta: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-3 last:border-0">
      <div>
        <p style={{ fontWeight: 500, color: "#000000" }}>{subject}</p>
        <p style={{ fontSize: "0.875rem", color: "#000000", opacity: 0.6 }}>{date}</p>
        <p style={{ fontSize: "0.875rem", color: "#000000", opacity: 0.6 }}>{meta}</p>
      </div>
      <div
        className="rounded-lg px-4 py-2"
        style={{
          backgroundColor: score >= 70 ? "#2F4EA2" : score >= 50 ? "#BFC3C6" : "#ffebee",
          color: score >= 50 ? "#FFFFFF" : "#000000",
          fontWeight: 600,
        }}
      >
        {score}%
      </div>
    </div>
  );
}