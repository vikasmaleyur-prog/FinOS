'use client';

import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Calendar, Flame } from 'lucide-react';

interface MetricsRowProps {
  currentBalance: number;
  inflows30d: number;
  outflows30d: number;
  netFlow30d: number;
  fixedMonthly: number;
  meanDailyBurn: number;
  minimumSafeBalance: number;
}

const formatRupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const MetricsRow: React.FC<MetricsRowProps> = ({
  currentBalance,
  inflows30d,
  outflows30d,
  netFlow30d,
  fixedMonthly,
  meanDailyBurn,
  minimumSafeBalance
}) => {
  const discretionaryBurn = meanDailyBurn > 0 ? meanDailyBurn : 850;
  const daysOfRunway = Math.max(
    0,
    Math.round((currentBalance - minimumSafeBalance) / (discretionaryBurn + (fixedMonthly / 30)))
  );

  const cards = [
    {
      label: 'Current Liquidity',
      value: formatRupees.format(Math.round(currentBalance)),
      caption: 'Current ledger balance',
      icon: Wallet,
      iconClass: 'bg-finos-purple-tint text-finos-purple',
      badge: 'Available now',
      badgeClass: 'bg-finos-purple-tint text-finos-purple',
    },
    {
      label: '30-Day Net Flow',
      value: `${netFlow30d >= 0 ? '+' : ''}${formatRupees.format(Math.round(netFlow30d))}`,
      caption: `${formatRupees.format(Math.round(inflows30d))} in · ${formatRupees.format(Math.round(outflows30d))} out`,
      icon: netFlow30d >= 0 ? TrendingUp : TrendingDown,
      iconClass: netFlow30d >= 0 ? 'bg-finos-success-tint text-finos-success-strong' : 'bg-finos-critical-tint text-finos-critical-dark',
      badge: netFlow30d >= 0 ? 'Positive flow' : 'Negative flow',
      badgeClass: netFlow30d >= 0 ? 'bg-finos-success-tint text-finos-success-strong' : 'bg-finos-critical-tint text-finos-critical-dark',
    },
    {
      label: 'Monthly Fixed Bills',
      value: formatRupees.format(Math.round(fixedMonthly)),
      caption: 'Rent, EMI and subscriptions',
      icon: Calendar,
      iconClass: 'bg-finos-warning-tint text-finos-warning-dark',
      badge: 'Recurring',
      badgeClass: 'bg-finos-warning-tint text-finos-body',
    },
    {
      label: 'Zero-Inflow Buffer',
      value: `${daysOfRunway} days`,
      caption: `At about ${formatRupees.format(Math.round(discretionaryBurn))}/day`,
      icon: Flame,
      iconClass: 'bg-finos-critical-tint text-finos-critical-dark',
      badge: 'Without new income',
      badgeClass: 'bg-finos-critical-tint text-finos-critical-dark',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, caption, icon: Icon, iconClass, badge, badgeClass }) => (
        <article
          key={label}
          className="rounded-card border border-finos-border bg-finos-card p-6 shadow-card transition-shadow hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-finos-muted">{label}</h3>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass}`}>
              <Icon size={19} aria-hidden="true" />
            </span>
          </div>
          <p className="tabular-nums break-words text-[26px] font-bold leading-tight text-finos-heading sm:text-[28px]">
            {value}
          </p>
          <p className="mt-2 min-h-9 text-xs leading-relaxed text-finos-muted">{caption}</p>
          <span className={`mt-3 inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium ${badgeClass}`}>
            {badge}
          </span>
        </article>
      ))}
    </div>
  );
};
