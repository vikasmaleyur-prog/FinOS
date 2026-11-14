'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';

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

  const badgeColor = isCritical
    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    : isWarning
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : 'bg-[#d9f154]/10 text-[#d9f154] border-[#d9f154]/30';

  const containerGlow = isCritical
    ? 'border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-[#131418] to-[#131418]'
    : isWarning
    ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-[#131418] to-[#131418]'
    : 'border-white/[0.08] bg-[#121418]';

  return (
    <div className={`rounded-xl border p-5 relative overflow-hidden transition-all duration-200 ${containerGlow}`}>
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            {isCritical && <AlertTriangle className="text-rose-400" size={20} />}
            {isWarning && <AlertTriangle className="text-amber-400" size={20} />}
            {isHealthy && <CheckCircle2 className="text-[#d9f154]" size={20} />}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold ${badgeColor}`}>
                {riskLevel} RISK • {probBelowSafe}% BREACH PROBABILITY
              </span>
              {firstBreachDate && (
                <span className="text-[11px] font-mono text-white/50">
                  Breach window: ~{firstBreachDate}
                </span>
              )}
            </div>

            <h3 className="text-base font-semibold text-white mt-1">
              {headline || (isCritical
                ? `${probBelowSafe}% chance your balance drops below ₹${minSafeBalance.toLocaleString('en-IN')} around ${firstBreachDate || 'mid-month'}`
                : `60-Day Cash Flow Stable: Safe balance buffer intact`)}
            </h3>
          </div>
        </div>

        {lowestExpectedBalance !== undefined && (
          <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 border-white/[0.06] pt-2 md:pt-0">
            <span className="text-[11px] font-mono text-white/40 uppercase">Projected Dip</span>
            <span className={`text-base font-mono font-bold ${lowestExpectedBalance < minSafeBalance ? 'text-rose-400' : 'text-white'}`}>
              ₹{Math.round(lowestExpectedBalance).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Root Cause Explainability */}
      {rootCause && (
        <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/[0.05] text-xs text-white/80 leading-relaxed font-sans">
          <span className="font-semibold text-white flex items-center space-x-1.5 mb-1 text-[11px] text-white/90">
            <Info size={13} className="text-[#d9f154]" />
            <span>Root-Cause Asymmetry Analysis:</span>
          </span>
          <p className="text-white/70">{rootCause}</p>
        </div>
      )}

      {/* Top Simulation Drivers */}
      {topDrivers && topDrivers.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/[0.06]">
          <div className="text-[11px] font-mono text-white/50 mb-2 flex items-center justify-between">
            <span>Primary Outflow Drivers Impacting Liquidity Dip:</span>
            {expectedInflowGapDays && <span>Next payout clearance in ~{expectedInflowGapDays} days</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {topDrivers.map((driver, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-white/85 font-semibold block truncate max-w-[170px]" title={driver.driver}>
                    {driver.driver}
                  </span>
                  <span className="text-[10px] text-white/40 block truncate max-w-[170px]">
                    {driver.impact_detail}
                  </span>
                </div>
                <span className="text-rose-400 font-bold ml-2 shrink-0">
                  -₹{Math.round(driver.amount).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Remedies */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {recommendations?.map((action, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-1.5 text-[11px] font-medium text-white/85 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-md border border-white/[0.08] transition-colors"
            >
              <Zap size={11} className="text-[#d9f154]" />
              <span>{action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
