import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, RotateCcw, Trophy, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SubjectPerformance, IncorrectQuestion, getAppState, testConfig } from "../lib/appState";

export function Results() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const latestSaved = getAppState(user?.id).results[0];
  const result = location.state || latestSaved;

  const score = result?.score ?? 0;
  const total = result?.total ?? testConfig.totalQuestions;
  const correct = result?.correct ?? 0;
  const incorrect = result?.incorrect ?? 0;
  const unanswered = result?.unanswered ?? total;
  const pointsEarned = result?.pointsEarned ?? 0;
  const pointsPossible = result?.pointsPossible ?? testConfig.totalPoints;
  const subjectBreakdown: SubjectPerformance[] = result?.subjectBreakdown ?? [];
  const incorrectQuestions: IncorrectQuestion[] = result?.incorrectQuestions ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#BFC3C6" }}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-6">
            <Trophy size={64} color="#2F4EA2" className="mx-auto mb-4" />
            <h1 style={{ fontSize: "2rem", fontWeight: 600, color: "#000000", marginBottom: "0.5rem" }}>Test Completed!</h1>
            <p style={{ color: "#000000", opacity: 0.7 }}>Here&apos;s how you performed in the test.</p>
          </div>

          <div className="mb-8">
            <div
              className="mb-4 inline-flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                backgroundColor: score >= 70 ? "#2F4EA2" : score >= 50 ? "#BFC3C6" : "#ffebee",
              }}
            >
              <span style={{ fontSize: "3rem", fontWeight: 700, color: score >= 50 ? "#FFFFFF" : "#000000" }}>{score}%</span>
            </div>
            <p style={{ color: "#000000", fontWeight: 500 }}>{correct} out of {total} questions correct</p>
            <p style={{ color: "#000000", opacity: 0.7, marginTop: "0.35rem" }}>{pointsEarned} out of {pointsPossible} points earned</p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricTile label="Correct" value={String(correct)} />
            <MetricTile label="Incorrect" value={String(incorrect)} />
            <MetricTile label="Unanswered" value={String(unanswered)} />
            <MetricTile label="Points" value={`${pointsEarned}/${pointsPossible}`} />
          </div>

          <div className="flex justify-center gap-4">
            <Link
              to="/test-warning"
              className="flex items-center gap-2 rounded-lg px-6 py-3 transition-all"
              style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
            >
              <RotateCcw size={20} />
              Retry Test
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg border-2 px-6 py-3 transition-all"
              style={{ borderColor: "#2F4EA2", color: "#2F4EA2", fontWeight: 500 }}
            >
              <Home size={20} />
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#000000" }}>
            <TrendingUp size={24} color="#2F4EA2" />
            Performance Breakdown
          </h3>
          <div className="space-y-4">
            {subjectBreakdown.map((item) => (
              <div key={item.subject}>
                <div className="mb-2 flex items-center justify-between">
                  <span style={{ fontWeight: 500, color: "#000000" }}>{item.subject}</span>
                  <span style={{ fontWeight: 600, color: "#2F4EA2" }}>
                    {item.correct}/{item.total} correct ({item.score}%)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: item.score >= 70 ? "#2F4EA2" : item.score >= 50 ? "#BFC3C6" : "#ff6b6b",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          {result?.exam?.questions?.length ? (
            <Link
              to={`/review/${result.id}`}
              state={{ exam: result.exam }}
              className="flex items-center justify-center gap-2 rounded-lg px-8 py-3 transition-all hover:opacity-90"
              style={{ backgroundColor: "#16a34a", color: "#FFFFFF", fontWeight: 500 }}
            >
              Review Full Exam
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p style={{ color: "#000000", opacity: 0.6, fontSize: "0.875rem" }}>{label}</p>
      <p style={{ color: "#2F4EA2", fontWeight: 700, marginTop: "0.35rem" }}>{value}</p>
    </div>
  );
}