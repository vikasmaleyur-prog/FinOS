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
  SlidersHorizontal,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Info,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

interface SimulationResult {
  delta_metrics: {
    baseline_risk: number;
    simulated_risk: number;
    risk_increase_pct: number;
    baseline_min_balance: number;
    simulated_min_balance: number;
    baseline_ending_balance?: number;
    simulated_ending_balance?: number;
    baseline_safe_limit?: number;
    simulated_safe_limit?: number;
    balance_impact: number;
    new_breach_date: string | null;
    simulated_risk_level: string;
  };
  explanation: {
    headline: string;
    root_cause: string;
    actionable_recommendations: string[];
    risk_level: string;
  };
  timeline: Array<{
    date: string;
    displayDate: string;
    baseline_p50: number;
    baseline_p10: number;
    baseline_p90: number;
    simulated_p50: number;
    simulated_p10: number;
    simulated_p90: number;
    safeThreshold: number;
  }>;
}

interface SimulatorViewProps {
  apiBase: string;
  currentBalance: number;
  minimumSafeBalance: number;
  transactions?: any[] | null;
  accountType?: string;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  apiBase,
  currentBalance,
  minimumSafeBalance,
  transactions,
  accountType = 'savings'
}) => {
  // Simulator Inputs
  const [purchaseName, setPurchaseName] = useState('₹30,000 Laptop');
  const [purchaseAmount, setPurchaseAmount] = useState<number>(30000);
  const [purchaseDayOffset, setPurchaseDayOffset] = useState<number>(7);
  const [includePurchase, setIncludePurchase] = useState<boolean>(true);

  const [emiName, setEmiName] = useState('Loan Repayment EMI');
  const [emiAmount, setEmiAmount] = useState<number>(15000);
  const [emiDayOfMonth, setEmiDayOfMonth] = useState<number>(5);
  const [includeEmi, setIncludeEmi] = useState<boolean>(false);

  const [lumpSumInflow, setLumpSumInflow] = useState<number>(0);
  const [discretionaryReductionPct, setDiscretionaryReductionPct] = useState<number>(0);
  const [incomeDelayDays, setIncomeDelayDays] = useState<number>(0);
  const [incomeBoostPct, setIncomeBoostPct] = useState<number>(0);
  const [safeBalance, setSafeBalance] = useState<number>(minimumSafeBalance);

  const [activeScenario, setActiveScenario] = useState<string | null>('laptop_30k');
  const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const applyPreset = (preset: 'laptop_30k' | 'take_loan' | 'add_emi' | 'delay_salary' | 'delay_client' | 'increase_expenses' | 'cut_discretionary') => {
    setActiveScenario(preset);
    if (preset === 'laptop_30k') {
      setPurchaseName('₹30,000 Laptop');
      setPurchaseAmount(30000);
      setPurchaseDayOffset(7);
      setIncludePurchase(true);
      setIncludeEmi(false);
      setIncomeDelayDays(0);
      setLumpSumInflow(0);
      setDiscretionaryReductionPct(0);
    } else if (preset === 'take_loan') {
      setLumpSumInflow(100000);
      setEmiName('Loan Repayment EMI');
      setEmiAmount(15000);
      setEmiDayOfMonth(5);
      setIncludeEmi(true);
      setIncludePurchase(false);
      setIncomeDelayDays(0);
      setDiscretionaryReductionPct(0);
    } else if (preset === 'add_emi') {
      setEmiName('Equipment Loan EMI');
      setEmiAmount(15000);
      setEmiDayOfMonth(5);
      setIncludeEmi(true);
      setIncludePurchase(false);
      setIncomeDelayDays(0);
      setLumpSumInflow(0);
      setDiscretionaryReductionPct(0);
    } else if (preset === 'delay_salary') {
      setIncomeDelayDays(20);
      setIncludePurchase(false);
      setIncludeEmi(false);
      setLumpSumInflow(0);
      setDiscretionaryReductionPct(0);
    } else if (preset === 'delay_client') {
      setIncomeDelayDays(25);
      setIncludePurchase(false);
      setIncludeEmi(false);
      setLumpSumInflow(0);
      setDiscretionaryReductionPct(0);
    } else if (preset === 'increase_expenses') {
      setDiscretionaryReductionPct(-20);
      setIncludePurchase(false);
      setIncludeEmi(false);
      setIncomeDelayDays(0);
      setLumpSumInflow(0);
    } else if (preset === 'cut_discretionary') {
      setDiscretionaryReductionPct(25);
      setIncludePurchase(false);
      setIncludeEmi(false);
      setIncomeDelayDays(0);
      setLumpSumInflow(0);
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload: any = {
        transactions: transactions || [],
        current_balance: currentBalance,
        minimum_safe_balance: safeBalance,
        income_delay_days: incomeDelayDays,
        income_boost_pct: incomeBoostPct,
        account_type: accountType,
        lump_sum_inflow: lumpSumInflow,
        discretionary_spend_reduction_pct: discretionaryReductionPct,
        one_time_expenses: includePurchase && purchaseAmount > 0 ? [
          { name: purchaseName, amount: purchaseAmount, day_offset: purchaseDayOffset }
        ] : [],
        new_recurring_emis: includeEmi && emiAmount > 0 ? [
          { name: emiName, amount: emiAmount, day_of_month: emiDayOfMonth, duration_months: 6 }
        ] : []
      };

      const res = await fetch(`${apiBase}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationData(data);
      }
    } catch (e) {
      console.error('Failed to run simulation:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [
    purchaseAmount,
    purchaseDayOffset,
    includePurchase,
    emiAmount,
    emiDayOfMonth,
    includeEmi,
    incomeDelayDays,
    incomeBoostPct,
    safeBalance,
    transactions,
    currentBalance
  ]);

  const CustomSimTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt = payload[0]?.payload;
      if (!pt) return null;
      return (
        <div className="p-3 rounded-xl bg-[#0F1014] border border-white/[0.12] shadow-2xl backdrop-blur-md min-w-[220px] space-y-2 text-xs font-mono">
          <div className="font-semibold text-white/50 border-b border-white/[0.08] pb-1">
            {pt.date}
          </div>
          <div className="flex items-center justify-between text-white/70">
            <span>Baseline (P50):</span>
            <span className="text-white font-bold">₹{Math.round(pt.baseline_p50 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-[#d9f154]">
            <span>Simulated (P50):</span>
            <span className="font-bold">₹{Math.round(pt.simulated_p50 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-rose-400 text-[11px] pt-1 border-t border-white/[0.06]">
            <span>Safe Threshold:</span>
            <span>₹{Math.round(pt.safeThreshold || safeBalance).toLocaleString('en-IN')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const delta = simulationData?.delta_metrics;

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <SlidersHorizontal size={20} className="text-[#d9f154]" />
          <span>What-If Cash Flow Stress Testing</span>
        </h2>
        <p className="text-xs text-white/50 mt-1">
          Stress-test major capital expenditures, freelance payment delays, or new EMI debt before committing.
        </p>
      </div>

      {/* One-Click Scenario Presets */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-white/50 flex items-center space-x-1.5 mr-1">
          <Zap size={14} className="text-[#d9f154]" />
          <span>Scenarios:</span>
        </span>
        <button
          onClick={() => applyPreset('laptop_30k')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border ${
            activeScenario === 'laptop_30k'
              ? 'bg-[#d9f154] text-black border-[#d9f154] font-semibold'
              : 'bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
          }`}
        >
          <span>💻 Buy ₹30k Laptop</span>
        </button>
        <button
          onClick={() => applyPreset('take_loan')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border ${
            activeScenario === 'take_loan'
              ? 'bg-[#d9f154] text-black border-[#d9f154] font-semibold'
              : 'bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
          }`}
        >
          <span>🏦 Take ₹1L Loan (+₹15k EMI)</span>
        </button>
        <button
          onClick={() => applyPreset('add_emi')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border ${
            activeScenario === 'add_emi'
              ? 'bg-[#d9f154] text-black border-[#d9f154] font-semibold'
              : 'bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
          }`}
        >
          <span>💳 Add ₹15k EMI</span>
        </button>
        <button
          onClick={() => applyPreset('delay_salary')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border ${
            activeScenario === 'delay_salary'
              ? 'bg-[#d9f154] text-black border-[#d9f154] font-semibold'
              : 'bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
          }`}
        >
          <span>⏳ Delay Salary (20d)</span>
        </button>
        <button
          onClick={() => applyPreset('delay_client')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border ${
            activeScenario === 'delay_client'
              ? 'bg-[#d9f154] text-black border-[#d9f154] font-semibold'
              : 'bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
          }`}
        >
          <span>🏢 Delay Client (25d)</span>
        </button>
        <button
          onClick={() => applyPreset('increase_expenses')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border ${
            activeScenario === 'increase_expenses'
              ? 'bg-[#d9f154] text-black border-[#d9f154] font-semibold'
              : 'bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
          }`}
        >
          <span>📈 Expenses +20%</span>
        </button>
        <button
          onClick={() => applyPreset('cut_discretionary')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 border ${
            activeScenario === 'cut_discretionary'
              ? 'bg-[#d9f154] text-black border-[#d9f154] font-semibold'
              : 'bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
          }`}
        >
          <span>✂️ Cut Discretionary -25%</span>
        </button>
      </div>

      {/* Delta Metrics Headline Row: 4 Side-by-Side Comparative Cards */}
      {delta && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Shortage Probability */}
          <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.08]">
            <span className="text-xs font-mono text-white/50 block mb-1">Shortage Probability</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white">
                {delta.baseline_risk}%
              </span>
              <ArrowRight size={14} className="text-white/40" />
              <span className={`text-2xl font-bold font-mono ${delta.simulated_risk > delta.baseline_risk ? 'text-rose-400' : 'text-[#d9f154]'}`}>
                {delta.simulated_risk}%
              </span>
            </div>
            <div className="text-[11px] font-mono text-white/40 mt-1">
              {delta.risk_increase_pct > 0 ? `+${delta.risk_increase_pct}% risk shift` : 'Risk reduced / safe'}
            </div>
          </div>

          {/* 2. Minimum Projected Balance */}
          <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.08]">
            <span className="text-xs font-mono text-white/50 block mb-1">Minimum Balance</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white">
                ₹{Math.round(delta.baseline_min_balance || 0).toLocaleString('en-IN')}
              </span>
              <ArrowRight size={14} className="text-white/40" />
              <span className={`text-2xl font-bold font-mono ${delta.simulated_min_balance < delta.baseline_min_balance ? 'text-rose-400' : 'text-[#d9f154]'}`}>
                ₹{Math.round(delta.simulated_min_balance || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={`text-[11px] font-mono mt-1 ${delta.balance_impact < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              Impact: {delta.balance_impact < 0 ? '' : '+'}₹{Math.round(delta.balance_impact || 0).toLocaleString('en-IN')}
            </div>
          </div>

          {/* 3. Forecast Ending Balance */}
          <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.08]">
            <span className="text-xs font-mono text-white/50 block mb-1">Forecast 60d Balance</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white">
                ₹{Math.round(delta.baseline_ending_balance || delta.baseline_min_balance || 0).toLocaleString('en-IN')}
              </span>
              <ArrowRight size={14} className="text-white/40" />
              <span className="text-2xl font-bold font-mono text-[#d9f154]">
                ₹{Math.round(delta.simulated_ending_balance || delta.simulated_min_balance || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[11px] font-mono text-white/40 mt-1">
              Breach date: {delta.new_breach_date || 'None'}
            </div>
          </div>

          {/* 4. Safe Spending Limit */}
          <div className="p-4 rounded-xl bg-[#121418] border border-white/[0.08]">
            <span className="text-xs font-mono text-white/50 block mb-1">Safe Daily Spend Cap</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white">
                ₹{Math.round(delta.baseline_safe_limit || 850).toLocaleString('en-IN')}
              </span>
              <ArrowRight size={14} className="text-white/40" />
              <span className="text-2xl font-bold font-mono text-[#d9f154]">
                ₹{Math.round(delta.simulated_safe_limit || 850).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[11px] font-mono text-white/40 mt-1">
              Caps keep breach &lt; 10%
            </div>
          </div>
        </div>
      )}

      {/* Main Comparative Chart */}
      <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Before vs. After Trajectory (P50 Comparison)
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              White line: Current Baseline • Neon Lime: Stress Scenario
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-white/50">
            <span className="h-2 w-2 rounded-full bg-white inline-block" />
            <span>Baseline</span>
            <span className="h-2 w-2 rounded-full bg-[#d9f154] inline-block ml-2" />
            <span className="text-[#d9f154]">Simulated</span>
          </div>
        </div>

        <div className="h-[320px] w-full">
          {simulationData && simulationData.timeline && simulationData.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={simulationData.timeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#525562"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <YAxis
                  stroke="#525562"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomSimTooltip />} />
                <ReferenceLine
                  y={safeBalance}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `Buffer: ₹${safeBalance.toLocaleString('en-IN')}`,
                    position: 'right',
                    fill: '#EF4444',
                    fontSize: 10,
                    fontFamily: 'monospace'
                  }}
                />

                {/* Baseline Line */}
                <Line
                  type="monotone"
                  dataKey="baseline_p50"
                  stroke="#6B7280"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                />

                {/* Simulated Line */}
                <Line
                  type="monotone"
                  dataKey="simulated_p50"
                  stroke="#d9f154"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#d9f154', stroke: '#08090A', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-white/40">
              Running simulation...
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: Large One-Time Expense */}
        <div className="p-5 rounded-xl bg-[#121418] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center space-x-2">
              <DollarSign size={16} className="text-[#d9f154]" />
              <span>Simulate One-Time Purchase</span>
            </span>
            <input
              type="checkbox"
              checked={includePurchase}
              onChange={(e) => setIncludePurchase(e.target.checked)}
              className="accent-[#d9f154] h-4 w-4 rounded cursor-pointer"
            />
          </div>

          <div className={`space-y-3 ${!includePurchase ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <label className="text-[11px] font-mono text-white/50 block mb-1">Item Name</label>
              <input
                type="text"
                value={purchaseName}
                onChange={(e) => setPurchaseName(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/[0.1] rounded-lg text-xs text-white"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-white/60">Amount</span>
                <span className="text-[#d9f154] font-bold">₹{purchaseAmount.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={300000}
                step={5000}
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                className="w-full h-1 bg-white/[0.1] rounded appearance-none accent-[#d9f154]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-white/60">Purchase Date Offset</span>
                <span className="text-white/80">Day {purchaseDayOffset}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={purchaseDayOffset}
                onChange={(e) => setPurchaseDayOffset(Number(e.target.value))}
                className="w-full h-1 bg-white/[0.1] rounded appearance-none accent-[#d9f154]"
              />
            </div>
          </div>
        </div>

        {/* Module 2: Freelance Client Payment Delay */}
        <div className="p-5 rounded-xl bg-[#121418] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center space-x-2">
              <Calendar size={16} className="text-amber-400" />
              <span>Client Invoice Payment Delay</span>
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold">
              +{incomeDelayDays} Days
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-white/60">Simulated Payment Lag</span>
                <span className="text-white/80">{incomeDelayDays} days delayed</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={incomeDelayDays}
                onChange={(e) => setIncomeDelayDays(Number(e.target.value))}
                className="w-full h-1 bg-white/[0.1] rounded appearance-none accent-amber-400"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Simulates late client approval or escrow clearance delay.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-white/60">Client Payout Variation</span>
                <span className="text-white/80">{incomeBoostPct >= 0 ? `+${incomeBoostPct}%` : `${incomeBoostPct}%`}</span>
              </div>
              <input
                type="range"
                min={-40}
                max={40}
                step={5}
                value={incomeBoostPct}
                onChange={(e) => setIncomeBoostPct(Number(e.target.value))}
                className="w-full h-1 bg-white/[0.1] rounded appearance-none accent-[#d9f154]"
              />
            </div>
          </div>
        </div>

        {/* Module 3: New Loan / Monthly EMI */}
        <div className="p-5 rounded-xl bg-[#121418] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center space-x-2">
              <PlusCircle size={16} className="text-purple-400" />
              <span>Simulate New Monthly EMI</span>
            </span>
            <input
              type="checkbox"
              checked={includeEmi}
              onChange={(e) => setIncludeEmi(e.target.checked)}
              className="accent-purple-400 h-4 w-4 rounded cursor-pointer"
            />
          </div>

          <div className={`space-y-3 ${!includeEmi ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <label className="text-[11px] font-mono text-white/50 block mb-1">Loan Purpose</label>
              <input
                type="text"
                value={emiName}
                onChange={(e) => setEmiName(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/[0.1] rounded-lg text-xs text-white"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-white/60">Monthly Installment</span>
                <span className="text-purple-400 font-bold">₹{emiAmount.toLocaleString('en-IN')}/mo</span>
              </div>
              <input
                type="range"
                min={2000}
                max={50000}
                step={1000}
                value={emiAmount}
                onChange={(e) => setEmiAmount(Number(e.target.value))}
                className="w-full h-1 bg-white/[0.1] rounded appearance-none accent-purple-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-white/60">Debit Day of Month</span>
                <span className="text-white/80">{emiDayOfMonth}th of month</span>
              </div>
              <input
                type="range"
                min={1}
                max={28}
                step={1}
                value={emiDayOfMonth}
                onChange={(e) => setEmiDayOfMonth(Number(e.target.value))}
                className="w-full h-1 bg-white/[0.1] rounded appearance-none accent-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Module 4: Minimum Safe Buffer */}
        <div className="p-5 rounded-xl bg-[#121418] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center space-x-2">
              <Zap size={16} className="text-rose-400" />
              <span>Safe Buffer Threshold</span>
            </span>
            <span className="text-xs font-mono font-bold text-rose-400">
              ₹{safeBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-white/60">Trigger Limit</span>
                <span className="text-white/80">₹{safeBalance.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={2000}
                max={50000}
                step={1000}
                value={safeBalance}
                onChange={(e) => setSafeBalance(Number(e.target.value))}
                className="w-full h-1 bg-white/[0.1] rounded appearance-none accent-rose-400"
              />
              <p className="text-[10px] text-white/40 mt-1">
                The minimum emergency balance you refuse to drop below.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Explainability & Diagnostic Analysis */}
      {simulationData && simulationData.explanation && (
        <div className="p-5 rounded-xl bg-[#121418] border border-white/[0.08] space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-[#d9f154]" />
            <h4 className="text-sm font-semibold text-white">
              Stress Test Diagnosis & Strategy
            </h4>
          </div>

          <p className="text-xs text-white/70 leading-relaxed font-sans">
            {simulationData.explanation.root_cause || ''}
          </p>

          {simulationData.explanation.actionable_recommendations && (
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
              <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider block">
                Suggested Mitigations:
              </span>
              {simulationData.explanation.actionable_recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-white/80">
                  <span className="text-[#d9f154] mt-0.5">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
