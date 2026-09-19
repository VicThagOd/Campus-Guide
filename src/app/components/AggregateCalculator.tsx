import React, { useState } from 'react';
import { SiWhatsapp } from 'react-icons/si';
import { whatsappLink, whatsappMessages } from '../../lib/whatsapp';

const PRIMARY = '#2F4EA2';
const INK = '#111827';
const MUTED = '#6B7280';
const BORDER = '#BFC3C6';

export function AggregateCalculator() {
  const [jambScore, setJambScore] = useState<string>('');
  const [postUtmeScore, setPostUtmeScore] = useState<string>('');

  const jambNum = parseFloat(jambScore);
  const postUtmeNum = parseFloat(postUtmeScore);

  const isValidJamb = !isNaN(jambNum) && jambNum >= 0 && jambNum <= 400;
  const isValidPostUtme = !isNaN(postUtmeNum) && postUtmeNum >= 0 && postUtmeNum <= 400;

  let aggregateScore: number | null = null;
  let aggregatePercentage: number | null = null;
  let averageOver400: number | null = null;

  if (isValidJamb && isValidPostUtme) {
    // Formula: ((post utme/400 + jamb/400) / 2)
    aggregateScore = ((postUtmeNum / 400) + (jambNum / 400)) / 2;
    aggregatePercentage = aggregateScore * 100;
    averageOver400 = (jambNum + postUtmeNum) / 2;
  }

  const handleReset = () => {
    setJambScore('');
    setPostUtmeScore('');
  };

  return (
    <div className="rounded-2xl border bg-white p-6 sm:p-8 shadow-sm" style={{ borderColor: BORDER }}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FC] text-[#2F4EA2]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </span>
            <h3 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
              Aggregate Score Calculator
            </h3>
          </div>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: MUTED }}>
            Calculate your official UNIPORT aggregate score using the formula: <b>(Post-UTME/400 + JAMB/400) / 2</b>
          </p>
        </div>

        {(jambScore || postUtmeScore) && (
          <button
            type="button"
            onClick={handleReset}
            className="self-start text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors py-1.5 px-3 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* JAMB Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: INK }}>
            JAMB UTME Score (Out of 400)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={400}
              placeholder="e.g. 265"
              value={jambScore}
              onChange={(e) => setJambScore(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#2F4EA2] focus:ring-2 focus:ring-blue-100 outline-hidden text-base font-semibold transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
              / 400
            </span>
          </div>
          {jambScore && !isValidJamb && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">Please enter a score between 0 and 400</p>
          )}
        </div>

        {/* Post-UTME Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: INK }}>
            UNIPORT Post-UTME Score (Out of 400)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={400}
              placeholder="e.g. 280"
              value={postUtmeScore}
              onChange={(e) => setPostUtmeScore(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#2F4EA2] focus:ring-2 focus:ring-blue-100 outline-hidden text-base font-semibold transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
              / 400
            </span>
          </div>
          {postUtmeScore && !isValidPostUtme && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">Please enter a score between 0 and 400</p>
          )}
        </div>
      </div>

      {/* Result Card */}
      {aggregateScore !== null && aggregatePercentage !== null && averageOver400 !== null ? (
        <div className="rounded-xl p-6 border border-blue-100 bg-[#F7F9FD] space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
            <div>
              <p className="text-xs font-semibold text-blue-900/70 uppercase tracking-wider">
                Your Calculated Aggregate
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-[#2F4EA2]">
                  {aggregatePercentage.toFixed(2)}%
                </span>
                <span className="text-sm font-medium text-gray-500">
                  ({averageOver400.toFixed(1)} / 400 points)
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 text-[#2F4EA2] text-xs font-bold self-start">
              <span>Ratio: 50% JAMB + 50% Post-UTME</span>
            </div>
          </div>

          {/* Breakdown Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block font-medium">JAMB Weight (50%)</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">
                {(jambNum / 400 * 50).toFixed(2)}%
              </span>
              <span className="text-[11px] text-gray-500">({jambNum} / 400)</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block font-medium">Post-UTME Weight (50%)</span>
              <span className="font-bold text-gray-800 text-sm mt-0.5 block">
                {(postUtmeNum / 400 * 50).toFixed(2)}%
              </span>
              <span className="text-[11px] text-gray-500">({postUtmeNum} / 400)</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block font-medium">Total Aggregate</span>
              <span className="font-bold text-[#2F4EA2] text-sm mt-0.5 block">
                {aggregatePercentage.toFixed(2)}%
              </span>
              <span className="text-[11px] text-gray-500">Score: {aggregateScore.toFixed(4)}</span>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-3 text-xs text-amber-900 leading-relaxed">
            💡 <b>Admissions Note:</b> There is no cut-off mark for UNIPORT admissions. Admission decisions are based on department quotas, applicant volume, and overall performance ranking.
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-6 border border-dashed border-gray-200 text-center bg-gray-50/50">
          <p className="text-sm font-medium text-gray-500">
            Enter both your JAMB and Post-UTME scores above to see your instant aggregate score calculation.
          </p>
        </div>
      )}

      {/* WhatsApp Guidance */}
      <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-500 text-center sm:text-left">
          Need advice on course competitiveness or admission guidance for your aggregate score?
        </p>
        <a
          href={whatsappLink(whatsappMessages.generalInquiry())}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-opacity duration-150 hover:opacity-90 shrink-0"
          style={{ backgroundColor: '#25D366' }}
        >
          <SiWhatsapp size={15} />
          Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
