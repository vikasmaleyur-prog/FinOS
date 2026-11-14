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
import { TrendingDown, ShieldAlert, Sparkles, Layers } from 'lucide-react';

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
  probBelowZero?: number;
  breachDate?: string | null;
  dataSufficiency?: { level: string; badge: string; history_days?: number };
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  currentBalance = 0,
  minimumSafeBalance = 5000,
  probBelowSafe = 0,
  probBelowZero = 0,
  breachDate,
  dataSufficiency
}) => {
  const [showConfidenceBand, setShowConfidenceBand] = useState(true);
  const [dayRange, setDayRange] = useState<7 | 15 | 30 | 60 | 90>(60);

  const safeData = data && Array.isArray(data) ? data : [];
  const displayData = safeData.slice(0, dayRange);

  // Custom Ramp-styled Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt: ForecastPoint = payload[0]?.payload;
      if (!pt) return null;
      return (
        <div className="p-3.5 rounded-xl bg-[#0F1014] border border-white/[0.12] shadow-2xl backdrop-blur-md min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
            <span className="text-xs font-mono font-medium text-white/50">{pt.date}</span>
            {(pt.p50 || 0) < minimumSafeBalance && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Breach Risk
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Expected Median (P50):</span>
              <span className="font-bold text-[#d9f154]">₹{Math.round(pt.p50 || 0).toLocaleString('en-IN')}</span>
            </div>

            {showConfidenceBand && (
              <>
                <div className="flex items-center justify-between text-[11px] text-white/40">
                  <span>P90 (Optimistic):</span>
                  <span className="text-white/80">₹{Math.round(pt.p90 || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/40">
                  <span>P10 (Pessimistic):</span>
                  <span className="text-rose-400/90">₹{Math.round(pt.p10 || 0).toLocaleString('en-IN')}</span>
                </div>
              </>
            )}

            {pt.scheduledFixed && pt.scheduledFixed > 0 ? (
              <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-amber-400">
                <span>Scheduled Outflow:</span>
                <span>-₹{Math.round(pt.scheduledFixed).toLocaleString('en-IN')}</span>
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {dayRange}-Day Stochastic Cash Flow Trajectory
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d9f154]/10 text-[#d9f154] border border-[#d9f154]/20 font-semibold">
              1,000 MONTE CARLO RUNS
            </span>
            {probBelowZero > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                Zero-Breach Risk: {probBelowZero}%
              </span>
            )}
            {dataSufficiency && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${
                dataSufficiency.level === 'LOW'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {dataSufficiency.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-1">
            Simulates irregular client invoices, known recurring bills, and daily living burn rate.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Confidence Band Toggle */}
          <button
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              showConfidenceBand
                ? 'bg-white/[0.08] text-white border-white/[0.14]'
                : 'text-white/40 border-transparent hover:text-white'
            }`}
          >
            <Layers size={13} className={showConfidenceBand ? 'text-[#E2FD52]' : ''} />
            <span>80% CI</span>
          </button>

          {/* Time range pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs font-mono">
            {([7, 15, 30, 60, 90] as const).map((days) => (
              <button
                key={days}
                onClick={() => setDayRange(days)}
                className={`px-2 py-1 rounded-md transition-all text-[11px] ${
                  dayRange === days
                    ? 'bg-[#1D2027] text-white font-medium shadow-sm'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              {/* Neon Lime Shaded Confidence Area */}
              <linearGradient id="rampConfidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d9f154" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#d9f154" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="#525562"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="#525562"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Minimum Safe Balance Line */}
            <ReferenceLine
              y={minimumSafeBalance}
              stroke="#EF4444"
              strokeDasharray="4 4"
              label={{
                value: `Safe Buffer: ₹${minimumSafeBalance.toLocaleString('en-IN')}`,
                position: 'right',
                fill: '#EF4444',
                fontSize: 10,
                fontFamily: 'monospace'
              }}
            />

            {/* Shaded 80% Confidence Interval */}
            {showConfidenceBand && (
              <Area
                type="monotone"
                dataKey="p90"
                stroke="transparent"
                fill="url(#rampConfidenceGradient)"
                name="80% CI"
              />
            )}

            {showConfidenceBand && (
              <Line
                type="monotone"
                dataKey="p10"
                stroke="rgba(239, 68, 68, 0.5)"
                strokeDasharray="2 2"
                strokeWidth={1.2}
                dot={false}
              />
            )}

            {/* Expected Median Trajectory (P50) */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#d9f154"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#d9f154', stroke: '#08090A', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Stats footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-xs font-mono text-white/50 gap-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#E2FD52] inline-block" />
            <span className="text-white/80">Median Trajectory (P50)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-4 rounded-sm bg-[#E2FD52]/20 border border-[#E2FD52]/40 inline-block" />
            <span>80% Confidence Band (P10 - P90)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-0.5 w-4 border-b border-dashed border-rose-500 inline-block" />
            <span className="text-rose-400">Min Buffer</span>
          </div>
        </div>

        <div className="text-[11px] text-white/40">
          Last updated: Continuous Monte Carlo update on session change
        </div>
      </div>
    </div>
  );
};
