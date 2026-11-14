'use client';

import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Calendar, ShieldCheck, Flame } from 'lucide-react';

interface MetricsRowProps {
  currentBalance: number;
  inflows30d: number;
  outflows30d: number;
  netFlow30d: number;
  fixedMonthly: number;
  meanDailyBurn: number;
  minimumSafeBalance: number;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  currentBalance,
  inflows30d,
  outflows30d,
  netFlow30d,
  fixedMonthly,
  meanDailyBurn,
  minimumSafeBalance
}) => {
  // Days of buffer remaining if zero new income arrives
  const discretionaryBurn = meanDailyBurn > 0 ? meanDailyBurn : 850;
  const daysOfRunway = Math.max(
    0,
    Math.round((currentBalance - minimumSafeBalance) / (discretionaryBurn + (fixedMonthly / 30)))
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Current Balance */}
      <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.08] hover:border-white/[0.16] transition-all group">
        <div className="flex items-center justify-between text-white/50 mb-2">
          <span className="text-xs font-medium font-sans">Current Liquidity</span>
          <div className="p-1.5 rounded-md bg-white/[0.04] text-[#E2FD52]">
            <Wallet size={15} />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-white">
          ₹{Math.round(currentBalance).toLocaleString('en-IN')}
        </div>
        <div className="mt-2 flex items-center space-x-1.5 text-[11px] font-mono text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span>Real-time Ledger Balance</span>
        </div>
      </div>

      {/* 2. 30-Day Net Flow */}
      <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.08] hover:border-white/[0.16] transition-all">
        <div className="flex items-center justify-between text-white/50 mb-2">
          <span className="text-xs font-medium font-sans">30-Day Net Flow</span>
          <div className={`p-1.5 rounded-md bg-white/[0.04] ${netFlow30d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netFlow30d >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          </div>
        </div>
        <div className={`text-2xl font-bold font-mono tracking-tight ${netFlow30d >= 0 ? 'text-white' : 'text-rose-300'}`}>
          {netFlow30d >= 0 ? '+' : ''}₹{Math.round(netFlow30d).toLocaleString('en-IN')}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-white/40">
          <span className="text-emerald-400/80">+₹{Math.round(inflows30d).toLocaleString('en-IN')} in</span>
          <span className="text-rose-400/80">-₹{Math.round(outflows30d).toLocaleString('en-IN')} out</span>
        </div>
      </div>

      {/* 3. Fixed Commitments */}
      <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.08] hover:border-white/[0.16] transition-all">
        <div className="flex items-center justify-between text-white/50 mb-2">
          <span className="text-xs font-medium font-sans">Monthly Fixed Bills</span>
          <div className="p-1.5 rounded-md bg-white/[0.04] text-white/70">
            <Calendar size={15} />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-white">
          ₹{Math.round(fixedMonthly).toLocaleString('en-IN')}
        </div>
        <div className="mt-2 text-[11px] font-mono text-white/40">
          Rent + EMI + Subscriptions
        </div>
      </div>

      {/* 4. Runway Buffer */}
      <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.08] hover:border-white/[0.16] transition-all">
        <div className="flex items-center justify-between text-white/50 mb-2">
          <span className="text-xs font-medium font-sans">Zero-Inflow Buffer</span>
          <div className="p-1.5 rounded-md bg-white/[0.04] text-amber-400">
            <Flame size={15} />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-white">
          {daysOfRunway} <span className="text-sm font-normal text-white/50">days</span>
        </div>
        <div className="mt-2 text-[11px] font-mono text-white/40">
          @ ~₹{Math.round(discretionaryBurn).toLocaleString('en-IN')}/day variable burn
        </div>
      </div>
    </div>
  );
};
