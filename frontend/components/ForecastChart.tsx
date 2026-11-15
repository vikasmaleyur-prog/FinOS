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
import { Layers, MoreHorizontal } from 'lucide-react';

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
  const [dayRange, setDayRange] = useState<7 | 15 | 30 | 60 | 90>(30);

  const safeData = data && Array.isArray(data) ? data : [];
  const displayData = safeData.slice(0, dayRange);

  // Friendly Clean Light Tooltip matching Paynix aesthetic
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt: ForecastPoint = payload[0]?.payload;
      if (!pt) return null;
      return (
        <div className="p-4 rounded-2xl bg-white border border-[#ECE7F2] shadow-[0_12px_32px_-4px_rgba(118,80,168,0.14)] min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-[#ECE7F2] pb-2">
            <span className="text-xs font-bold text-[#17152D]">{pt.date}</span>
            {(pt.p50 || 0) < minimumSafeBalance && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF1F2] text-[#9B1C23] border border-[#F9B8BC]">
                Dip Alert
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#77758A] font-medium">Expected Balance:</span>
              <span className="font-bold text-[#7650A8] tabular-nums text-sm">
                ₹{Math.round(pt.p50 || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {showConfidenceBand && (
              <>
                <div className="flex items-center justify-between text-[11px] text-[#77758A]">
                  <span>Optimistic (P90):</span>
                  <span className="text-[#159B72] font-semibold tabular-nums">
                    ₹{Math.round(pt.p90 || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#77758A]">
                  <span>Pessimistic (P10):</span>
                  <span className="text-[#E64B55] font-semibold tabular-nums">
                    ₹{Math.round(pt.p10 || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </>
            )}

            {pt.scheduledFixed && pt.scheduledFixed > 0 ? (
              <div className="pt-1.5 border-t border-[#ECE7F2] flex items-center justify-between text-[11px] text-[#8F5805] font-medium">
                <span>Scheduled Bill:</span>
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
    <div className="rounded-[24px] border border-[#ECE7F2] bg-white p-6 shadow-[0_8px_30px_rgba(118,80,168,0.05)] w-full min-w-0 transition-all hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)]">
      {/* Header (Paynix "Transaction Overview" Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-base sm:text-lg font-bold text-[#17152D] tracking-tight">
              Transaction Overview
            </h3>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F3EDFA] text-[#7650A8] border border-[#ECE7F2]">
              MONTE CARLO
            </span>
            {dataSufficiency && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                dataSufficiency.level === 'LOW'
                  ? 'bg-[#FEF7EC] text-[#8F5805] border-[#FBD9A3]'
                  : 'bg-[#E8F8F2] text-[#0E684C] border-[#B4E8D6]'
              }`}>
                {dataSufficiency.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[#77758A] mt-0.5 font-medium">
            30-Day predictive balance trajectory & stochastic cash flows
          </p>
        </div>

        {/* Controls (Paynix Dropdown & Pill Style) */}
        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          {/* Confidence Band Toggle */}
          <button
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            className={`min-h-[36px] flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              showConfidenceBand
                ? 'bg-[#F3EDFA] text-[#7650A8] border-[#7650A8]/30 shadow-2xs'
                : 'bg-white text-[#77758A] border-[#ECE7F2] hover:bg-[#F7F5FA]'
            }`}
            title="Toggle 80% Monte Carlo Confidence Band"
          >
            <Layers size={13} className={showConfidenceBand ? 'text-[#7650A8]' : 'text-[#77758A]'} />
            <span>Range Band</span>
          </button>

          {/* Time Range Pills */}
          <div className="flex items-center p-1 rounded-full bg-[#F7F5FA] border border-[#ECE7F2] text-xs font-semibold">
            {([7, 15, 30, 60] as const).map((days) => (
              <button
                key={days}
                onClick={() => setDayRange(days)}
                className={`min-h-[30px] px-3 py-1 rounded-full transition-all text-xs ${
                  dayRange === days
                    ? 'bg-[#1E1633] text-white shadow-xs font-bold'
                    : 'text-[#77758A] hover:text-[#17152D] hover:bg-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart with Smooth Purple Gradient Area */}
      <div className="h-[310px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {/* Soft Purple Area Gradient under Curve */}
              <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7650A8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7650A8" stopOpacity={0.01} />
              </linearGradient>

              {/* Confidence Band Gradient */}
              <linearGradient id="purpleConfidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9C6BD6" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#9C6BD6" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {/* Dotted Grid lines matching Paynix */}
            <CartesianGrid strokeDasharray="4 4" stroke="#ECE7F2" vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="#77758A"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#ECE7F2' }}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="#77758A"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#ECE7F2' }}
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
                value: `Safe Buffer ₹${(minimumSafeBalance / 1000).toFixed(0)}k`,
                position: 'right',
                fill: '#E64B55',
                fontSize: 10,
                fontWeight: 600
              }}
            />

            {/* Shaded 80% Confidence Interval Band */}
            {showConfidenceBand && (
              <Area
                type="monotone"
                dataKey="p90"
                stroke="transparent"
                fill="url(#purpleConfidenceGrad)"
                name="80% CI"
              />
            )}

            {/* Main Purple Area & Trajectory Line (P50) */}
            <Area
              type="monotone"
              dataKey="p50"
              stroke="#7650A8"
              strokeWidth={3}
              fill="url(#purpleAreaGrad)"
              activeDot={{ r: 6, fill: '#7650A8', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
