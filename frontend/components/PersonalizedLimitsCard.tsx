'use client';

import React from 'react';
import { ShieldCheck, TrendingDown, ArrowDownRight, Sparkles, CheckCircle2, AlertTriangle, PieChart } from 'lucide-react';

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
    is_budget_sufficient,
    top_category_caps,
    headline,
    action_text
  } = limits;

  const weeklyCap = recommended_weekly_cap || recommended_daily_cap * 7;
  const weeklyBurn = current_weekly_burn || current_daily_burn * 7;
  const requiresCut = burn_reduction_needed > 0;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-gradient-to-r from-[#121418] via-[#14171d] to-[#121418] p-5 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-60 h-28 bg-[#d9f154]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#d9f154]/10 border border-[#d9f154]/20 flex items-center justify-center text-[#d9f154]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider block">
                Algorithmic Spending Limit (Safe Buffer Engine)
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                {headline || `Spend ≤ ₹${Math.round(recommended_daily_cap).toLocaleString('en-IN')}/day to stay safe`}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono self-start sm:self-auto">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Risk: {breach_prob_at_cap}% at cap
            </span>
            {baseline_breach_prob > 10 && (
              <span className="text-white/40 line-through">
                was {baseline_breach_prob}%
              </span>
            )}
          </div>
        </div>

        {/* Spend Comparison Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] font-mono">
            <div className="text-[11px] text-white/40">Safe Spend Cap</div>
            <div className="text-xl font-bold text-[#d9f154] mt-0.5">
              ₹{Math.round(recommended_daily_cap).toLocaleString('en-IN')}
              <span className="text-xs font-normal text-white/40"> / day</span>
            </div>
            <div className="text-[10px] text-white/50 mt-1 flex items-center space-x-1.5">
              <span>₹{Math.round(weeklyCap).toLocaleString('en-IN')}/wk</span>
              <span>·</span>
              <span>₹{Math.round(recommended_monthly_cap).toLocaleString('en-IN')}/mo</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] font-mono">
            <div className="text-[11px] text-white/40">Current Average Burn</div>
            <div className="text-xl font-bold text-white mt-0.5">
              ₹{Math.round(current_daily_burn).toLocaleString('en-IN')}
              <span className="text-xs font-normal text-white/40"> / day</span>
            </div>
            <div className="text-[10px] text-white/40 mt-1">
              ₹{Math.round(weeklyBurn).toLocaleString('en-IN')}/wk (₹{Math.round(current_daily_burn * 30).toLocaleString('en-IN')}/mo)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] font-mono">
            <div className="text-[11px] text-white/40">Required Adjustment</div>
            <div className={`text-xl font-bold mt-0.5 ${requiresCut ? 'text-amber-400' : 'text-emerald-400'}`}>
              {requiresCut ? `-₹${Math.round(burn_reduction_needed).toLocaleString('en-IN')}/day` : 'Within Safe Range'}
            </div>
            <div className="text-[10px] text-white/40 mt-1">
              {requiresCut ? 'Trims breach risk to <10%' : 'No discretionary trim needed'}
            </div>
          </div>
        </div>

        {/* Top 3 Category Caps */}
        {top_category_caps && top_category_caps.length > 0 && (
          <div className="pt-1 space-y-2">
            <div className="text-[11px] font-mono text-white/50 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <PieChart size={13} className="text-[#d9f154]" />
                <span>Recommended Category Caps (Top 3 Variable Discretionary Spends)</span>
              </span>
              <span>Daily / Monthly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {top_category_caps.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-semibold text-white block">{cat.category}</span>
                    <span className="text-[10px] text-white/40">{cat.share_pct}% of variable</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#d9f154] font-bold block">
                      ₹{Math.round(cat.daily_cap).toLocaleString('en-IN')}/d
                    </span>
                    <span className="text-[10px] text-white/40">
                      ₹{Math.round(cat.monthly_cap).toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanatory text */}
        <p className="text-[11px] text-white/60 font-mono pt-1">
          {action_text}
        </p>
      </div>
    </div>
  );
};
