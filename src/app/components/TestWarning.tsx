import { Link, useNavigate } from "react-router-dom";
import { Alert01Icon, ArrowLeft01Icon, Clock01Icon, DocumentValidationIcon, Shield01Icon } from "hugeicons-react";
import { testConfig } from "../lib/appState";

export function TestWarning() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6">
          <button
             onClick={() => navigate('/')}
              className="flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 hover:bg-white"
                style={{ color: '#2F4EA2', border: '1px solid #BFC3C6' }}
                    >
                    <ArrowLeft01Icon size={14} />
                      Back to Home
            </button>
        </div>
        <div className="rounded-xl border bg-white p-8" style={{ borderColor: "#BFC3C6" }}>
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: "#2F4EA2" }}>
              <Alert01Icon size={48} color="#FFFFFF" />
            </div>
            <h1 className="mb-2" style={{ fontSize: "2rem", fontWeight: 600, color: "#2F4EA2" }}>
              Test Instructions
            </h1>
            <p style={{ color: "#000000", opacity: 0.7 }}>Please read carefully before starting</p>
          </div>

          <div className="mb-8 space-y-6">
            <InstructionCard
              icon={<Clock01Icon size={32} color="#2F4EA2" />}
              title="Timed Test"
              description={`You have 30 minutes to complete ${testConfig.totalQuestions} questions. The test will auto-submit when the timer runs out.`}
            />

            <InstructionCard
              icon={<Shield01Icon size={32} color="#2F4EA2" />}
              title="No Cheating"
              description="Academic integrity is crucial. Do not use external resources, calculators, or assistance during the test."
            />

            <InstructionCard
              icon={<DocumentValidationIcon size={32} color="#2F4EA2" />}
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
              
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              to="/post-utme"
              className="rounded-lg border-2 px-8 py-3 transition-colors duration-150 hover:bg-gray-50"
              style={{ borderColor: "#2F4EA2", color: "#2F4EA2", fontWeight: 500 }}
            >
              Cancel
            </Link>
            <Link
              to="/test"
              className="rounded-lg px-8 py-3 transition-opacity duration-150 hover:opacity-90"
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
