import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert02Icon, CheckmarkCircle02Icon, Loading01Icon } from "hugeicons-react";
import { useAuth } from "../../context/AuthContext";
import { fetchUserAccess, isCbtAccessExpired } from "../lib/userAccess";
import { supabase } from "../../lib/supabase";
import { PageantSuccessModal, PageantContestantDetails } from "./PageantSuccessModal";

type PaymentStatus = "checking" | "success" | "failed";

export function PaymentConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>("checking");
  const [message, setMessage] = useState("We are confirming your payment and unlocking your access.");
  const [contestantDetails, setContestantDetails] = useState<PageantContestantDetails | null>(null);

  const paymentType = useMemo(() => {
    const raw = searchParams.get("product");
    return raw === "pdf" || raw === "cbt" || raw === "ticket" || raw === "inspection" || raw === "pageant" ? raw : null;
  }, [searchParams]);

  const gatewayStatus = searchParams.get("status");

  useEffect(() => {
    if (!paymentType) {
      setStatus("failed");
      setMessage("We could not match this payment to a product. Please return to your dashboard or home page and try again.");
      return;
    }

    if ((paymentType === "pdf" || paymentType === "cbt") && !user?.id) {
      setStatus("failed");
      setMessage("Please sign in to your student account so we can link your study access.");
      return;
    }

    if (gatewayStatus?.toLowerCase() === "failed" || gatewayStatus?.toLowerCase() === "cancelled") {
      setStatus("failed");
      setMessage(
        paymentType === "pageant"
          ? "Your pageant registration payment was not completed or was cancelled. Please try again."
          : "Your payment was not completed. Please try again."
      );
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;

    const pollAccess = async () => {
      try {
        let unlocked = false;

        if (paymentType === "pageant") {
          const contestantIdParam = searchParams.get("contestant_id");
          const txRef = searchParams.get("tx_ref");
          const transactionId = searchParams.get("transaction_id");
          let targetContestantId = contestantIdParam;

          // If no contestant_id in URL, try to resolve from pending_payments
          if (!targetContestantId && txRef) {
            const { data: pending } = await supabase
              .from("pending_payments")
              .select("metadata")
              .eq("reference", txRef)
              .maybeSingle();

            if (pending?.metadata?.contestantId) {
              targetContestantId = pending.metadata.contestantId;
            }
          }

          let contestantQuery = supabase
            .from("pageant_contestants")
            .select("id, name, gender, category, category_number, contestant_number, contestant_code, payment_status, payment_reference, cover_photo_url, department, level");

          if (targetContestantId) {
            contestantQuery = contestantQuery.eq("id", targetContestantId);
          } else if (transactionId) {
            contestantQuery = contestantQuery.eq("payment_reference", String(transactionId));
          } else if (user?.id) {
            contestantQuery = contestantQuery.eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
          }

          const { data: cData } = await contestantQuery.maybeSingle();

          if (cData && cData.payment_status === "completed") {
            const num = cData.category_number || cData.contestant_number || 1;
            const isFemale = cData.gender === "female" || cData.category === "miss_campus_guide";
            const code = cData.contestant_code || (isFemale ? `contestants_f_${String(num).padStart(2, "0")}` : `contestants_m_${String(num).padStart(2, "0")}`);

            setContestantDetails({
              id: cData.id,
              name: cData.name,
              code,
              number: num,
              gender: cData.gender,
              category: cData.category,
              department: cData.department,
              level: cData.level,
              coverPhotoUrl: cData.cover_photo_url,
            });

            unlocked = true;
          }
        } else if (paymentType === "pdf" || paymentType === "cbt") {
          if (user?.id) {
            const access = await fetchUserAccess(user.id);
            unlocked =
              paymentType === "pdf"
                ? access.pdf_access
                : access.cbt_access && !isCbtAccessExpired(access.cbt_expires_at);
          }
        } else if (paymentType === "ticket") {
          const userId = user?.id;
          if (userId) {
            const { data } = await supabase
              .from("event_tickets")
              .select("id, created_at")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1);

            if (data && data.length > 0) {
              const timeDiff = new Date().getTime() - new Date(data[0].created_at).getTime();
              unlocked = timeDiff < 300000; // 5 minutes
            }
          } else {
            // Guest ticket checkout
            unlocked = gatewayStatus?.toLowerCase() === "successful";
          }
        } else if (paymentType === "inspection") {
          const userId = user?.id;
          if (userId) {
            const { data } = await supabase
              .from("inspection_payments")
              .select("id, created_at")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1);

            if (data && data.length > 0) {
              const timeDiff = new Date().getTime() - new Date(data[0].created_at).getTime();
              unlocked = timeDiff < 300000; // 5 minutes
            }
          } else {
            // Guest inspection payment
            unlocked = gatewayStatus?.toLowerCase() === "successful";
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
          // For pageant, no auto-redirect — modal page stays open so contestant can read and copy codes!
          return;
        }

        attempts += 1;

        if (attempts >= maxAttempts) {
          setStatus("failed");
          setMessage(
            paymentType === "pageant"
              ? "Payment confirmation is taking slightly longer than usual. Please check back on the pageant page or contact support."
              : "Payment confirmation is taking longer than expected. Give it a minute, then check your dashboard."
          );
          return;
        }

        window.setTimeout(pollAccess, 2500);
      } catch {
        if (!cancelled) {
          attempts += 1;
          if (attempts >= maxAttempts) {
            setStatus("failed");
            setMessage("We could not confirm your payment right now. Please check your page shortly.");
            return;
          }
          window.setTimeout(pollAccess, 2500);
        }
      }
    };

    pollAccess();

    return () => {
      cancelled = true;
    };
  }, [gatewayStatus, paymentType, user?.id, navigate, searchParams]);

  // If pageant payment is confirmed, render dedicated pageant success modal page
  if (paymentType === "pageant" && status === "success" && contestantDetails) {
    return (
      <PageantSuccessModal
        isOpen={true}
        contestant={contestantDetails}
        isStandalonePage={true}
      />
    );
  }

  const getRedirectPath = () => {
    if (paymentType === "pageant") return "/pageant";
    if (paymentType === "ticket") return "/events";
    if (paymentType === "inspection") return "/accommodation";
    return "/post-utme";
  };

  const getRedirectLabel = () => {
    if (paymentType === "pageant") return "Go to Pageant Portal";
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
                ? "Payment Confirmed"
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
                      : paymentType === "pageant"
                        ? "Face of Campus Guide Pageant Registration"
                        : "Unknown"}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {status === "failed" && paymentType === "pageant" ? (
              <Link
                to="/pageant/register"
                className="rounded-lg px-5 py-3 text-center transition-opacity duration-150 hover:opacity-90"
                style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
              >
                Try Registration Again
              </Link>
            ) : (
              <Link
                to={getRedirectPath()}
                className="rounded-lg px-5 py-3 text-center transition-opacity duration-150 hover:opacity-90"
                style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
              >
                {getRedirectLabel()}
              </Link>
            )}
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