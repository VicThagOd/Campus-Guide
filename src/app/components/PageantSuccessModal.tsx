import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RiVipCrownLine,
  RiCheckFill,
  RiFileCopyLine,
  RiShareLine,
  RiTimeLine,
  RiSparklingFill,
  RiCloseLine,
  RiArrowRightLine,
  RiHome5Line,
} from "react-icons/ri";

export interface PageantContestantDetails {
  id?: string;
  name: string;
  code: string;
  number: number | string;
  gender: "male" | "female";
  category?: string;
  department?: string;
  level?: string;
  coverPhotoUrl?: string;
}

interface PageantSuccessModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  contestant: PageantContestantDetails;
  isStandalonePage?: boolean;
}

export function PageantSuccessModal({
  isOpen = true,
  onClose,
  contestant,
  isStandalonePage = false,
}: PageantSuccessModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const isFemale = contestant.gender === "female" || contestant.category === "miss_campus_guide";
  const numValue = typeof contestant.number === "number" ? contestant.number : parseInt(String(contestant.number), 10) || 1;
  const formattedNumber = `Contestant ${isFemale ? "F" : "M"}-${String(numValue).padStart(2, "0")}`;
  const categoryTitle = isFemale ? "Miss Campus Guide 2026" : "Mr Campus Guide 2026";
  const contestantCode = contestant.code || (isFemale ? `contestants_f_${String(numValue).padStart(2, "0")}` : `contestants_m_${String(numValue).padStart(2, "0")}`);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(contestantCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleCopyAll = async () => {
    const textToCopy = `👑 FACE OF CAMPUS GUIDE 2026\nContestant: ${contestant.name}\nCategory: ${categoryTitle}\nContestant Number: ${formattedNumber}\nContestant Code: ${contestantCode}\n\n📢 Voting has not started yet. Please wait for official updates and announcements on voting dates and guidelines!`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${contestant.name} - Face of Campus Guide 2026`,
      text: `👑 I am officially registered as ${formattedNumber} (${contestantCode}) for ${categoryTitle}! Voting has not commenced yet — stay tuned for updates!`,
      url: window.location.origin + "/pageant",
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyAll();
    }
  };

  const cardContent = (
    <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all">
      {/* Top Banner Accent */}
      <div className="h-2 w-full bg-[#2F4EA2]" />

      {/* Close button (if modal overlay) */}
      {!isStandalonePage && onClose && (
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <RiCloseLine className="h-5 w-5" />
        </button>
      )}

      <div className="p-6 sm:p-8">
        {/* Verification Status Pill & Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
              <RiVipCrownLine className="h-9 w-9 text-amber-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
              <RiCheckFill className="h-4 w-4 stroke-[2]" />
            </div>
          </div>

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Payment Confirmed • Registration Active
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Registration Successful!
          </h2>
          <p className="mt-1 text-sm text-gray-600 max-w-md">
            Welcome <strong className="text-gray-900">{contestant.name}</strong>. Your payment has been verified and your profile is officially enrolled in <span className="font-semibold text-[#2F4EA2]">{categoryTitle}</span>.
          </p>
        </div>

        {/* Contestant Highlighted Identification Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Contestant Number */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-left">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Contestant Number
            </div>
            <div className="mt-1.5 text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {formattedNumber}
            </div>
            <div className="mt-1 text-xs text-gray-500 font-medium">
              Official participant number
            </div>
          </div>

          {/* Card 2: Contestant Code */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-left flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#2F4EA2]">
                Contestant Code
              </div>
              <div className="mt-1.5 font-mono text-lg sm:text-xl font-bold text-[#2F4EA2] tracking-wide break-all">
                {contestantCode}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center justify-between">
              <span className="text-xs text-gray-500">Unique voting tag</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#2F4EA2] border border-blue-300 shadow-2xs hover:bg-blue-50 transition-colors"
              >
                {copiedCode ? (
                  <>
                    <RiCheckFill className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <RiFileCopyLine className="h-3.5 w-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CRITICAL VOTING ADVISORY NOTICE */}
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50/70 p-4 sm:p-5 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <RiTimeLine className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-950">
                Important Voting Information
              </h4>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-amber-900/90">
                <strong>Voting has not commenced yet.</strong> Please wait for more information regarding official voting dates, voting guidelines, and the launch of the voting portal.
              </p>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-amber-900/90">
                Keep your <strong>Contestant Code ({contestantCode})</strong> safe. Once voting officially opens, you will share this code with your friends, fans, and supporters to vote for you.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F4EA2] px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-900 transition-colors"
          >
            {copiedAll ? (
              <>
                <RiCheckFill className="h-4 w-4" />
                <span>Details Copied to Clipboard</span>
              </>
            ) : (
              <>
                <RiFileCopyLine className="h-4 w-4" />
                <span>Copy Contestant Info</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors"
          >
            <RiShareLine className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
          <Link
            to="/pageant"
            className="inline-flex items-center gap-1 font-semibold text-[#2F4EA2] hover:underline"
          >
            <span>Visit Pageant Hub</span>
            <RiArrowRightLine className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <RiHome5Line className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] px-4 py-10 sm:py-16 flex items-center justify-center">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      {cardContent}
    </div>
  );
}
