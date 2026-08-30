import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert02Icon, CheckmarkCircle02Icon, Loading01Icon } from "hugeicons-react";
import { useAuth } from "../../context/AuthContext";
import { fetchUserAccess, isCbtAccessExpired } from "../lib/userAccess";
import { supabase } from "../../lib/supabase";

type PaymentStatus = "checking" | "success" | "failed";

export function PaymentConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>("checking");
  const [message, setMessage] = useState("We are confirming your payment and unlocking your access.");

  const paymentType = useMemo(() => {
    const raw = searchParams.get("product");
    return raw === "pdf" || raw === "cbt" || raw === "ticket" || raw === "inspection" ? raw : null;
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
        let unlocked = false;

        if (paymentType === "pdf" || paymentType === "cbt") {
          const access = await fetchUserAccess(user.id);
          unlocked =
            paymentType === "pdf"
              ? access.pdf_access
              : access.cbt_access && !isCbtAccessExpired(access.cbt_expires_at);
        } else if (paymentType === "ticket") {
          // Check for a ticket purchased in the last 5 minutes
          const { data } = await supabase
            .from("event_tickets")
            .select("id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (data && data.length > 0) {
            const timeDiff = new Date().getTime() - new Date(data[0].created_at).getTime();
            unlocked = timeDiff < 300000; // 5 minutes
          }
        } else if (paymentType === "inspection") {
          // Check for a hostel inspection payment logged in the last 5 minutes
          const { data } = await supabase
            .from("inspection_payments")
            .select("id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (data && data.length > 0) {
            const timeDiff = new Date().getTime() - new Date(data[0].created_at).getTime();
            unlocked = timeDiff < 300000; // 5 minutes
          }
        }

        if (cancelled) return;

        if (unlocked) {
          setStatus("success");
          if (paymentType === "pdf") {
            setMessage("Your PDF access is active. Redirecting to practice...");
            window.setTimeout(() => {
              if (!cancelled) navigate("/post-utme");
            }, 2000);
          } else if (paymentType === "cbt") {
            setMessage("Your CBT access is active. Redirecting to practice...");
            window.setTimeout(() => {
              if (!cancelled) navigate("/post-utme");
            }, 2000);
          } else if (paymentType === "ticket") {
            setMessage("Your event ticket has been generated! Redirecting to events...");
            window.setTimeout(() => {
              if (!cancelled) navigate("/events");
            }, 2500);
          } else if (paymentType === "inspection") {
            setMessage("Your inspection payment has been confirmed! Redirecting to accommodation...");
            window.setTimeout(() => {
              if (!cancelled) navigate("/accommodation");
            }, 2500);
          }
          return;
        }

        attempts += 1;

        if (attempts >= maxAttempts) {
          setStatus("failed");
          setMessage("Payment confirmation is taking longer than expected. Give it a minute, then check your dashboard.");
          return;
        }

        window.setTimeout(pollAccess, 3000);
      } catch {
        if (!cancelled) {
          attempts += 1;
          if (attempts >= maxAttempts) {
            setStatus("failed");
            setMessage("We could not confirm your payment right now. Please check your page shortly.");
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

  const getRedirectPath = () => {
    if (paymentType === "ticket") return "/events";
    if (paymentType === "inspection") return "/accommodation";
    return "/post-utme";
  };

  const getRedirectLabel = () => {
    if (paymentType === "ticket") return "Go to Events";
    if (paymentType === "inspection") return "Go to Accommodation";
    return "Go to Practice";
  };

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: "#F7F8FA" }}>
      <div className="mx-auto max-w-xl rounded-xl border bg-white p-8" style={{ borderColor: "#BFC3C6" }}>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 hover:bg-white"
          style={{ color: "#2F4EA2", border: "1px solid #BFC3C6" }}
        >
          Back to Home
        </button>

        <div className="text-center mt-6">
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
                  : paymentType === "ticket"
                    ? "Event Ticket"
                    : paymentType === "inspection"
                      ? "Hostel Inspection Fee"
                      : "Unknown"}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={getRedirectPath()}
              className="rounded-lg px-5 py-3 text-center transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
            >
              {getRedirectLabel()}
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