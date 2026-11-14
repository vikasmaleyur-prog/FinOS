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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Current Balance */}
      <div className="p-5 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(118,80,168,0.08)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A]">Current Balance</span>
          <div className="h-10 w-10 rounded-xl bg-[#F3EDFA] flex items-center justify-center text-[#7650A8]">
            <Wallet size={18} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-[#17152D] tabular-nums tracking-tight">
          ₹{Math.round(currentBalance).toLocaleString('en-IN')}
        </div>
        <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-[#0E684C] font-medium">
          <span className="h-2 w-2 rounded-full bg-[#159B72] inline-block animate-pulse" />
          <span>Real-time Statement Balance</span>
        </div>
      </div>

      {/* 2. 30-Day Net Flow */}
      <div className="p-5 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(118,80,168,0.08)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A]">30-Day Net Flow</span>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            netFlow30d >= 0 ? 'bg-[#E8F8F2] text-[#159B72]' : 'bg-[#FDF1F2] text-[#E64B55]'
          }`}>
            {netFlow30d >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </div>
        </div>
        <div className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
          netFlow30d >= 0 ? 'text-[#17152D]' : 'text-[#E64B55]'
        }`}>
          {netFlow30d >= 0 ? '+' : ''}₹{Math.round(netFlow30d).toLocaleString('en-IN')}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-[#77758A] font-medium">
          <span className="text-[#0E684C]">+₹{Math.round(inflows30d).toLocaleString('en-IN')} in</span>
          <span className="text-[#9B1C23]">-₹{Math.round(outflows30d).toLocaleString('en-IN')} out</span>
        </div>
      </div>

      {/* 3. Fixed Commitments */}
      <div className="p-5 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(118,80,168,0.08)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A]">Fixed Obligations</span>
          <div className="h-10 w-10 rounded-xl bg-[#F3EDFA] flex items-center justify-center text-[#7650A8]">
            <Calendar size={18} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-[#17152D] tabular-nums tracking-tight">
          ₹{Math.round(fixedMonthly).toLocaleString('en-IN')}
        </div>
        <div className="mt-2.5 text-xs text-[#77758A] font-medium">
          Rent + EMI + Subscriptions / month
        </div>
      </div>

      {/* 4. Runway Buffer */}
      <div className="p-5 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(118,80,168,0.08)] transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A]">Zero-Inflow Buffer</span>
          <div className="h-10 w-10 rounded-xl bg-[#FEF7EC] flex items-center justify-center text-[#F5A623]">
            <Flame size={18} />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-[#17152D] tabular-nums tracking-tight">
          {daysOfRunway} <span className="text-sm font-semibold text-[#77758A]">days</span>
        </div>
        <div className="mt-2.5 text-xs text-[#77758A] font-medium">
          At ~₹{Math.round(discretionaryBurn).toLocaleString('en-IN')}/day variable spend
        </div>
      </div>
    </div>
  );
};
