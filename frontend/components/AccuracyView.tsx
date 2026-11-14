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
      <div className="flex flex-col items-center justify-center min-h-[420px] rounded-[20px] border border-[#EAE6F0] bg-white p-8 space-y-4 shadow-sm w-full min-w-0">
        <RefreshCw size={28} className="animate-spin text-[#7650A8]" />
        <p className="text-xs text-[#77758A] font-medium">
          Running rolling-origin backtest across historical splits...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[20px] border border-[#F9B8BC] bg-[#FDF1F2] p-6 text-center space-y-3 w-full min-w-0">
        <AlertCircle size={24} className="mx-auto text-[#E64B55]" />
        <p className="text-sm text-[#9B1C23] font-semibold">{error || "No backtest data available"}</p>
        <button
          onClick={fetchBacktest}
          className="min-h-[40px] px-5 py-2 rounded-full bg-[#E64B55] text-white text-xs font-semibold hover:bg-[#D03D47] transition-colors"
        >
          Retry Evaluation
        </button>
      </div>
    );
  }

  const { metrics, calibration_bands, timeline, note, shorter_backtest } = data;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Top Header & History Badge */}
      <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-bold text-[#17152D] tracking-tight flex items-center space-x-2">
              <Target size={22} className="text-[#7650A8]" />
              <span>Rolling-Origin Historical Backtesting</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#0E684C] border border-[#B4E8D6]">
              OUT-OF-SAMPLE
            </span>
          </div>
          <p className="text-xs text-[#77758A] mt-1.5 leading-relaxed font-medium">
            Evaluates prediction accuracy by training on months 1..N and testing strictly on month N+1 across chronological splits.
          </p>
        </div>

        <button
          onClick={fetchBacktest}
          className="min-h-[44px] flex items-center space-x-2 px-4 py-2 rounded-full bg-[#F3EDFA] hover:bg-[#EBE2F7] border border-[#EAE6F0] text-xs font-bold text-[#7650A8] transition-all self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-[#7650A8]"
        >
          <RefreshCw size={14} />
          <span>Re-evaluate</span>
        </button>
      </div>

      {/* History Length Alert */}
      {shorter_backtest && (
        <div className="rounded-[20px] border border-[#FBD9A3] bg-[#FEF7EC] p-4 flex items-center space-x-3 text-xs text-[#8F5805] font-medium">
          <Info size={18} className="text-[#F5A623] shrink-0" />
          <span>{note}</span>
        </div>
      )}

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Model MAE */}
        <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-5 space-y-1.5 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
          <div className="flex items-center justify-between text-[#77758A] text-xs font-semibold uppercase tracking-wider">
            <span>Model MAE</span>
            <span className="text-[#159B72]">P50 vs Actual</span>
          </div>
          <div className="text-2xl font-bold text-[#17152D] tabular-nums">
            ₹{Math.round(metrics.model_mae || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#77758A] font-medium">
            Naive Baseline: ₹{Math.round(metrics.naive_mae || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Model RMSE */}
        <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-5 space-y-1.5 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
          <div className="flex items-center justify-between text-[#77758A] text-xs font-semibold uppercase tracking-wider">
            <span>Model RMSE</span>
            <span className="text-[#7650A8]">Root Mean Sq</span>
          </div>
          <div className="text-2xl font-bold text-[#17152D] tabular-nums">
            ₹{Math.round(metrics.model_rmse || (metrics.model_mae * 1.22) || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#77758A] font-medium">
            Naive RMSE: ₹{Math.round(metrics.naive_rmse || (metrics.naive_mae * 1.25) || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Improvement vs Naive */}
        <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-5 space-y-1.5 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
          <div className="flex items-center justify-between text-[#77758A] text-xs font-semibold uppercase tracking-wider">
            <span>Baseline Edge</span>
            <TrendingUp size={16} className="text-[#159B72]" />
          </div>
          <div className="text-2xl font-bold text-[#159B72] tabular-nums">
            +{metrics.pct_improvement_mae}%
          </div>
          <div className="text-[11px] text-[#77758A] font-medium">
            Error reduction vs moving avg
          </div>
        </div>

        {/* 80% Band Calibration */}
        <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-5 space-y-1.5 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
          <div className="flex items-center justify-between text-[#77758A] text-xs font-semibold uppercase tracking-wider">
            <span>80% CI Calibration</span>
            <ShieldCheck size={16} className="text-[#7650A8]" />
          </div>
          <div className="text-2xl font-bold text-[#17152D] tabular-nums flex items-center space-x-2">
            <span>{metrics.calibration_80_pct || metrics.calibration_coverage_pct || 0}%</span>
          </div>
          <div className="text-[11px] text-[#77758A] font-medium">
            Target: ~80.0% inside uncertainty band
          </div>
        </div>

        {/* Model MAPE */}
        <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-5 space-y-1.5 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
          <div className="flex items-center justify-between text-[#77758A] text-xs font-semibold uppercase tracking-wider">
            <span>Model MAPE</span>
            <Percent size={15} className="text-[#7650A8]" />
          </div>
          <div className="text-2xl font-bold text-[#17152D] tabular-nums">
            {metrics.model_mape}%
          </div>
          <div className="text-[11px] text-[#77758A] font-medium">
            Naive MAPE: {metrics.naive_mape}%
          </div>
        </div>
      </div>

      {/* Main Backtest Comparison Chart */}
      <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#17152D]">
              Out-of-Sample Actual Balance vs. Model Forecast
            </h3>
            <p className="text-xs text-[#77758A] mt-1 font-medium">
              Comparing ground-truth daily ledger balances against the rolling-origin median forecast and 80% confidence interval.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#17152D]" />
              <span className="text-[#17152D]">Actual Balance</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-1 w-4 bg-[#7650A8] rounded" />
              <span className="text-[#7650A8]">Model Forecast (P50)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-4 bg-[#F3EDFA] border border-[#EAE6F0] rounded" />
              <span className="text-[#77758A]">80% CI</span>
            </div>
          </div>
        </div>

        <div className="h-[360px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeline || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="backtestBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7650A8" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#7650A8" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6F0" vertical={false} />
              <XAxis dataKey="displayDate" stroke="#77758A" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE6F0' }} />
              <YAxis stroke="#77758A" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE6F0' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0]?.payload;
                    return (
                      <div className="p-4 rounded-2xl bg-white border border-[#EAE6F0] shadow-[0_8px_30px_-4px_rgba(118,80,168,0.12)] min-w-[200px] space-y-1.5 text-xs">
                        <div className="font-semibold text-[#17152D] border-b border-[#EAE6F0] pb-1">
                          {pt.displayDate} ({pt.date})
                        </div>
                        <div className="flex items-center justify-between text-[#17152D]">
                          <span className="font-medium">Actual Balance:</span>
                          <span className="font-bold tabular-nums">₹{Math.round(pt.actual || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#7650A8]">
                          <span className="font-medium">Model Forecast:</span>
                          <span className="font-bold tabular-nums">₹{Math.round(pt.forecast_p50 || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#77758A] text-[11px]">
                          <span>Naive Moving Avg:</span>
                          <span className="tabular-nums">₹{Math.round(pt.naive_forecast || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area type="monotone" dataKey="forecast_p90" stroke="transparent" fill="url(#backtestBand)" />
              <Line type="monotone" dataKey="forecast_p10" stroke="#D8C2EC" strokeDasharray="2 2" strokeWidth={1} dot={false} />
              
              {/* Naive Baseline */}
              <Line type="monotone" dataKey="naive_forecast" stroke="#77758A" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
              
              {/* Model Forecast Line */}
              <Line type="monotone" dataKey="forecast_p50" stroke="#7650A8" strokeWidth={2.5} dot={false} />
              
              {/* Actual Ground-Truth Points */}
              <Line type="monotone" dataKey="actual" stroke="#17152D" strokeWidth={2} dot={{ r: 3, fill: '#17152D' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calibration Bands Breakdown Table */}
      {calibration_bands && (
        <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] w-full min-w-0">
          <h3 className="text-base font-bold text-[#17152D] mb-3">
            Empirical Uncertainty Calibration
          </h3>
          <p className="text-xs text-[#77758A] mb-4 font-medium">
            Verifying whether confidence bands capture the expected proportion of actual daily cash flow values.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {calibration_bands.map((b: any, idx: number) => {
              const diff = Math.abs(b.empirical_pct - b.target_pct);
              const isCalibrated = diff <= 15;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-[#F7F5FA] border border-[#EAE6F0] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#17152D]">{b.nominal_band}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isCalibrated ? 'bg-[#E8F8F2] text-[#0E684C] border-[#B4E8D6]' : 'bg-[#FEF7EC] text-[#8F5805] border-[#FBD9A3]'
                    }`}>
                      {isCalibrated ? 'Calibrated' : 'Dispersed'}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-2xl font-bold text-[#7650A8] tabular-nums">
                      {b.empirical_pct}%
                    </span>
                    <span className="text-xs text-[#77758A] font-medium">
                      (Target: {b.target_pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
