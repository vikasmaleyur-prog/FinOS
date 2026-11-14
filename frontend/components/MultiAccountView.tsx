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
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Layers,
  Building2,
  PiggyBank,
  CheckCircle2
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

  const st = data?.suggested_transfer || data?.recommended_transfer;
  const transfers = data?.internal_transfers || data?.neutralized_transfers || [];
  const accA = data?.account_a;
  const accB = data?.account_b;
  const combined = data?.combined;

  // Overview metrics derived from backend
  const balA = Number(accA?.current_balance || 0);
  const balB = Number(accB?.current_balance || 0);
  const safeA = Number(accA?.minimum_safe_balance || 0);
  const safeB = Number(accB?.minimum_safe_balance || 0);
  const combinedBal = Number(combined?.current_balance || (balA + balB));
  const totalSafeBuffer = Number(combined?.safeThreshold || (safeA + safeB));
  const totalLiquidity = combinedBal;
  const surplusA = Math.max(0, balA - safeA);
  const surplusB = Math.max(0, balB - safeB);

  // Check if a transfer is genuinely recommended and non-zero
  const hasValidTransfer = Boolean(st && st.recommended_amount && Number(st.recommended_amount) > 0);

  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt = payload[0]?.payload;
      if (!pt) return null;
      return (
        <div className="p-3.5 rounded-2xl bg-white border border-[#EAE6F0] shadow-[0_8px_30px_-4px_rgba(118,80,168,0.12)] min-w-[200px] space-y-1.5 text-xs">
          <div className="font-semibold text-[#17152D] border-b border-[#EAE6F0] pb-1">
            {pt.date}
          </div>
          <div className="flex items-center justify-between text-[#77758A]">
            <span>P90 (Optimistic):</span>
            <span className="text-[#17152D] font-bold tabular-nums">₹{Math.round(pt.p90 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-[#7650A8]">
            <span className="font-semibold">P50 (Median):</span>
            <span className="font-bold tabular-nums">₹{Math.round(pt.p50 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-[#E64B55]">
            <span>P10 (Stress):</span>
            <span className="font-bold tabular-nums">₹{Math.round(pt.p10 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-[#77758A] text-[11px] pt-1.5 border-t border-[#EAE6F0]">
            <span>Combined Buffer:</span>
            <span className="font-semibold tabular-nums">₹{Math.round(pt.safeThreshold || totalSafeBuffer).toLocaleString('en-IN')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#77758A] mb-1">
            FINOS WORKSPACE / MULTI-ACCOUNT
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#17152D] tracking-tight flex items-center gap-2.5">
            <Layers size={22} className="text-[#7650A8] shrink-0" />
            <span>Multi-Account Consolidation & Balancing</span>
          </h2>
          <p className="text-xs text-[#77758A] mt-1 leading-relaxed font-medium">
            Consolidates SMB Current Accounts and Savings Reserves, isolates internal transfers, and optimizes inter-account transfers.
          </p>
        </div>

        <button
          onClick={fetchMultiAccountAnalysis}
          disabled={loading}
          className="min-h-[44px] flex items-center space-x-2 px-4 py-2 rounded-full bg-[#F3EDFA] hover:bg-[#EBE2F7] border border-[#EAE6F0] text-xs font-bold text-[#7650A8] transition-all cursor-pointer self-start sm:self-auto shrink-0 focus:outline-none focus:ring-2 focus:ring-[#7650A8]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#7650A8]' : 'text-[#7650A8]'} />
          <span>{loading ? 'Consolidating...' : 'Re-analyze Accounts'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-[20px] bg-[#FDF1F2] border border-[#F9B8BC] text-[#9B1C23] text-xs flex items-center space-x-2 font-medium">
          <AlertTriangle size={16} className="text-[#E64B55] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="p-16 text-center rounded-[20px] border border-[#EAE6F0] bg-white text-[#77758A] text-xs font-medium shadow-sm">
          Running dual 1,000-run Monte Carlo simulations and internal transfer detection...
        </div>
      )}

      {data && (
        <>
          {/* ======================================================== */}
          {/* A. ACCOUNT OVERVIEW METRICS */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Savings Balance */}
            <div className="p-4 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77758A] block">
                Savings Balance
              </span>
              <span className="text-xl font-bold text-[#17152D] tabular-nums mt-1 block">
                ₹{Math.round(balB).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#159B72] font-medium mt-0.5 block flex items-center gap-1">
                <PiggyBank size={12} />
                Reserve buffer: ₹{Math.round(safeB).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Current Business Balance */}
            <div className="p-4 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77758A] block">
                Current Account
              </span>
              <span className="text-xl font-bold text-[#17152D] tabular-nums mt-1 block">
                ₹{Math.round(balA).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#7650A8] font-medium mt-0.5 block flex items-center gap-1">
                <Building2 size={12} />
                Operating buffer: ₹{Math.round(safeA).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Combined Available Balance */}
            <div className="p-4 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77758A] block">
                Combined Balance
              </span>
              <span className="text-xl font-bold text-[#7650A8] tabular-nums mt-1 block">
                ₹{Math.round(combinedBal).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#77758A] font-medium mt-0.5 block">
                Across both accounts
              </span>
            </div>

            {/* Total Liquidity */}
            <div className="p-4 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77758A] block">
                Total Liquidity
              </span>
              <span className="text-xl font-bold text-[#159B72] tabular-nums mt-1 block">
                ₹{Math.round(totalLiquidity).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#77758A] font-medium mt-0.5 block">
                100% accessible funds
              </span>
            </div>

            {/* Minimum Safe Buffer */}
            <div className="p-4 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77758A] block">
                Minimum Safe Buffer
              </span>
              <span className="text-xl font-bold text-[#17152D] tabular-nums mt-1 block">
                ₹{Math.round(totalSafeBuffer).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-[#77758A] font-medium mt-0.5 block">
                Consolidated threshold
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* B. RECOMMENDED INTER-ACCOUNT TRANSFER */}
          {/* ======================================================== */}
          <div className="p-6 rounded-[20px] bg-[#F3EDFA] border border-[#EAE6F0] shadow-sm">
            {hasValidTransfer ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <span className="p-2 rounded-xl bg-white text-[#7650A8] shadow-xs">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#7650A8] uppercase tracking-wider block">
                        Recommended Inter-Account Transfer
                      </span>
                      <span className="text-xs text-[#77758A] font-medium">
                        Automated buffer rebalancing to eliminate breach risk
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-semibold self-start sm:self-auto">
                    <span className="text-[#77758A]">Risk Reduction:</span>
                    <span className="text-[#E64B55] font-bold tabular-nums">{st.before_risk_pct}%</span>
                    <ArrowRight size={14} className="text-[#77758A]" />
                    <span className="text-[#159B72] font-bold tabular-nums">{st.after_risk_pct}% (&lt; 10%)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#EAE6F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-[#17152D]">
                      <span>Transfer</span>
                      <strong className="text-base text-[#7650A8] tabular-nums font-bold">
                        ₹{Math.round(st.recommended_amount).toLocaleString('en-IN')}
                      </strong>
                      <span>from <span className="underline decoration-[#7650A8]/30 font-bold">{st.from_account}</span> to <span className="underline decoration-[#7650A8]/30 font-bold">{st.to_account}</span></span>
                    </div>
                    <p className="text-xs text-[#17152D]/80 leading-relaxed">
                      {st.reason}
                    </p>
                  </div>

                  <div className="text-left md:text-right shrink-0">
                    <span className="text-xs text-[#77758A] block font-medium">Recommended Transfer Date</span>
                    <span className="text-sm font-bold text-[#17152D]">{st.recommended_date || st.transfer_date || 'Within 5 days'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3.5">
                <span className="p-2.5 rounded-xl bg-white text-[#159B72] shadow-xs shrink-0">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#17152D]">
                    Both accounts maintain sufficient liquidity. No transfer required.
                  </h3>
                  <p className="text-xs text-[#77758A] mt-0.5">
                    Operating cash flow and liquid reserves remain safely above target safety buffers across the 60-day horizon.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* C. ACCOUNT COMPARISON */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account A (Current) */}
            <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE6F0] pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-[#F3EDFA] text-[#7650A8]">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17152D]">{accA?.name || 'Current Business Account'}</h3>
                    <span className="text-[11px] text-[#77758A]">Operating / Receivables</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  accA?.breach_prob > 10 ? 'bg-[#FDF1F2] text-[#E64B55] border-[#F9B8BC]' : 'bg-[#E8F8F2] text-[#159B72] border-[#B4E8D6]'
                }`}>
                  Shortage Risk: {accA?.breach_prob}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0]">
                  <span className="text-[11px] text-[#77758A] font-medium block">Balance</span>
                  <span className="text-base font-bold text-[#17152D] tabular-nums mt-0.5 block truncate">
                    ₹{Math.round(balA).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0]">
                  <span className="text-[11px] text-[#77758A] font-medium block">Safe Buffer</span>
                  <span className="text-base font-bold text-[#7650A8] tabular-nums mt-0.5 block truncate">
                    ₹{Math.round(safeA).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0]">
                  <span className="text-[11px] text-[#77758A] font-medium block">Surplus</span>
                  <span className="text-base font-bold text-[#159B72] tabular-nums mt-0.5 block truncate">
                    ₹{Math.round(surplusA).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Account B (Savings Reserve) */}
            <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE6F0] pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-[#E8F8F2] text-[#159B72]">
                    <PiggyBank size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17152D]">{accB?.name || 'Personal Savings Reserve'}</h3>
                    <span className="text-[11px] text-[#77758A]">Liquid Surplus Reserve</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8F8F2] text-[#159B72] border border-[#B4E8D6]">
                  Shortage Risk: {accB?.breach_prob || 0}% (Healthy)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0]">
                  <span className="text-[11px] text-[#77758A] font-medium block">Balance</span>
                  <span className="text-base font-bold text-[#17152D] tabular-nums mt-0.5 block truncate">
                    ₹{Math.round(balB).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0]">
                  <span className="text-[11px] text-[#77758A] font-medium block">Safe Buffer</span>
                  <span className="text-base font-bold text-[#7650A8] tabular-nums mt-0.5 block truncate">
                    ₹{Math.round(safeB).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0]">
                  <span className="text-[11px] text-[#77758A] font-medium block">Surplus</span>
                  <span className="text-base font-bold text-[#159B72] tabular-nums mt-0.5 block truncate">
                    ₹{Math.round(surplusB).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Consolidated Timeline Chart */}
          <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-[#17152D]">
                  Consolidated Multi-Account 60-Day Runway
                </h3>
                <p className="text-xs text-[#77758A] mt-1 font-medium">
                  Combined portfolio cash trajectory with internal inter-account transfers neutralized.
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs font-semibold">
                <div className="flex items-center space-x-1.5">
                  <span className="h-1 w-4 bg-[#7650A8] rounded inline-block" />
                  <span className="text-[#7650A8]">Consolidated Median</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-0.5 w-4 border-b-2 border-dashed border-[#E64B55] inline-block" />
                  <span className="text-[#E64B55]">Combined Safe Buffer</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combined?.timeline || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAE6F0" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#77758A" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE6F0' }} />
                  <YAxis stroke="#77758A" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE6F0' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTimelineTooltip />} />
                  <ReferenceLine y={totalSafeBuffer} stroke="#E64B55" strokeDasharray="4 4" strokeWidth={1.5} />
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
          </div>

          {/* ======================================================== */}
          {/* D. TRANSFER HISTORY TABLE */}
          {/* ======================================================== */}
          <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] w-full min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#17152D] flex items-center space-x-2">
                  <ArrowRightLeft size={16} className="text-[#7650A8]" />
                  <span>Transfer History</span>
                </h3>
                <p className="text-xs text-[#77758A] mt-0.5 font-medium">
                  Round-trip self-transfers between Current and Savings accounts (neutralized to prevent double-counting).
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F3EDFA] text-[#7650A8] border border-[#EAE6F0]">
                {transfers.length} Neutralized
              </span>
            </div>

            {transfers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#77758A]">
                No internal round-trip transfers detected between statements.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EAE6F0] text-[11px] font-bold text-[#77758A] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE6F0]">
                    {transfers.map((t: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#F7F5FA] transition-colors">
                        <td className="py-3 px-3 text-[#17152D] font-medium whitespace-nowrap">
                          {t.date_a || t.date || 'Recent'}
                        </td>
                        <td className="py-3 px-3 text-[#77758A] whitespace-nowrap">
                          {t.from_account || 'Account A (Current)'}
                        </td>
                        <td className="py-3 px-3 text-[#77758A] whitespace-nowrap">
                          {t.to_account || 'Account B (Savings)'}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#7650A8] tabular-nums whitespace-nowrap">
                          ₹{Math.round(t.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full bg-[#E8F8F2] text-[#159B72] border border-[#B4E8D6] font-semibold text-[11px]">
                            Neutralized
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
