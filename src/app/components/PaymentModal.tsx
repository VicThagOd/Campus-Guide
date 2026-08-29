import { useState } from "react";
import { Cancel01Icon, Loading01Icon, Shield01Icon } from "hugeicons-react";
import { initializeFlutterwavePayment } from "../lib/flutterwavePayment";

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

  const handlePaymentStart = async () => {
    setPaymentError(null);
    setStartingPayment(true);

    try {
      const checkoutUrl = await initializeFlutterwavePayment({
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 transition-opacity hover:opacity-70"
          aria-label="Close"
        >
          <Cancel01Icon size={24} color="#000000" />
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
          style={{ backgroundColor: "#F5A623", color: "#FFFFFF", fontWeight: 500 }}
        >
          {startingPayment ? <Loading01Icon size={18} className="animate-spin" /> : <Shield01Icon size={18} />}
          {startingPayment ? "Opening Flutterwave..." : "Pay with Flutterwave"}
        </button>

        {paymentError ? <p className="mt-4 text-sm text-red-600">{paymentError}</p> : null}

        <p className="mt-4 text-sm" style={{ color: "#000000", opacity: 0.65 }}>
          After payment, we will confirm it automatically and unlock only the item you paid for.
        </p>

        <p className="mt-6 text-center" style={{ fontSize: "0.75rem", color: "#000000", opacity: 0.5 }}>
          Secure payment powered by Flutterwave
        </p>
      </div>
    </div>
  );
}