import { useState } from "react";
import { ChevronDown, KeyRound, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { initializeKorapayPayment } from "../lib/korapayPayment";
import { redeemCode } from "../lib/redeemCode";

interface PaymentModalProps {
  amount: number;
  title: string;
  description: string;
  benefitText: string;
  paymentType: "pdf" | "cbt";
  userId: string;
  userEmail: string;
  userName: string;
  course: string;
  onClose: () => void;
  onAccessGranted: (expiresAt: string | null) => Promise<void> | void;
}

export function PaymentModal({
  amount,
  title,
  description,
  benefitText,
  paymentType,
  userId,
  userEmail,
  userName,
  course,
  onClose,
  onAccessGranted,
}: PaymentModalProps) {
  const [startingPayment, setStartingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const unlockCodePlaceholder = paymentType === "pdf" ? "e.g. CGP-X7K2-M9QA" : "e.g. CGC-B3F1-N8WZ";

  const handlePaymentStart = async () => {
    setPaymentError(null);
    setStartingPayment(true);

    try {
      const checkoutUrl = await initializeCredoPayment({
        amount,
        paymentType,
        userId,
        email: userEmail,
        name: userName,
        course,
      });
      window.location.assign(checkoutUrl);
    } catch (error: any) {
      setPaymentError(error?.message || "Could not start payment. Please try again.");
      setStartingPayment(false);
    }
  };

  const handleRedeemCode = async () => {
    const trimmedCode = unlockCode.trim().toUpperCase();

    if (!trimmedCode) {
      setRedeemError("Please enter your unlock code.");
      return;
    }

    setRedeemError(null);
    setRedeeming(true);

    const result = await redeemCode(trimmedCode, userEmail, paymentType, userId);
    setRedeeming(false);

    if (!result.success) {
      setRedeemError(result.error ?? "Unable to redeem code. Please try again.");
      return;
    }

    await onAccessGranted(result.expiresAt ?? null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 transition-opacity hover:opacity-70"
          aria-label="Close"
        >
          <X size={24} color="#000000" />
        </button>

        <div className="mb-6 text-center">
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#2F4EA2" }}>{title}</h2>
          <p style={{ color: "#000000", opacity: 0.7 }}>{description}</p>
        </div>

        <div className="mb-6 rounded-lg bg-gray-50 p-6 text-center">
          <p className="mb-2" style={{ color: "#000000", opacity: 0.6, fontSize: "0.875rem" }}>
            Amount to pay
          </p>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2F4EA2" }}>N{amount.toLocaleString()}</div>
          <p style={{ color: "#000000", opacity: 0.6, fontSize: "0.875rem", marginTop: "0.5rem" }}>{benefitText}</p>
        </div>

        <button
          onClick={handlePaymentStart}
          disabled={startingPayment}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-3 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
        >
          {startingPayment ? <LoaderCircle size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
          {startingPayment ? "Opening Korapay..." : "Pay with Korapay"}
        </button>

        {paymentError ? <p className="mt-4 text-sm text-red-600">{paymentError}</p> : null}

        <p className="mt-4 text-sm" style={{ color: "#000000", opacity: 0.65 }}>
          After payment, we will confirm it automatically and unlock only the item you paid for.
        </p>

        <div className="mt-5 rounded-lg border border-gray-200 p-4">
          <button
            onClick={() => setShowCodeInput((current) => !current)}
            className="flex w-full items-center justify-between text-left"
            type="button"
          >
            <span className="flex items-center gap-2" style={{ color: "#2F4EA2", fontWeight: 600 }}>
              <KeyRound size={16} />
              Have an unlock code instead?
            </span>
            <ChevronDown
              size={16}
              color="#2F4EA2"
              className={`transition-transform ${showCodeInput ? "rotate-180" : ""}`}
            />
          </button>

          {showCodeInput ? (
            <div className="mt-4 space-y-3">
              <input
                value={unlockCode}
                onChange={(event) => setUnlockCode(event.target.value)}
                placeholder={unlockCodePlaceholder}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2"
                style={{ color: "#000000" }}
              />
              <p className="text-sm" style={{ color: "#000000", opacity: 0.6 }}>
                Enter your {paymentType === "pdf" ? "PDF" : "CBT"} code to unlock access immediately.
              </p>
              {redeemError ? <p className="text-sm text-red-600">{redeemError}</p> : null}
              <button
                onClick={handleRedeemCode}
                disabled={redeeming}
                className="w-full rounded-lg py-3 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#16a34a", color: "#FFFFFF", fontWeight: 500 }}
                type="button"
              >
                {redeeming ? "Unlocking..." : "Unlock with Code"}
              </button>
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center" style={{ fontSize: "0.75rem", color: "#000000", opacity: 0.5 }}>
          Secure payment powered by Credo
        </p>
      </div>
    </div>
  );
}
