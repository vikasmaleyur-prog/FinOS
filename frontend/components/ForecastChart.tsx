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

  // Friendly Clean Light Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt: ForecastPoint = payload[0]?.payload;
      if (!pt) return null;
      return (
        <div className="p-4 rounded-2xl bg-white border border-[#EAE6F0] shadow-[0_8px_30px_-4px_rgba(118,80,168,0.12)] min-w-[220px] space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#EAE6F0] pb-2">
            <span className="text-xs font-semibold text-[#17152D]">{pt.date}</span>
            {(pt.p50 || 0) < minimumSafeBalance && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF1F2] text-[#9B1C23] border border-[#F9B8BC]">
                Buffer Breach
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#77758A] font-medium">Expected Median (P50):</span>
              <span className="font-bold text-[#7650A8] tabular-nums">
                ₹{Math.round(pt.p50 || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {showConfidenceBand && (
              <>
                <div className="flex items-center justify-between text-[11px] text-[#77758A]">
                  <span>P90 (Optimistic):</span>
                  <span className="text-[#17152D] font-semibold tabular-nums">
                    ₹{Math.round(pt.p90 || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#77758A]">
                  <span>P10 (Pessimistic):</span>
                  <span className="text-[#E64B55] font-semibold tabular-nums">
                    ₹{Math.round(pt.p10 || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </>
            )}

            {pt.scheduledFixed && pt.scheduledFixed > 0 ? (
              <div className="pt-1.5 border-t border-[#EAE6F0] flex items-center justify-between text-[11px] text-[#8F5805] font-medium">
                <span>Scheduled Outflow:</span>
                <span className="tabular-nums">-₹{Math.round(pt.scheduledFixed).toLocaleString('en-IN')}</span>
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[#17152D] tracking-tight">
              {dayRange}-Day Predictive Cash Flow Trajectory
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F3EDFA] text-[#7650A8] border border-[#EAE6F0]">
              1,000 MONTE CARLO PATHS
            </span>
            {probBelowZero > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FDF1F2] text-[#9B1C23] border border-[#F9B8BC]">
                Zero Risk: {probBelowZero}%
              </span>
            )}
            {dataSufficiency && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                dataSufficiency.level === 'LOW'
                  ? 'bg-[#FEF7EC] text-[#8F5805] border-[#FBD9A3]'
                  : 'bg-[#E8F8F2] text-[#0E684C] border-[#B4E8D6]'
              }`}>
                {dataSufficiency.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[#77758A] mt-1 font-medium">
            Stochastic simulation incorporating irregular milestone income, scheduled recurring bills, and bootstrap living expenses.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          {/* Confidence Band Toggle */}
          <button
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            className={`min-h-[44px] flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
              showConfidenceBand
                ? 'bg-[#F3EDFA] text-[#7650A8] border-[#7650A8]/30'
                : 'bg-white text-[#77758A] border-[#EAE6F0] hover:bg-[#F7F5FA]'
            }`}
          >
            <Layers size={15} className={showConfidenceBand ? 'text-[#7650A8]' : 'text-[#77758A]'} />
            <span>80% Uncertainty Band</span>
          </button>

          {/* Time Range Pills */}
          <div className="flex items-center p-1 rounded-full bg-[#F7F5FA] border border-[#EAE6F0] text-xs font-semibold">
            {([7, 15, 30, 60, 90] as const).map((days) => (
              <button
                key={days}
                onClick={() => setDayRange(days)}
                className={`min-h-[36px] px-3 py-1.5 rounded-full transition-all text-xs ${
                  dayRange === days
                    ? 'bg-[#7650A8] text-white shadow-xs font-bold'
                    : 'text-[#77758A] hover:text-[#17152D] hover:bg-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-[360px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {/* Soft Purple Confidence Band Gradient */}
              <linearGradient id="purpleConfidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7650A8" stopOpacity={0.16} />
                <stop offset="95%" stopColor="#7650A8" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#EAE6F0" vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="#77758A"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#EAE6F0' }}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="#77758A"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#EAE6F0' }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Minimum Safe Balance Threshold Reference Line */}
            <ReferenceLine
              y={minimumSafeBalance}
              stroke="#E64B55"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Safe Buffer: ₹${minimumSafeBalance.toLocaleString('en-IN')}`,
                position: 'right',
                fill: '#E64B55',
                fontSize: 11,
                fontWeight: 600
              }}
            />

            {/* Shaded 80% Confidence Interval Band */}
            {showConfidenceBand && (
              <Area
                type="monotone"
                dataKey="p90"
                stroke="transparent"
                fill="url(#purpleConfidenceGradient)"
                name="80% CI"
              />
            )}

            {showConfidenceBand && (
              <Line
                type="monotone"
                dataKey="p10"
                stroke="#D8C2EC"
                strokeDasharray="2 2"
                strokeWidth={1.2}
                dot={false}
              />
            )}

            {/* Expected Median Trajectory (P50) */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#7650A8"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#7650A8', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Footer */}
      <div className="mt-5 pt-4 border-t border-[#EAE6F0] flex flex-wrap items-center justify-between text-xs text-[#77758A] gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-[#7650A8] inline-block" />
            <span className="text-[#17152D] font-semibold">Expected Median (P50)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-5 rounded bg-[#F3EDFA] border border-[#EAE6F0] inline-block" />
            <span>80% Confidence Band (P10 to P90)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-0.5 w-4 border-b-2 border-dashed border-[#E64B55] inline-block" />
            <span className="text-[#E64B55] font-medium">Minimum Safe Buffer</span>
          </div>
        </div>

        <div className="text-[11px] text-[#77758A] font-medium">
          Continuously evaluated against rolling 90-day transaction burn
        </div>
      </div>
    </div>
  );
};
