import { useRef, useState } from "react";
import { X, Upload, FileText, Image, CheckCircle2, ChevronDown } from "lucide-react";
import { uploadReceipt } from "../lib/receiptUpload";
import { redeemCode } from "../lib/redeemCode";

interface ReceiptUploadModalProps {
  paymentType: "pdf" | "cbt";
  userId: string;
  email: string;
  name: string;
  course: string;
  amount: number;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  onClose: () => void;
  onAccessGranted: (expiresAt: string | null) => void;
}

type Step = "instructions" | "upload" | "pending" | "code";

export function ReceiptUploadModal({
  paymentType,
  userId,
  email,
  name,
  course,
  amount,
  bankDetails,
  onClose,
  onAccessGranted,
}: ReceiptUploadModalProps) {
  const [step, setStep] = useState<Step>("instructions");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Please select your receipt file.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const result = await uploadReceipt({
      userId,
      email,
      name,
      course,
      paymentType,
      file,
    });

    setUploading(false);

    if (!result.success) {
      setUploadError(result.error ?? "Upload failed. Please try again.");
      return;
    }

    setStep("pending");
  };

  const handleRedeemCode = async () => {
    const trimmed = unlockCode.trim().toUpperCase();
    if (!trimmed) {
      setRedeemError("Please enter your unlock code.");
      return;
    }

    setRedeeming(true);
    setRedeemError(null);

    const result = await redeemCode(trimmed, email, paymentType, userId);
    setRedeeming(false);

    if (!result.success) {
      setRedeemError(result.error ?? "Invalid code. Please try again.");
      return;
    }

    onAccessGranted(result.expiresAt ?? null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 transition-opacity hover:opacity-70"
          aria-label="Close"
        >
          <X size={24} color="#000000" />
        </button>

        <h2 className="mb-1 pr-8" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#2F4EA2" }}>
          {paymentType === "pdf" ? "Unlock Past Questions" : "Unlock Live Tests"}
        </h2>
        <p className="mb-6" style={{ color: "#000000", opacity: 0.6, fontSize: "0.875rem" }}>
          {paymentType === "pdf" ? "One-time payment for permanent PDF access" : "Monthly subscription for unlimited CBT mock tests"}
        </p>

        {/* Amount */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 text-center">
          <p style={{ fontSize: "0.8rem", color: "#000000", opacity: 0.6 }}>Amount to pay</p>
          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#2F4EA2" }}>₦{amount.toLocaleString()}</p>
        </div>

        {step === "instructions" && (
          <>
            {/* Bank details */}
            <div className="mb-6 rounded-lg border border-gray-200 p-4 space-y-2">
              <p style={{ fontWeight: 600, color: "#000000", marginBottom: "0.5rem" }}>Transfer to:</p>
              <div className="flex justify-between">
                <span style={{ color: "#000000", opacity: 0.6, fontSize: "0.875rem" }}>Bank</span>
                <span style={{ fontWeight: 500, color: "#000000", fontSize: "0.875rem" }}>{bankDetails.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#000000", opacity: 0.6, fontSize: "0.875rem" }}>Account Number</span>
                <span style={{ fontWeight: 600, color: "#2F4EA2", fontSize: "0.875rem", letterSpacing: "0.05em" }}>{bankDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#000000", opacity: 0.6, fontSize: "0.875rem" }}>Account Name</span>
                <span style={{ fontWeight: 500, color: "#000000", fontSize: "0.875rem" }}>{bankDetails.accountName}</span>
              </div>
            </div>

            <p className="mb-4 text-sm" style={{ color: "#000000", opacity: 0.7 }}>
              After transferring, take a screenshot or save your bank receipt and click below to upload it for verification.
            </p>

            <button
              onClick={() => setStep("upload")}
              className="w-full rounded-lg py-3 transition-all hover:opacity-90"
              style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
            >
              I've Paid — Upload Receipt
            </button>

            {/* Code fallback */}
            <div className="mt-4">
              <button
                onClick={() => setShowCodeInput(!showCodeInput)}
                className="flex items-center gap-1 text-sm hover:underline"
                style={{ color: "#2F4EA2" }}
              >
                <ChevronDown size={14} />
                Have an unlock code instead?
              </button>
              {showCodeInput && (
                <div className="mt-3 space-y-2">
                  <input
                    value={unlockCode}
                    onChange={(e) => setUnlockCode(e.target.value)}
                    placeholder={paymentType === "pdf" ? "e.g. CGP-X7K2-M9QA" : "e.g. CGC-B3F1-N8WZ"}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ color: "#000000" }}
                  />
                  {redeemError && <p className="text-sm text-red-600">{redeemError}</p>}
                  <button
                    onClick={handleRedeemCode}
                    disabled={redeeming}
                    className="w-full rounded-lg py-3 transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#16a34a", color: "#FFFFFF", fontWeight: 500 }}
                  >
                    {redeeming ? "Verifying..." : "Unlock with Code"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {step === "upload" && (
          <>
            <p className="mb-4 text-sm" style={{ color: "#000000", opacity: 0.7 }}>
              Upload your payment receipt (screenshot, photo, or PDF). Max 5MB.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-blue-400"
            >
              {file ? (
                <>
                  {file.type.startsWith("image/") ? (
                    <Image size={32} color="#2F4EA2" />
                  ) : (
                    <FileText size={32} color="#2F4EA2" />
                  )}
                  <p className="mt-2 text-sm font-medium" style={{ color: "#2F4EA2" }}>{file.name}</p>
                  <p className="text-xs" style={{ color: "#000000", opacity: 0.5 }}>
                    {(file.size / 1024).toFixed(0)}KB — click to change
                  </p>
                </>
              ) : (
                <>
                  <Upload size={32} color="#BFC3C6" />
                  <p className="mt-2 text-sm" style={{ color: "#000000", opacity: 0.6 }}>
                    Click to select receipt (JPG, PNG, or PDF)
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploadError && <p className="mb-3 text-sm text-red-600">{uploadError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("instructions")}
                className="flex-1 rounded-lg py-3 border border-gray-300 transition-all hover:bg-gray-50"
                style={{ color: "#000000", fontWeight: 500 }}
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="flex-1 rounded-lg py-3 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
              >
                {uploading ? "Uploading..." : "Submit Receipt"}
              </button>
            </div>
          </>
        )}

        {step === "pending" && (
          <div className="text-center">
            <CheckCircle2 size={48} color="#16a34a" className="mx-auto mb-4" />
            <h3 className="mb-2" style={{ fontSize: "1.125rem", fontWeight: 600, color: "#000000" }}>
              Receipt Submitted!
            </h3>
            <p className="mb-6 text-sm" style={{ color: "#000000", opacity: 0.7 }}>
              Your receipt is under review. Once approved, your access will be unlocked instantly and you will receive a confirmation email.
            </p>
            <p className="mb-6 text-sm" style={{ color: "#000000", opacity: 0.5 }}>
              Reviews typically take a few hours. You can close this and check back later.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg py-3 transition-all hover:opacity-90"
              style={{ backgroundColor: "#2F4EA2", color: "#FFFFFF", fontWeight: 500 }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
