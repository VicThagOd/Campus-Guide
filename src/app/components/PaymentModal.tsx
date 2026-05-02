import { useState } from "react";
import { X, CheckCircle2, ExternalLink } from "lucide-react";
import { redeemCode } from "../lib/redeemCode";

interface PaymentModalProps {
  amount: number;
  title: string;
  description: string;
  benefitText: string;
  paymentLink: string;
  codeType: "pdf" | "cbt";
  userEmail: string;
  onClose: () => void;
  onPaymentVerified: (expiresAt: string | null) => void;
}

export function PaymentModal({
  amount,
  title,
  description,
  benefitText,
  paymentLink,
  codeType,
  userEmail,
  onClose,
  onPaymentVerified,
}: PaymentModalProps) {
  const [paymentMade, setPaymentMade] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const isValidUnlockCode = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    const pattern = codeType === "pdf" ? /^CGP-[A-Z0-9]{4}-[A-Z0-9]{4}$/ : /^CGC-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(trimmed);
  };

  const handlePaymentStart = () => {
    window.open(paymentLink, "_blank", "noopener,noreferrer");
    setPaymentMade(true);
  };

  const handleRedeemCode = async () => {
    const trimmedCode = unlockCode.trim().toUpperCase();

    if (!trimmedCode) {
      setRedeemError("Please enter your unlock code from your receipt email.");
      return;
    }

    if (!isValidUnlockCode(trimmedCode)) {
      setRedeemError(
        `Enter a valid ${codeType === "pdf" ? "PDF" : "CBT"} unlock code in the format ${codeType === "pdf" ? "CGP" : "CGC"}-XXXX-XXXX.`,
      );
      return;
    }

    setRedeemError(null);
    setRedeeming(true);

    const result = await redeemCode(trimmedCode, userEmail, codeType);
    setRedeeming(false);

    if (!result.success) {
      setRedeemError(result.error ?? "Unable to redeem code. Please try again.");
      return;
    }

    onPaymentVerified(result.expiresAt);
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

        <div className="space-y-4">
          <button
            onClick={handlePaymentStart}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 transition-all hover:opacity-90"
            style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
          >
            Pay with Credo
            <ExternalLink size={18} />
          </button>

          {paymentMade && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 size={20} color="#16a34a" />
                <p style={{ color: "#16a34a", fontWeight: 500 }}>Payment window opened</p>
              </div>
              <p className="mb-4" style={{ fontSize: "0.875rem", color: "#000000", opacity: 0.7 }}>
                After payment, enter the code from your receipt email below to unlock access.
              </p>
              <input
                value={unlockCode}
                onChange={(event) => setUnlockCode(event.target.value)}
                placeholder="e.g. CGP-X7K2-M9QA"
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2"
                style={{ color: "#000000" }}
              />
              <p className="mb-3 text-sm text-slate-500">
                Code must use uppercase letters, digits, dashes, and match the receipt format.
              </p>
              {redeemError && <p className="mb-3 text-sm text-red-600">{redeemError}</p>}
              <button
                onClick={handleRedeemCode}
                disabled={redeeming}
                className="w-full rounded-lg py-3 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#16a34a", color: "#FFFFFF", fontWeight: 500 }}
              >
                {redeeming ? "Unlocking..." : "Unlock Access"}
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center" style={{ fontSize: "0.75rem", color: "#000000", opacity: 0.5 }}>
          Secure payment powered by Credo
        </p>
      </div>
    </div>
  );
}
