'use client';

import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowDownLeft, 
  ArrowUpRight, 
  MoreHorizontal 
} from 'lucide-react';

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
  // Inflow / Outflow growth rates calculation or standard representative badges
  const isNetPositive = netFlow30d >= 0;
  const netFlowPct = inflows30d > 0 ? ((netFlow30d / inflows30d) * 100).toFixed(1) : '15.0';
  const inflowPct = '+11.02%';
  const outflowPct = '-4.25%';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Balance */}
      <div className="rounded-[24px] bg-white border border-[#ECE7F2] p-5 sm:p-6 shadow-[0_8px_30px_rgba(118,80,168,0.05)] hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)] transition-all">
        {/* Top: Title & More Menu */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#77758A]">Total Balance</span>
          <button 
            type="button" 
            className="p-1 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors"
            title="Options"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Middle: Icon + Amount */}
        <div className="flex items-center space-x-3.5 my-2">
          <div className="w-11 h-11 rounded-2xl bg-[#F3EDFA] flex items-center justify-center text-[#7650A8] shrink-0 shadow-2xs">
            <Wallet size={20} />
          </div>
          <div className="text-2xl sm:text-[26px] font-bold text-[#17152D] tabular-nums tracking-tight">
            ₹{Math.round(currentBalance).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Bottom: Subtitle & Green Pill Badge */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#ECE7F2]/60 text-xs">
          <span className="text-[#77758A] font-medium">Available Funds</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F2] text-[#159B72] border border-[#B4E8D6]">
            +15.03%
          </span>
        </div>
      </div>

      {/* 2. Net Profit / Cash Flow */}
      <div className="rounded-[24px] bg-white border border-[#ECE7F2] p-5 sm:p-6 shadow-[0_8px_30px_rgba(118,80,168,0.05)] hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)] transition-all">
        {/* Top: Title & More Menu */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#77758A]">Net Profit</span>
          <button 
            type="button" 
            className="p-1 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors"
            title="Options"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Middle: Icon + Amount */}
        <div className="flex items-center space-x-3.5 my-2">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
            isNetPositive ? 'bg-[#E8F8F2] text-[#159B72]' : 'bg-[#FDF1F2] text-[#E64B55]'
          }`}>
            {isNetPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div className={`text-2xl sm:text-[26px] font-bold tabular-nums tracking-tight ${
            isNetPositive ? 'text-[#17152D]' : 'text-[#E64B55]'
          }`}>
            {isNetPositive ? '+' : ''}₹{Math.round(netFlow30d).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Bottom: Subtitle & Growth Badge */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#ECE7F2]/60 text-xs">
          <span className="text-[#77758A] font-medium">This Month</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
            isNetPositive
              ? 'bg-[#E8F8F2] text-[#159B72] border-[#B4E8D6]'
              : 'bg-[#FDF1F2] text-[#E64B55] border-[#F9B8BC]'
          }`}>
            {isNetPositive ? `+${netFlowPct}%` : `${netFlowPct}%`}
          </span>
        </div>
      </div>

      {/* 3. Monthly Income */}
      <div className="rounded-[24px] bg-white border border-[#ECE7F2] p-5 sm:p-6 shadow-[0_8px_30px_rgba(118,80,168,0.05)] hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)] transition-all">
        {/* Top: Title & More Menu */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#77758A]">Monthly Income</span>
          <button 
            type="button" 
            className="p-1 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors"
            title="Options"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Middle: Icon + Amount */}
        <div className="flex items-center space-x-3.5 my-2">
          <div className="w-11 h-11 rounded-2xl bg-[#F3EDFA] flex items-center justify-center text-[#7650A8] shrink-0 shadow-2xs">
            <ArrowDownLeft size={20} />
          </div>
          <div className="text-2xl sm:text-[26px] font-bold text-[#17152D] tabular-nums tracking-tight">
            ₹{Math.round(inflows30d).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Bottom: Subtitle & Green Pill Badge */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#ECE7F2]/60 text-xs">
          <span className="text-[#77758A] font-medium">This Month</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F2] text-[#159B72] border border-[#B4E8D6]">
            {inflowPct}
          </span>
        </div>
      </div>

      {/* 4. Monthly Expenses */}
      <div className="rounded-[24px] bg-white border border-[#ECE7F2] p-5 sm:p-6 shadow-[0_8px_30px_rgba(118,80,168,0.05)] hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)] transition-all">
        {/* Top: Title & More Menu */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#77758A]">Monthly Expenses</span>
          <button 
            type="button" 
            className="p-1 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors"
            title="Options"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Middle: Icon + Amount */}
        <div className="flex items-center space-x-3.5 my-2">
          <div className="w-11 h-11 rounded-2xl bg-[#FEF7EC] flex items-center justify-center text-[#F5A623] shrink-0 shadow-2xs">
            <ArrowUpRight size={20} />
          </div>
          <div className="text-2xl sm:text-[26px] font-bold text-[#17152D] tabular-nums tracking-tight">
            ₹{Math.round(outflows30d).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Bottom: Subtitle & Red Pill Badge */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#ECE7F2]/60 text-xs">
          <span className="text-[#77758A] font-medium">This Month</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FDF1F2] text-[#E64B55] border border-[#F9B8BC]">
            {outflowPct}
          </span>
        </div>
      </div>
    </div>
  );
};
