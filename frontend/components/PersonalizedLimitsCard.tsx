'use client';

import React from 'react';
import { ShieldCheck, TrendingDown, Sparkles, CheckCircle2, PieChart } from 'lucide-react';

interface CategoryCap {
  category: string;
  daily_cap: number;
  weekly_cap?: number;
  monthly_cap: number;
  share_pct: number;
}

interface LimitsData {
  recommended_daily_cap: number;
  recommended_weekly_cap?: number;
  recommended_monthly_cap: number;
  current_daily_burn: number;
  current_weekly_burn?: number;
  current_monthly_burn: number;
  breach_prob_at_cap: number;
  baseline_breach_prob: number;
  burn_reduction_needed: number;
  is_budget_sufficient: boolean;
  top_category_caps: CategoryCap[];
  headline?: string;
  action_text?: string;
}

interface PersonalizedLimitsCardProps {
  limits?: LimitsData | null;
}

export const PersonalizedLimitsCard: React.FC<PersonalizedLimitsCardProps> = ({ limits }) => {
  if (!limits) return null;

  const {
    recommended_daily_cap,
    recommended_weekly_cap,
    recommended_monthly_cap,
    current_daily_burn,
    current_weekly_burn,
    burn_reduction_needed,
    breach_prob_at_cap,
    baseline_breach_prob,
    top_category_caps,
    headline
  } = limits;

  const weeklyCap = recommended_weekly_cap || recommended_daily_cap * 7;
  const weeklyBurn = current_weekly_burn || current_daily_burn * 7;
  const requiresCut = burn_reduction_needed > 0;

  return (
    <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] relative overflow-hidden w-full min-w-0">
      <div className="space-y-5">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE6F0] pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#F3EDFA] flex items-center justify-center text-[#7650A8]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A] block">
                Algorithmic Spending Recommendation
              </span>
              <h3 className="text-lg font-bold text-[#17152D] tracking-tight">
                {headline || `Spend ≤ ₹${Math.round(recommended_daily_cap).toLocaleString('en-IN')}/day to keep risk under 10%`}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full bg-[#E8F8F2] text-[#0E684C] border border-[#B4E8D6]">
              Risk: {breach_prob_at_cap}% at cap
            </span>
            {baseline_breach_prob > 10 && (
              <span className="text-[#77758A] line-through">
                was {baseline_breach_prob}%
              </span>
            )}
          </div>
        </div>

        {/* Spend Comparison Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F5FA] border border-[#EAE6F0]">
            <div className="text-xs font-semibold text-[#77758A]">Daily Living Limit</div>
            <div className="text-2xl font-bold text-[#7650A8] mt-1 tabular-nums">
              ₹{Math.round(recommended_daily_cap).toLocaleString('en-IN')}
              <span className="text-xs font-normal text-[#77758A]"> / day</span>
            </div>
            <div className="text-xs text-[#77758A] mt-1.5 flex items-center space-x-1.5 font-medium">
              <span>₹{Math.round(weeklyCap).toLocaleString('en-IN')}/wk</span>
              <span>•</span>
              <span>₹{Math.round(recommended_monthly_cap).toLocaleString('en-IN')}/mo</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F5FA] border border-[#EAE6F0]">
            <div className="text-xs font-semibold text-[#77758A]">Historical Average Burn</div>
            <div className="text-2xl font-bold text-[#17152D] mt-1 tabular-nums">
              ₹{Math.round(current_daily_burn).toLocaleString('en-IN')}
              <span className="text-xs font-normal text-[#77758A]"> / day</span>
            </div>
            <div className="text-xs text-[#77758A] mt-1.5 font-medium">
              ~₹{Math.round(weeklyBurn).toLocaleString('en-IN')}/week actual discretionary spend
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F5FA] border border-[#EAE6F0]">
            <div className="text-xs font-semibold text-[#77758A]">Adjustment Needed</div>
            {requiresCut ? (
              <>
                <div className="text-2xl font-bold text-[#E64B55] mt-1 tabular-nums flex items-center space-x-1">
                  <TrendingDown size={20} />
                  <span>-₹{Math.round(burn_reduction_needed).toLocaleString('en-IN')}/day</span>
                </div>
                <div className="text-xs text-[#9B1C23] mt-1.5 font-medium">
                  Cut daily living spend by ₹{Math.round(burn_reduction_needed).toLocaleString('en-IN')} to prevent shortage
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-[#159B72] mt-1 tabular-nums flex items-center space-x-1">
                  <CheckCircle2 size={20} />
                  <span>On Track</span>
                </div>
                <div className="text-xs text-[#0E684C] mt-1.5 font-medium">
                  Current spending rate is comfortably within safe boundaries
                </div>
              </>
            )}
          </div>
        </div>

        {/* Category-Level Living Caps */}
        {top_category_caps && top_category_caps.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#77758A] mb-3">
              <PieChart size={15} className="text-[#7650A8]" />
              <span>Recommended Discretionary Allocations (Top Categories):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top_category_caps.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white border border-[#EAE6F0] shadow-xs flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-[#17152D] block">
                      {cat.category}
                    </span>
                    <span className="text-[11px] text-[#77758A]">
                      {cat.share_pct}% of living spend
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#7650A8] tabular-nums block">
                      ≤ ₹{Math.round(cat.daily_cap).toLocaleString('en-IN')}/day
                    </span>
                    <span className="text-[11px] text-[#77758A] tabular-nums">
                      ₹{Math.round(cat.weekly_cap || cat.daily_cap * 7).toLocaleString('en-IN')}/wk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
