import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, FileText, Shield, ArrowLeft } from "lucide-react";
import { testConfig } from "../lib/appState";

export function TestWarning() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#BFC3C6" }}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all hover:opacity-90"
            style={{ backgroundColor: "#6b7280", color: "#FFFFFF", fontWeight: 500 }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: "#2F4EA2" }}>
              <AlertTriangle size={48} color="#FFFFFF" />
            </div>
            <h1 className="mb-2" style={{ fontSize: "2rem", fontWeight: 600, color: "#2F4EA2" }}>
              Test Instructions
            </h1>
            <p style={{ color: "#000000", opacity: 0.7 }}>Please read carefully before starting</p>
          </div>

          <div className="mb-8 space-y-6">
            <InstructionCard
              icon={<Clock size={32} color="#2F4EA2" />}
              title="Timed Test"
              description={`You have 30 minutes to complete ${testConfig.totalQuestions} questions. The test will auto-submit when the timer runs out.`}
            />

            <InstructionCard
              icon={<Shield size={32} color="#2F4EA2" />}
              title="No Cheating"
              description="Academic integrity is crucial. Do not use external resources, calculators, or assistance during the test."
            />

            <InstructionCard
              icon={<FileText size={32} color="#2F4EA2" />}
              title="Scoring Format"
              description={`This mock exam is scored over ${testConfig.totalPoints} points. Your results will show answered, correct, incorrect, unanswered, and subject-by-subject performance.`}
            />
          </div>

          <div className="mb-8 rounded-lg bg-gray-50 p-6">
            <h3 className="mb-4" style={{ fontSize: "1.125rem", fontWeight: 600, color: "#000000" }}>
              Important Notes:
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span style={{ color: "#2F4EA2", fontWeight: 600 }}>-</span>
                <span style={{ color: "#000000", opacity: 0.8 }}>Ensure you have a stable internet connection.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: "#2F4EA2", fontWeight: 600 }}>-</span>
                <span style={{ color: "#000000", opacity: 0.8 }}>Do not refresh your browser during the test.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: "#2F4EA2", fontWeight: 600 }}>-</span>
                <span style={{ color: "#000000", opacity: 0.8 }}>You can move between questions before final submission.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: "#2F4EA2", fontWeight: 600 }}>-</span>
                <span style={{ color: "#000000", opacity: 0.8 }}>Retain the current question format until new questions are added.</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-lg border-2 px-8 py-3 transition-all hover:bg-gray-50"
              style={{ borderColor: "#2F4EA2", color: "#2F4EA2", fontWeight: 500 }}
            >
              Cancel
            </Link>
            <Link
              to="/test"
              className="rounded-lg px-8 py-3 transition-all hover:opacity-90"
              style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
            >
              Start Test
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstructionCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="mb-1" style={{ fontSize: "1.125rem", fontWeight: 600, color: "#000000" }}>
          {title}
        </h4>
        <p style={{ color: "#000000", opacity: 0.7, lineHeight: 1.6 }}>{description}</p>
      </div>
    </div>
  );
}
