import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert02Icon, CheckmarkCircle02Icon, Loading01Icon } from "hugeicons-react";
import { useAuth } from "../../context/AuthContext";
import { fetchUserAccess, isCbtAccessExpired } from "../lib/userAccess";

type PaymentStatus = "checking" | "success" | "failed";

export function PaymentConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>("checking");
  const [message, setMessage] = useState("We are confirming your payment and unlocking your access.");

  const paymentType = useMemo(() => {
    const raw = searchParams.get("product");
    return raw === "pdf" || raw === "cbt" ? raw : null;
  }, [searchParams]);

  const gatewayStatus = searchParams.get("status");

  useEffect(() => {
    if (!user?.id || !paymentType) {
      setStatus("failed");
      setMessage("We could not match this payment to a product. Please return to your dashboard and try again.");
      return;
    }

    if (gatewayStatus?.toLowerCase() === "failed") {
      setStatus("failed");
      setMessage("Your payment was not completed. Please try again.");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;

    const pollAccess = async () => {
      try {
        const access = await fetchUserAccess(user.id);
        const unlocked =
          paymentType === "pdf"
            ? access.pdf_access
            : access.cbt_access && !isCbtAccessExpired(access.cbt_expires_at);

        if (cancelled) return;

        if (unlocked) {
          setStatus("success");
          setMessage(
            paymentType === "pdf"
              ? "Your PDF access is active. Redirecting to practice..."
              : "Your CBT access is active. Redirecting to practice...",
          );
          // Auto-redirect to practice hub after 2 seconds
          window.setTimeout(() => {
            if (!cancelled) navigate("/post-utme");
          }, 2000);
          return;
        }

        attempts += 1;

        if (attempts >= maxAttempts) {
setStatus("failed");
      setMessage("Payment confirmation is taking longer than expected. Give it a minute, then check your practice page.");
          return;
        }

        window.setTimeout(pollAccess, 3000);
      } catch {
        if (!cancelled) {
          attempts += 1;
          if (attempts >= maxAttempts) {
            setStatus("failed");
            setMessage("We could not confirm your payment right now. Please check your practice page shortly.");
            return;
          }
          window.setTimeout(pollAccess, 3000);
        }
      }
    };

    pollAccess();

    return () => {
      cancelled = true;
    };
  }, [gatewayStatus, paymentType, user?.id, navigate]);

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="mx-auto max-w-xl rounded-xl border bg-white p-8" style={{ borderColor: "#BFC3C6" }}>
        <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 hover:bg-white"
            style={{ color: '#2F4EA2', border: '1px solid #BFC3C6' }}
          >
          Back to Home
        </button>

        <div className="text-center">
          {status === "checking" && (
            <Loading01Icon size={52} color="#2F4EA2" className="mx-auto mb-4 animate-spin" />
          )}
          {status === "success" && (
            <CheckmarkCircle02Icon size={52} color="#16a34a" className="mx-auto mb-4" />
          )}
          {status === "failed" && (
            <Alert02Icon size={52} color="#dc2626" className="mx-auto mb-4" />
          )}

          <h1 className="mb-3" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#000000" }}>
            {status === "checking"
              ? "Confirming Payment"
              : status === "success"
                ? "Access Ready"
                : "Confirmation Pending"}
          </h1>

          <p className="mb-6" style={{ color: "#000000", opacity: 0.72 }}>
            {message}
          </p>

          <div className="rounded-lg bg-gray-50 p-4 text-left">
            <p style={{ color: "#000000", fontWeight: 600, marginBottom: "0.5rem" }}>
              Product
            </p>
            <p style={{ color: "#000000", opacity: 0.72 }}>
              {paymentType === "pdf"
                ? "Past Questions PDF"
                : paymentType === "cbt"
                  ? "Live CBT Access"
                  : "Unknown"}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/post-utme"
              className="rounded-lg px-5 py-3 text-center transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
            >
              Go to Practice
            </Link>
            <Link
              to="/contact"
              className="rounded-lg border border-gray-300 px-5 py-3 text-center transition-all hover:bg-gray-50"
              style={{ color: "#000000", fontWeight: 500 }}
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}