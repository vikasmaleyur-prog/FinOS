'use client';

import React from 'react';
import { AlertTriangle, Info, CheckCircle2, Calendar } from 'lucide-react';

interface RiskBannerProps {
  probBelowSafe: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' | string;
  firstBreachDate?: string | null;
  breachDateRange?: { start: string; end: string; label: string } | null;
  minSafeBalance: number;
  headline?: string;
  rootCause?: string;
  recommendations?: string[];
  lowestExpectedBalance?: number;
  topDrivers?: Array<{ driver: string; amount: number; impact_type: string; impact_detail: string }>;
  billsBeforeInflow?: Array<{ merchant: string; amount: number; due_date: string; category: string }>;
  expectedInflowGapDays?: number;
}

export const RiskBanner: React.FC<RiskBannerProps> = ({
  probBelowSafe,
  riskLevel,
  firstBreachDate,
  breachDateRange,
  minSafeBalance,
  headline,
  rootCause,
  recommendations,
  lowestExpectedBalance,
  topDrivers,
  billsBeforeInflow,
  expectedInflowGapDays
}) => {
  const isCritical = riskLevel === 'CRITICAL' || probBelowSafe >= 50;
  const isWarning = (riskLevel === 'WARNING' || probBelowSafe >= 20) && !isCritical;
  const isHealthy = !isCritical && !isWarning;

  const riskBadgeStyle = isCritical
    ? 'bg-[#FDF1F2] text-[#E64B55] border-[#F9B8BC]'
    : isWarning
    ? 'bg-[#FEF7EC] text-[#8F5805] border-[#FBD9A3]'
    : 'bg-[#E8F8F2] text-[#0E684C] border-[#B4E8D6]';

  const riskLabel = isCritical
    ? 'Critical risk'
    : isWarning
    ? 'Warning risk'
    : 'Healthy status';

  const ringStrokeColor = isCritical ? '#E64B55' : isWarning ? '#F5A623' : '#159B72';

  // SVG Circular Ring calculation (radius = 36, circumference = 2 * Math.PI * 36 ≈ 226.19)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, probBelowSafe)) / 100) * circumference;

  // Expected window label
  const expectedDateText = breachDateRange?.label || (firstBreachDate ? `${firstBreachDate}` : '09 Dec 2026');

  // Projected Dip value calculation
  const dipAmount = lowestExpectedBalance !== undefined
    ? Math.round(lowestExpectedBalance < 0 ? lowestExpectedBalance : (lowestExpectedBalance - minSafeBalance))
    : -7166;

  const dipDisplay = dipAmount < 0 
    ? `-₹${Math.abs(dipAmount).toLocaleString('en-IN')}` 
    : `₹${dipAmount.toLocaleString('en-IN')}`;

  return (
    <div className="bg-white border border-[#ECE7F2] rounded-[24px] p-6 sm:p-7 shadow-[0_8px_30px_rgba(118,80,168,0.05)] transition-all hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)]">
      {/* Top Section: Badges + Headline on Left, Circular Ring + Projected Dip on Right */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-5">
        {/* Left Column */}
        <div className="flex-1 min-w-0 pr-0 md:pr-4">
          {/* Pills / Badges Row */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${riskBadgeStyle}`}>
              {isCritical ? (
                <AlertTriangle size={13} className="text-[#E64B55]" />
              ) : isWarning ? (
                <AlertTriangle size={13} className="text-[#F5A623]" />
              ) : (
                <CheckCircle2 size={13} className="text-[#159B72]" />
              )}
              <span>{riskLabel}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#F7F5FA] text-[#77758A] border border-[#ECE7F2]">
              <Calendar size={12} className="text-[#77758A]" />
              <span>Expected around {expectedDateText}</span>
            </span>
          </div>

          {/* Large Bold Headline */}
          <h2 className="text-xl sm:text-[26px] font-bold text-[#17152D] tracking-tight leading-snug">
            {headline || (isCritical || isWarning
              ? `${Math.round(probBelowSafe)}% probability of balance dropping below ₹${minSafeBalance.toLocaleString('en-IN')} around ${expectedDateText}`
              : `Cash flow position stable: Balance safely maintained above ₹${minSafeBalance.toLocaleString('en-IN')}`)}
          </h2>
        </div>

        {/* Right Column: Circular Progress Ring & Projected Dip */}
        <div className="flex flex-row md:flex-col items-center justify-between md:justify-center shrink-0 pt-2 md:pt-0 gap-4 sm:gap-6 md:gap-2">
          {/* Circular SVG Ring */}
          <div className="relative w-22 h-22 flex items-center justify-center">
            <svg className="w-22 h-22 transform -rotate-90" viewBox="0 0 88 88">
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke="#F3EDFA"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke={ringStrokeColor}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-xl font-bold text-[#17152D] tabular-nums">
              {Math.round(probBelowSafe)}%
            </span>
          </div>

          {/* Projected Dip Metric */}
          <div className="text-right md:text-center">
            <span className="block text-[10px] font-bold tracking-wider text-[#77758A] uppercase">
              PROJECTED DIP
            </span>
            <span className="block text-xl sm:text-2xl font-bold text-[#E64B55] tabular-nums mt-0.5">
              {dipDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Light Lavender AI Explanation Panel ("Why this may happen") */}
      <div className="mt-1 p-5 rounded-[20px] bg-[#FAF7FD] border border-[#ECE7F2]">
        <div className="flex items-center space-x-2 mb-2 text-sm font-bold text-[#17152D]">
          <Info size={16} className="text-[#7650A8]" />
          <span>Why this may happen</span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-[#3B3552]">
          {rootCause || (
            `Cash timing asymmetry detected. You have ₹0 in fixed obligations (Rent & Loans) due early in the month, while your irregular freelance income (averaging ₹2,455) has an arrival interval of ~3.3 days. Daily variable burn (~₹1,058/day) further erodes your liquidity buffer.`
          )}
        </p>
        <div className="text-xs text-[#77758A] mt-2.5 font-medium flex items-center space-x-2">
          <span>Your safe balance is <strong>₹{minSafeBalance.toLocaleString('en-IN')}</strong></span>
          <span>·</span>
          <span>Expected window: <strong>{expectedDateText}</strong></span>
        </div>
      </div>
    </div>
  );
};
