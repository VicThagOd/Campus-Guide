import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert02Icon, AnalyticsUpIcon, ArrowLeft01Icon, Download01Icon, PlayIcon } from "hugeicons-react";
import { useAuth } from "../../context/AuthContext";
import { PaymentModal } from "./PaymentModal";
import {
  AppState,
  canStartFreeLiveTest,
  getAppState,
  getFreeTrialsRemaining,
  getWeakSubjects,
  setAppState as setStoredAppState,
  testConfig,
} from "../lib/appState";
import { fetchUserAccess, isCbtAccessExpired, UserAccess } from "../lib/userAccess";
import { createPastQuestionsDownloadUrl, triggerBrowserDownload } from "../lib/pastQuestionsPdf";
import { whatsappLink, whatsappMessages } from "../../lib/whatsapp";

type PaymentType = "pdf" | "cbt" | null;

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";

export function PostUtmeHub() {
  const { user, profile } = useAuth();
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
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    async function loadUserData() {
      setAccessLoading(true);

      const access = await fetchUserAccess(userId);
      setUserAccess(access);

      const { fetchFreeTrialsUsed } = await import("../lib/appState");
      const dbTrialsUsed = await fetchFreeTrialsUsed(userId);

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
      : "Pay ₦2,000 to unlock";

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
    <div className="min-h-screen" style={{ backgroundColor: SECTION_BG }}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 hover:bg-white"
            style={{ borderColor: BORDER, color: PRIMARY }}
          >
            <ArrowLeft01Icon size={14} />
            Back to dashboard
          </button>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: INK, marginBottom: "0.25rem" }}>
            Post-UTME Practice
          </h1>
          <p style={{ color: MUTED }}>Ready to continue your preparation, {username}?</p>
        </header>

        {accessLoading ? (
          <div className="mb-6 rounded-xl border bg-white p-4 text-center" style={{ borderColor: BORDER }}>
            <p style={{ color: MUTED }}>Loading your access status...</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <button onClick={handleStartLiveTest} className="block w-full text-left">
            <DashboardCard
              icon={<PlayIcon size={32} color={PRIMARY} />}
              title="Start Post UTME"
              description={liveTestDescription}
              linkText={liveTestLinkText}
              badge={cbtBadge}
              isClickable
            />
          </button>

          <button onClick={handleDownloadPDF} className="block w-full text-left">
            <DashboardCard
              icon={<Download01Icon size={32} color={PRIMARY} />}
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
            icon={<AnalyticsUpIcon size={32} color={PRIMARY} />}
            title="Last Score"
            description={lastScoreDescription}
            badge={lastScoreBadge}
          />

          <DashboardCard
            icon={<Alert02Icon size={32} color={PRIMARY} />}
            title="Weak Subjects"
            description={weakSubjectDescription}
            badge={weakSubjects.length > 0 ? "Based on your lowest subject averages" : "Complete a live test for insights"}
          />
        </div>

        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "#F0C868", backgroundColor: "#FFF9E9" }}>
          <p className="text-sm" style={{ color: "#8A6419" }}>
            <span className="font-semibold">Important:</span> PDF and CBT access are separate purchases. Payment for one does not unlock the other.
          </p>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6" style={{ borderColor: BORDER }}>
          <h3 className="mb-4 text-lg font-bold tracking-tight" style={{ color: INK }}>
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
              <p style={{ color: MUTED }}>No test history yet. Start a live test to track your progress.</p>
            )}
          </div>
        </div>

      </div>

      <div className="mx-auto max-w-4xl px-4 pb-10">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border p-6 md:flex-row" style={{ borderColor: "#D1D9F0", backgroundColor: "#EEF2FC" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#FFFFFF" }}>
              <Alert02Icon size={20} color={PRIMARY} />
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: INK }}>
                Need help with Post-UTME?
              </p>
              <p className="text-sm" style={{ color: MUTED }}>
                Talk to the Campus Guide team on WhatsApp.
              </p>
            </div>
          </div>
          <a
            href={whatsappLink(whatsappMessages.postUtmeHelp())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            Chat on WhatsApp
          </a>
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

export default PostUtmeHub;

function DashboardCard({
  icon, title, description, linkText, badge, isClickable = false,
}: {
  icon: React.ReactNode; title: string; description: string;
  linkText?: string; badge?: string; isClickable?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-6 transition-colors duration-150 ${isClickable ? "cursor-pointer hover:border-[#2F4EA2]" : ""}`} style={{ borderColor: BORDER }}>
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-lg font-bold tracking-tight" style={{ color: INK }}>{title}</h3>
      <p className="mb-4 text-sm leading-relaxed" style={{ color: MUTED }}>{description}</p>
      {badge && (
        <span className="mb-3 inline-block rounded-full px-3 py-1 text-sm" style={{ backgroundColor: "#EEF2FC", color: PRIMARY }}>
          {badge}
        </span>
      )}
      {linkText && (
        <div className="mt-2 inline-block rounded-lg px-4 py-2" style={{ backgroundColor: PRIMARY, color: "#FFFFFF", fontWeight: 500 }}>
          {linkText}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ subject, score, date, meta }: { subject: string; score: number; date: string; meta: string }) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0" style={{ borderColor: BORDER }}>
      <div>
        <p className="font-medium" style={{ color: INK }}>{subject}</p>
        <p className="text-sm" style={{ color: MUTED }}>{date}</p>
        <p className="text-sm" style={{ color: MUTED }}>{meta}</p>
      </div>
      <div
        className="rounded-lg px-4 py-2 font-semibold"
        style={{
          backgroundColor: score >= 70 ? PRIMARY : score >= 50 ? "#9AA8D4" : "#FDECEC",
          color: score >= 50 ? "#FFFFFF" : INK,
        }}
      >
        {score}%
      </div>
    </div>
  );
}