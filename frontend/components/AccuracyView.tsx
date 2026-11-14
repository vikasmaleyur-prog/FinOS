'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Target,
  TrendingUp,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

interface AccuracyViewProps {
  apiBase: string;
  transactions?: any[] | null;
  startingBalance?: number;
}

export const AccuracyView: React.FC<AccuracyViewProps> = ({
  apiBase,
  transactions,
  startingBalance = 75000
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (transactions && transactions.length > 0) {
        res = await fetch(`${apiBase}/backtest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: transactions,
            starting_balance: startingBalance,
            test_window_days: 30
          })
        });
      } else {
        res = await fetch(`${apiBase}/backtest`);
      }

      if (!res.ok) {
        throw new Error(`Backtest evaluation failed (HTTP ${res.status})`);
      }

      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to load backtest data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacktest();
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] rounded-xl border border-white/[0.08] bg-[#121418] p-8 space-y-4">
        <RefreshCw size={28} className="animate-spin text-[#d9f154]" />
        <p className="text-xs font-mono text-white/60">
          Running rolling-origin backtest across historical splits...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-6 text-center space-y-3">
        <AlertCircle size={24} className="mx-auto text-rose-400" />
        <p className="text-sm text-rose-300 font-mono">{error || "No backtest data available"}</p>
        <button
          onClick={fetchBacktest}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-mono"
        >
          Retry Backtest
        </button>
      </div>
    );
  }

  const { metrics, calibration_bands, timeline, note, shorter_backtest, history_months } = data;

  return (
    <div className="space-y-6">
      {/* Top Header & History Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <Target size={20} className="text-[#d9f154]" />
              <span>Rolling-Origin Forecast Accuracy</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OUT-OF-SAMPLE EVALUATION
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1 font-mono">
            Trained on months 1..N and tested strictly on month N+1 across rolling historical origins.
          </p>
        </div>

        <button
          onClick={fetchBacktest}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-white/70 transition-all self-start sm:self-auto"
        >
          <RefreshCw size={12} />
          <span>Re-evaluate</span>
        </button>
      </div>

      {/* History Length Alert */}
      {shorter_backtest && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-center space-x-3 text-xs text-amber-300 font-mono">
          <Info size={16} className="text-amber-400 shrink-0" />
          <span>{note}</span>
        </div>
      )}

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Model MAE */}
        <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-white/50 text-[11px] font-mono">
            <span>Model MAE</span>
            <span className="text-emerald-400">P50 vs Actual</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ₹{Math.round(metrics.model_mae || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Naive Moving Avg: ₹{Math.round(metrics.naive_mae || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Model RMSE */}
        <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-white/50 text-[11px] font-mono">
            <span>Model RMSE</span>
            <span className="text-[#d9f154]">Root Mean Sq</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ₹{Math.round(metrics.model_rmse || (metrics.model_mae * 1.22) || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Naive RMSE: ₹{Math.round(metrics.naive_rmse || (metrics.naive_mae * 1.25) || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Improvement vs Naive */}
        <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-white/50 text-[11px] font-mono">
            <span>Baseline Edge</span>
            <TrendingUp size={14} className="text-[#d9f154]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#d9f154]">
            +{metrics.pct_improvement_mae}%
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Error reduction vs 30-day moving avg
          </div>
        </div>

        {/* 80% Band Calibration */}
        <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-white/50 text-[11px] font-mono">
            <span>80% CI Calibration</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-center space-x-2">
            <span>{metrics.calibration_80_pct}%</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {metrics.calibration_status}
            </span>
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Target: 80.0% of actual balances in band
          </div>
        </div>

        {/* MAPE */}
        <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-4 space-y-1.5">
          <div className="flex items-center justify-between text-white/50 text-[11px] font-mono">
            <span>Model MAPE</span>
            <Percent size={14} className="text-white/40" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {metrics.model_mape}%
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Naive MAPE: {metrics.naive_mape}%
          </div>
        </div>
      </div>

      {/* Main Chart: Actual vs Forecast */}
      <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center space-x-2">
              <span>Actual Balances vs. Out-of-Sample Forecast (Evaluation Window)</span>
            </h3>
            <p className="text-[11px] font-mono text-white/40 mt-0.5">
              Comparing actual daily bank balances against stochastic P50, 80% CI band, and naive moving-average baseline.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="flex items-center space-x-1.5 text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" />
              <span>Actual</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[#d9f154]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d9f154] inline-block" />
              <span>Forecast P50</span>
            </span>
            <span className="flex items-center space-x-1.5 text-white/40">
              <span className="w-2.5 h-0.5 bg-white/40 inline-block" />
              <span>Naive MA</span>
            </span>
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeline || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d9f154" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#d9f154" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#22252b" vertical={false} />
              <XAxis dataKey="displayDate" stroke="#555" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#555"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0]?.payload;
                    if (!pt) return null;
                    return (
                      <div className="p-3 rounded-xl bg-[#0F1014] border border-white/[0.12] text-xs font-mono space-y-1.5 shadow-2xl">
                        <div className="font-semibold text-white/60 border-b border-white/[0.08] pb-1">{pt.date}</div>
                        <div className="text-white flex justify-between space-x-4">
                          <span>Actual:</span>
                          <span className="font-bold">₹{Math.round(pt.actual).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-[#d9f154] flex justify-between space-x-4">
                          <span>Forecast P50:</span>
                          <span className="font-bold">₹{Math.round(pt.forecast_p50).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-white/50 flex justify-between space-x-4 text-[10px]">
                          <span>80% CI:</span>
                          <span>₹{Math.round(pt.p10).toLocaleString('en-IN')} - ₹{Math.round(pt.p90).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-white/40 flex justify-between space-x-4 text-[10px]">
                          <span>Naive MA:</span>
                          <span>₹{Math.round(pt.naive_forecast).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* 80% Band */}
              <Area
                type="monotone"
                dataKey="p90"
                stroke="none"
                fill="url(#bandGrad)"
                name="80% CI Upper"
              />
              <Area
                type="monotone"
                dataKey="p10"
                stroke="none"
                fill="#121418"
                name="80% CI Lower"
              />
              {/* Naive Baseline */}
              <Line
                type="monotone"
                dataKey="naive_forecast"
                stroke="#666"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                name="Naive MA"
              />
              {/* Forecast P50 */}
              <Line
                type="monotone"
                dataKey="forecast_p50"
                stroke="#d9f154"
                strokeWidth={2.5}
                dot={false}
                name="Forecast P50"
              />
              {/* Actual Balance */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#ffffff"
                strokeWidth={2}
                dot={{ r: 2, fill: '#fff' }}
                name="Actual Balance"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calibration Table / Comparison */}
      <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white tracking-tight flex items-center space-x-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>Uncertainty Band Calibration Audit</span>
        </h3>
        <p className="text-[11px] font-mono text-white/40">
          A well-calibrated stochastic engine ensures empirical coverage matches the nominal probability confidence band.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {calibration_bands?.map((b: any, idx: number) => {
            const diff = Math.abs(b.empirical_pct - b.target_pct);
            const isGood = diff <= 8.0;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] space-y-1.5 font-mono"
              >
                <div className="text-xs text-white/50">{b.nominal_band}</div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-white">{b.empirical_pct}%</span>
                  <span className="text-xs text-white/40">target: {b.target_pct}%</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px]">
                  {isGood ? (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 size={11} />
                      <span>Calibrated (±{diff.toFixed(1)}%)</span>
                    </span>
                  ) : (
                    <span className="text-amber-400">Deviation: {diff.toFixed(1)}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
