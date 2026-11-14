'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import {
  Wallet,
  ArrowRightLeft,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Layers,
  Building2,
  PiggyBank
} from 'lucide-react';

interface MultiAccountViewProps {
  apiBase: string;
}

export const MultiAccountView: React.FC<MultiAccountViewProps> = ({ apiBase }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMultiAccountAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/multi-account/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        throw new Error(`Failed to load multi-account analysis (HTTP ${res.status})`);
      }

      const resData = await res.json();
      setData(resData);
    } catch (e: any) {
      setError(e.message || 'Error executing dual-account analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultiAccountAnalysis();
  }, []);

  const st = data?.suggested_transfer;
  const transfers = data?.internal_transfers || [];
  const accA = data?.account_a;
  const accB = data?.account_b;
  const combined = data?.combined;

  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt = payload[0]?.payload;
      if (!pt) return null;
      return (
        <div className="p-3 rounded-xl bg-[#0F1014] border border-white/[0.12] shadow-2xl backdrop-blur-md min-w-[200px] space-y-1.5 text-xs font-mono">
          <div className="font-semibold text-white/50 border-b border-white/[0.08] pb-1">
            {pt.date}
          </div>
          <div className="flex items-center justify-between text-white/70">
            <span>P90 (Optimistic):</span>
            <span className="text-white font-bold">₹{Math.round(pt.p90 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-[#d9f154]">
            <span>P50 (Median):</span>
            <span className="font-bold">₹{Math.round(pt.p50 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-white/50">
            <span>P10 (Stress):</span>
            <span className="font-bold">₹{Math.round(pt.p10 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-rose-400 text-[11px] pt-1 border-t border-white/[0.06]">
            <span>Combined Buffer:</span>
            <span>₹{Math.round(pt.safeThreshold || 30000).toLocaleString('en-IN')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Layers size={20} className="text-[#d9f154]" />
            <span>Multi-Account Consolidation & Liquidity Balancing</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Consolidates SMB Current Accounts and Savings Reserves, filters internal round-trips, and optimizes inter-account transfers.
          </p>
        </div>

        <button
          onClick={fetchMultiAccountAnalysis}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#d9f154]' : 'text-white/60'} />
          <span>{loading ? 'Consolidating...' : 'Re-analyze Accounts'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="p-16 text-center rounded-2xl border border-white/[0.08] bg-[#121418] text-white/50 font-mono text-xs">
          Running dual 1,000-run Monte Carlo simulations and internal transfer detection...
        </div>
      )}

      {data && (
        <>
          {/* Suggested Inter-Account Transfer Card */}
          {st && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#121418] to-[#121418] border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.12)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                    <Sparkles size={16} />
                  </span>
                  <span className="text-xs font-mono font-semibold text-purple-300 uppercase tracking-wider">
                    Recommended Inter-Account Transfer
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-white/50">Risk Impact:</span>
                  <span className="text-rose-400 font-bold">{st.before_risk_pct}%</span>
                  <ArrowRight size={13} className="text-white/40" />
                  <span className="text-[#d9f154] font-bold">{st.after_risk_pct}% (&lt; 10%)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div>
                  <div className="text-2xl font-bold font-mono text-white tracking-tight">
                    Transfer <span className="text-[#d9f154]">₹{Math.round(st.recommended_amount).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-white/70 mt-1 max-w-2xl leading-relaxed">
                    {st.reason}
                  </p>
                </div>

                <div className="shrink-0 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-right font-mono text-xs">
                  <span className="text-white/40 block text-[10px] uppercase">Execution Window</span>
                  <strong className="text-white text-sm block mt-0.5">{st.recommended_date}</strong>
                  <span className="text-purple-300 text-[11px]">in {st.days_offset} days</span>
                </div>
              </div>
            </div>
          )}

          {/* Account A & Account B Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Account A (Current) */}
            <div className="p-5 rounded-2xl bg-[#121418] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-[#d9f154]/10 text-[#d9f154]">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{accA?.name}</h3>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Operational Cash Flow</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                  accA?.risk_level === 'HEALTHY'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {accA?.risk_level}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-white/40 uppercase block">Current Balance</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    ₹{Math.round(accA?.current_balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-white/40 uppercase block">Overdraft Buffer</span>
                  <span className="text-base font-bold text-white/70 mt-0.5 block">
                    ₹{Math.round(accA?.minimum_safe_balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-white/40 uppercase block">Breach Risk</span>
                  <span className={`text-base font-bold mt-0.5 block ${accA?.breach_prob > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {accA?.breach_prob}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-white/40 uppercase block">First Breach</span>
                  <span className="text-xs font-bold text-white/80 mt-1 block">
                    {accA?.first_breach_date || 'None Projected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account B (Savings Reserve) */}
            <div className="p-5 rounded-2xl bg-[#121418] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <PiggyBank size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{accB?.name}</h3>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Liquid Reserve Fund</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                  accB?.risk_level === 'HEALTHY'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {accB?.risk_level}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-white/40 uppercase block">Current Balance</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    ₹{Math.round(accB?.current_balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-white/40 uppercase block">Minimum Buffer</span>
                  <span className="text-base font-bold text-white/70 mt-0.5 block">
                    ₹{Math.round(accB?.minimum_safe_balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-white/40 uppercase block">Breach Risk</span>
                  <span className={`text-base font-bold mt-0.5 block ${accB?.breach_prob > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {accB?.breach_prob}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[10px] text-white/40 uppercase block">First Breach</span>
                  <span className="text-xs font-bold text-white/80 mt-1 block">
                    {accB?.first_breach_date || 'None Projected'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Consolidated Timeline Chart */}
          {combined && combined.timeline && (
            <div className="p-5 rounded-2xl bg-[#121418] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Consolidated 60-Day Multi-Account Liquidity Cone
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Net cash position across both accounts after neutralizing internal transfers.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono text-white/50">
                  <span className="h-2 w-2 rounded-full bg-[#d9f154] inline-block" />
                  <span>Combined P50</span>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combined.timeline} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      tickLine={false}
                      interval={6}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTimelineTooltip />} />
                    <ReferenceLine
                      y={combined.safeThreshold}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      label={{ value: 'Combined Buffer', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="p90"
                      stroke="rgba(217,241,84,0.3)"
                      strokeDasharray="2 2"
                      dot={false}
                      strokeWidth={1}
                    />
                    <Line
                      type="monotone"
                      dataKey="p50"
                      stroke="#d9f154"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="p10"
                      stroke="rgba(244,63,94,0.5)"
                      strokeDasharray="2 2"
                      dot={false}
                      strokeWidth={1}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Internal Transfers Table */}
          <div className="p-5 rounded-2xl bg-[#121418] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft size={16} className="text-[#d9f154]" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Neutralized Internal Transfers ({transfers.length} Detected)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Excluded from Operating Inflows/Outflows
              </span>
            </div>

            {transfers.length === 0 ? (
              <p className="text-xs text-white/40 font-mono py-4 text-center">
                No matching opposite-sign round-trips detected between accounts.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-white/80 font-mono">
                  <thead className="text-[10px] uppercase text-white/40 border-b border-white/[0.08]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Route</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Timing Match</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {transfers.map((t: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-white/60">{t.date_a}</td>
                        <td className="py-2.5 px-3 font-sans text-xs">
                          <span className="text-white/70">{t.from_account}</span>
                          <span className="text-[#d9f154] mx-1.5 font-bold">→</span>
                          <span className="text-white/70">{t.to_account}</span>
                        </td>
                        <td className="py-2.5 px-3 text-white font-bold">
                          ₹{Math.round(t.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-white/50">
                          {t.day_difference === 0 ? 'Same Day' : `${t.day_difference} day gap`}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px]">
                            Internal Transfer
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
