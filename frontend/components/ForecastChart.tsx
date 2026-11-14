'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { Layers } from 'lucide-react';

interface ForecastPoint {
  date: string;
  displayDate: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  scheduledFixed?: number;
  safeThreshold: number;
}

interface ForecastChartProps {
  data?: ForecastPoint[] | null;
  currentBalance?: number;
  minimumSafeBalance?: number;
  probBelowSafe?: number;
  breachDate?: string | null;
}

const formatRupees = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  currentBalance = 0,
  minimumSafeBalance = 5000,
  probBelowSafe = 0,
  breachDate
}) => {
  const [showConfidenceBand, setShowConfidenceBand] = useState(true);
  const [dayRange, setDayRange] = useState<30 | 45 | 60>(60);

  const safeData = data && Array.isArray(data) ? data : [];
  const displayData = safeData.slice(0, dayRange);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt: ForecastPoint = payload[0]?.payload;
      if (!pt) return null;
      return (
        <div className="min-w-[220px] space-y-2 rounded-2xl border border-finos-border bg-white p-4 text-sm text-finos-body shadow-card">
          <div className="flex items-center justify-between border-b border-finos-border pb-2">
            <span className="text-sm font-medium text-finos-muted">{pt.date}</span>
            {(pt.p50 || 0) < minimumSafeBalance && (
              <span className="rounded-full border border-finos-critical-border bg-finos-critical-tint px-2 py-1 text-xs font-semibold text-finos-critical-dark">
                Below safe limit
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span>Expected balance</span>
              <strong className="tabular-nums text-finos-purple">{formatRupees(pt.p50)}</strong>
            </div>
            {showConfidenceBand && (
              <>
                <div className="flex items-center justify-between gap-4 text-finos-muted">
                  <span>Higher estimate (P90)</span>
                  <span className="tabular-nums">{formatRupees(pt.p90)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-finos-muted">
                  <span>Lower estimate (P10)</span>
                  <span className="tabular-nums">{formatRupees(pt.p10)}</span>
                </div>
              </>
            )}
            {pt.scheduledFixed && pt.scheduledFixed > 0 && (
              <div className="flex items-center justify-between gap-4 border-t border-finos-border pt-2 text-finos-warning-dark">
                <span>Scheduled bill</span>
                <span className="tabular-nums">-{formatRupees(pt.scheduledFixed)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-finos-heading">
              60-day cash flow forecast
            </h2>
            <span className="rounded-full border border-finos-purple-soft bg-finos-purple-tint px-3 py-1.5 text-xs font-semibold text-finos-purple">
              1,000 simulated futures
            </span>
          </div>
          <p className="mt-1 text-sm text-finos-muted">
            Estimated balance from client payments, recurring bills and daily spending.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            aria-pressed={showConfidenceBand}
            className={`flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline ${
              showConfidenceBand
                ? 'border-finos-purple bg-finos-purple-tint text-finos-purple'
                : 'border-finos-control-border bg-white text-finos-body hover:bg-finos-surface-hover'
            }`}
          >
            <Layers size={16} aria-hidden="true" />
            <span>80% range</span>
          </button>
          <div className="flex min-h-11 items-center rounded-full border border-finos-control-border bg-white p-1">
            {([30, 45, 60] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setDayRange(days)}
                aria-pressed={dayRange === days}
                className={`min-h-9 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline ${
                  dayRange === days
                    ? 'bg-finos-purple text-white'
                    : 'text-finos-body hover:bg-finos-purple-tint'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full sm:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="finosConfidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.16} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-inter)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-inter)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={minimumSafeBalance}
              stroke="var(--critical)"
              strokeDasharray="5 4"
              label={{
                value: `Safe balance: ₹${minimumSafeBalance.toLocaleString('en-IN')}`,
                position: 'right',
                fill: 'var(--critical-dark)',
                fontSize: 12,
                fontFamily: 'var(--font-inter)'
              }}
            />
            {showConfidenceBand && (
              <Area
                type="monotone"
                dataKey="p90"
                stroke="transparent"
                fill="url(#finosConfidenceGradient)"
                name="80% confidence range"
              />
            )}
            {showConfidenceBand && (
              <Line
                type="monotone"
                dataKey="p10"
                stroke="var(--chart-baseline)"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                dot={false}
                name="Lower estimate (P10)"
              />
            )}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--card-background)', strokeWidth: 2 }}
              name="Median balance"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-finos-border pt-4 text-xs text-finos-muted">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-2 text-finos-body">
            <span className="h-2.5 w-2.5 rounded-full bg-finos-purple" />
            Median balance
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-4 rounded-sm border border-finos-purple-soft bg-finos-purple-tint" />
            80% confidence range (P10–P90)
          </span>
          <span className="inline-flex items-center gap-2 text-finos-critical-dark">
            <span className="h-0 w-4 border-t-2 border-dashed border-finos-critical" />
            Minimum safe balance
          </span>
        </div>
        <p>
          {breachDate ? `Possible dip around ${breachDate}` : `${Math.round(probBelowSafe)}% chance of going below your safe balance`}
        </p>
      </div>
      <span className="sr-only">Current balance is {formatRupees(currentBalance)}.</span>
    </section>
  );
};
