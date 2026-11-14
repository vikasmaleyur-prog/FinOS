'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ArrowRight, Zap } from 'lucide-react';

interface RiskBannerProps {
  probBelowSafe: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' | string;
  firstBreachDate?: string | null;
  minSafeBalance: number;
  headline?: string;
  rootCause?: string;
  recommendations?: string[];
  lowestExpectedBalance?: number;
}

const formatRupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const RiskBanner: React.FC<RiskBannerProps> = ({
  probBelowSafe,
  riskLevel,
  firstBreachDate,
  minSafeBalance,
  headline,
  rootCause,
  recommendations,
  lowestExpectedBalance,
}) => {
  const isCritical = riskLevel === 'CRITICAL' || probBelowSafe >= 50;
  const isWarning = (riskLevel === 'WARNING' || probBelowSafe >= 20) && !isCritical;
  const severity = isCritical
    ? { label: 'Critical', color: 'var(--critical)', tint: 'var(--critical-tint)', text: 'var(--critical-dark)', border: 'var(--critical-border)' }
    : isWarning
      ? probBelowSafe >= 35
        ? { label: 'High', color: 'var(--warning)', tint: 'var(--warning-tint)', text: 'var(--warning-dark)', border: 'var(--warning-border)' }
        : { label: 'Medium', color: 'var(--medium)', tint: 'var(--purple-tint)', text: 'var(--primary)', border: 'var(--purple-soft)' }
      : { label: 'Low', color: 'var(--success)', tint: 'var(--success-tint)', text: 'var(--success-strong)', border: 'var(--success-border)' };
  const ringProgress = Math.max(0, Math.min(100, probBelowSafe));

  return (
    <section
      aria-label="Cash flow risk summary"
      className="relative overflow-hidden rounded-card border border-finos-border bg-finos-card p-6 shadow-card"
      style={{ borderLeft: `6px solid ${severity.color}` }}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex min-h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold"
              style={{ backgroundColor: severity.tint, color: severity.text, borderColor: severity.border }}
            >
              {isCritical ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              {severity.label} risk
            </span>
            {firstBreachDate && (
              <span className="inline-flex min-h-7 items-center rounded-full bg-finos-surface-hover px-3 text-xs font-medium text-finos-muted">
                Expected around {firstBreachDate}
              </span>
            )}
          </div>
          <h2 className="max-w-3xl text-2xl font-bold leading-tight text-finos-heading sm:text-[28px]">
            {headline || (isCritical
              ? `${probBelowSafe}% chance your balance drops below ${formatRupees.format(minSafeBalance)} around ${firstBreachDate || 'mid-month'}`
              : 'Your balance is expected to stay above your safe limit.')}
          </h2>
        </div>

        <div className="flex items-center justify-between gap-5 sm:min-w-[220px] sm:flex-col sm:items-end">
          <div
            className="grid h-24 w-24 shrink-0 place-items-center rounded-full p-2"
            style={{ background: `conic-gradient(${severity.color} ${ringProgress}%, var(--purple-soft) ${ringProgress}% 100%)` }}
            role="img"
            aria-label={`${probBelowSafe}% chance of falling below your safe balance`}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
              <span className="tabular-nums text-2xl font-bold text-finos-heading">
                {Math.round(probBelowSafe)}%
              </span>
            </div>
          </div>
          {lowestExpectedBalance !== undefined && (
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-finos-muted">Projected dip</p>
              <p className="tabular-nums text-2xl font-bold text-finos-critical-dark">
                {formatRupees.format(lowestExpectedBalance)}
              </p>
            </div>
          )}
        </div>
      </div>

      {rootCause && (
        <div className="mt-5 rounded-2xl border border-finos-purple-soft bg-finos-purple-tint p-6">
          <div className="mb-2 flex items-center gap-2">
            <Info size={18} className="shrink-0 text-finos-purple" aria-hidden="true" />
            <h3 className="text-sm font-bold text-finos-heading">Why this may happen</h3>
          </div>
          <p className="text-sm leading-relaxed text-finos-body">{rootCause}</p>
          <p className="mt-3 text-xs text-finos-body">
            Your safe balance is <strong className="tabular-nums font-semibold text-finos-heading">{formatRupees.format(minSafeBalance)}</strong>
            {firstBreachDate && <> · Expected window: <strong className="font-semibold text-finos-heading">{firstBreachDate}</strong></>}
          </p>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {recommendations.slice(0, 3).map((action, idx) => (
            <div
              key={idx}
              className="group flex min-h-12 items-center gap-2 rounded-2xl border border-finos-purple-soft bg-white px-3 py-2 text-sm font-medium text-finos-heading transition-colors hover:bg-finos-purple-tint"
            >
              <Zap size={16} className="shrink-0 text-finos-purple" aria-hidden="true" />
              <span className="min-w-0 flex-1">{action}</span>
              <ArrowRight size={15} className="shrink-0 text-finos-purple transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
