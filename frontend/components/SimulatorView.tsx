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
  apiBase = '/api',
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
  const [simulationError, setSimulationError] = useState<string | null>(null);

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
    setSimulationError(null);
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Simulation failed (HTTP ${res.status})`);
      }
      if (!Array.isArray(data.timeline) || data.timeline.length === 0) {
        throw new Error('The simulation returned no forecast points.');
      }
      setSimulationData(data);
    } catch (e) {
      console.error('Failed to run simulation:', e);
      setSimulationError(e instanceof Error ? e.message : 'The simulation could not be completed.');
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
        <div className="p-4 rounded-2xl bg-white border border-[#EAE6F0] shadow-[0_8px_30px_-4px_rgba(118,80,168,0.12)] min-w-[220px] space-y-2 text-xs">
          <div className="font-semibold text-[#17152D] border-b border-[#EAE6F0] pb-1.5">
            {pt.date}
          </div>
          <div className="flex items-center justify-between text-[#77758A]">
            <span>Baseline (P50):</span>
            <span className="text-[#17152D] font-bold tabular-nums">₹{Math.round(pt.baseline_p50 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-[#7650A8]">
            <span className="font-semibold">Simulated (P50):</span>
            <span className="font-bold tabular-nums">₹{Math.round(pt.simulated_p50 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-[#E64B55] text-[11px] pt-1.5 border-t border-[#EAE6F0]">
            <span>Safe Threshold:</span>
            <span className="font-semibold tabular-nums">₹{Math.round(pt.safeThreshold || safeBalance).toLocaleString('en-IN')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const delta = simulationData?.delta_metrics;
  const hasTimeline = Array.isArray(simulationData?.timeline) && simulationData.timeline.length > 0;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Title & Introduction */}
      <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
        <h2 className="text-xl font-bold text-[#17152D] tracking-tight flex items-center space-x-2.5">
          <SlidersHorizontal size={22} className="text-[#7650A8]" />
          <span>What-If Financial Decision Simulator</span>
        </h2>
        <p className="text-xs text-[#77758A] mt-1.5 leading-relaxed">
          Stress-test major capital purchases, client payment delays, or loan repayments before making financial commitments.
        </p>

        {/* One-Click Scenario Presets */}
        <div className="mt-4 pt-4 border-t border-[#EAE6F0] flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#77758A] flex items-center space-x-1 mr-1">
            <Zap size={14} className="text-[#7650A8]" />
            <span>Preset Decisions:</span>
          </span>
          <button
            onClick={() => applyPreset('laptop_30k')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 border focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
              activeScenario === 'laptop_30k'
                ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                : 'bg-[#F7F5FA] text-[#17152D] hover:bg-[#F3EDFA] border-[#EAE6F0]'
            }`}
          >
            <span>💻 Buy ₹30k Laptop</span>
          </button>
          <button
            onClick={() => applyPreset('take_loan')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 border focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
              activeScenario === 'take_loan'
                ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                : 'bg-[#F7F5FA] text-[#17152D] hover:bg-[#F3EDFA] border-[#EAE6F0]'
            }`}
          >
            <span>🏦 Take ₹1L Loan (+₹15k EMI)</span>
          </button>
          <button
            onClick={() => applyPreset('add_emi')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 border focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
              activeScenario === 'add_emi'
                ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                : 'bg-[#F7F5FA] text-[#17152D] hover:bg-[#F3EDFA] border-[#EAE6F0]'
            }`}
          >
            <span>💳 Add ₹15k EMI</span>
          </button>
          <button
            onClick={() => applyPreset('delay_salary')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 border focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
              activeScenario === 'delay_salary'
                ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                : 'bg-[#F7F5FA] text-[#17152D] hover:bg-[#F3EDFA] border-[#EAE6F0]'
            }`}
          >
            <span>⏳ Delay Salary (20d)</span>
          </button>
          <button
            onClick={() => applyPreset('delay_client')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 border focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
              activeScenario === 'delay_client'
                ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                : 'bg-[#F7F5FA] text-[#17152D] hover:bg-[#F3EDFA] border-[#EAE6F0]'
            }`}
          >
            <span>🏢 Delay Client (25d)</span>
          </button>
          <button
            onClick={() => applyPreset('increase_expenses')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 border focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
              activeScenario === 'increase_expenses'
                ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                : 'bg-[#F7F5FA] text-[#17152D] hover:bg-[#F3EDFA] border-[#EAE6F0]'
            }`}
          >
            <span>📈 Expenses +20%</span>
          </button>
          <button
            onClick={() => applyPreset('cut_discretionary')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 border focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
              activeScenario === 'cut_discretionary'
                ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                : 'bg-[#F7F5FA] text-[#17152D] hover:bg-[#F3EDFA] border-[#EAE6F0]'
            }`}
          >
            <span>✂️ Cut Discretionary -25%</span>
          </button>
        </div>
      </div>

      {/* Delta Metrics Headline Row: 4 Side-by-Side Comparative Cards */}
      {delta && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Shortage Probability */}
          <div className="p-5 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A] block mb-1">Breach Probability</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-[#17152D] tabular-nums">
                {delta.baseline_risk}%
              </span>
              <ArrowRight size={16} className="text-[#77758A]" />
              <span className={`text-2xl font-bold tabular-nums ${delta.simulated_risk > delta.baseline_risk ? 'text-[#E64B55]' : 'text-[#159B72]'}`}>
                {delta.simulated_risk}%
              </span>
            </div>
            <div className="text-xs text-[#77758A] mt-1.5 font-medium">
              {delta.risk_increase_pct > 0 ? `+${delta.risk_increase_pct}% risk shift` : 'Risk reduced / safe'}
            </div>
          </div>

          {/* 2. Minimum Projected Balance */}
          <div className="p-5 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A] block mb-1">Lowest Dip Balance</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-[#17152D] tabular-nums">
                ₹{Math.round(delta.baseline_min_balance).toLocaleString('en-IN')}
              </span>
              <ArrowRight size={16} className="text-[#77758A]" />
              <span className={`text-2xl font-bold tabular-nums ${delta.simulated_min_balance < minimumSafeBalance ? 'text-[#E64B55]' : 'text-[#159B72]'}`}>
                ₹{Math.round(delta.simulated_min_balance).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-xs text-[#77758A] mt-1.5 font-medium">
              Impact: ₹{Math.round(delta.balance_impact).toLocaleString('en-IN')}
            </div>
          </div>

          {/* 3. Ending Balance */}
          <div className="p-5 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A] block mb-1">60-Day Projected End</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-[#17152D] tabular-nums">
                ₹{Math.round(delta.baseline_ending_balance ?? 0).toLocaleString('en-IN')}
              </span>
              <ArrowRight size={16} className="text-[#77758A]" />
              <span className="text-2xl font-bold text-[#7650A8] tabular-nums">
                ₹{Math.round(delta.simulated_ending_balance ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-xs text-[#77758A] mt-1.5 font-medium">
              Expected future median cash
            </div>
          </div>

          {/* 4. Safe Spending Limit */}
          <div className="p-5 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A] block mb-1">Safe Daily Living Cap</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-[#17152D] tabular-nums">
                ≤ ₹{Math.round(delta.baseline_safe_limit ?? 0).toLocaleString('en-IN')}
              </span>
              <ArrowRight size={16} className="text-[#77758A]" />
              <span className="text-2xl font-bold text-[#7650A8] tabular-nums">
                ≤ ₹{Math.round(delta.simulated_safe_limit ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-xs text-[#77758A] mt-1.5 font-medium">
              Daily cap to stay under 10% risk
            </div>
          </div>
        </div>
      )}

      {/* Decision Recommendation Banner */}
      {simulationData?.explanation && (
        <div className={`p-6 rounded-[20px] border shadow-xs ${
          delta && delta.simulated_risk > 20
            ? 'bg-[#FDF1F2] border-[#F9B8BC] text-[#9B1C23]'
            : 'bg-[#E8F8F2] border-[#B4E8D6] text-[#0E684C]'
        }`}>
          <div className="flex items-start space-x-3">
            {delta && delta.simulated_risk > 20 ? (
              <AlertTriangle className="text-[#E64B55] shrink-0 mt-0.5" size={20} />
            ) : (
              <CheckCircle2 className="text-[#159B72] shrink-0 mt-0.5" size={20} />
            )}
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {simulationData.explanation.headline}
              </h3>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {simulationData.explanation.root_cause}
              </p>
              {simulationData.explanation.actionable_recommendations && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {simulationData.explanation.actionable_recommendations.map((rec, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 border border-current shadow-xs"
                    >
                      {rec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Sliders & Decision Inputs */}
      <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] space-y-6">
        <h3 className="text-base font-bold text-[#17152D]">
          Adjust Simulation Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Purchase Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#17152D]">
              <label>One-Time Purchase Amount</label>
              <span className="text-[#7650A8] font-bold tabular-nums">₹{purchaseAmount.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={0}
              max={150000}
              step={5000}
              value={purchaseAmount}
              onChange={(e) => {
                setPurchaseAmount(Number(e.target.value));
                setIncludePurchase(Number(e.target.value) > 0);
              }}
              className="w-full h-2 bg-[#EBE2F7] rounded-lg appearance-none cursor-pointer accent-[#7650A8]"
            />
            <div className="flex justify-between text-[11px] text-[#77758A]">
              <span>₹0</span>
              <span>₹75k</span>
              <span>₹1.5 Lakh</span>
            </div>
          </div>

          {/* Timing Day Offset */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#17152D]">
              <label>Purchase Timing</label>
              <span className="text-[#7650A8] font-bold tabular-nums">In {purchaseDayOffset} days</span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={purchaseDayOffset}
              onChange={(e) => setPurchaseDayOffset(Number(e.target.value))}
              className="w-full h-2 bg-[#EBE2F7] rounded-lg appearance-none cursor-pointer accent-[#7650A8]"
            />
            <div className="flex justify-between text-[11px] text-[#77758A]">
              <span>Tomorrow</span>
              <span>30 days</span>
              <span>60 days</span>
            </div>
          </div>

          {/* Income Delay Days */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#17152D]">
              <label>Client Payment / Salary Delay</label>
              <span className="text-[#E64B55] font-bold tabular-nums">+{incomeDelayDays} days</span>
            </div>
            <input
              type="range"
              min={0}
              max={45}
              step={1}
              value={incomeDelayDays}
              onChange={(e) => setIncomeDelayDays(Number(e.target.value))}
              className="w-full h-2 bg-[#EBE2F7] rounded-lg appearance-none cursor-pointer accent-[#7650A8]"
            />
            <div className="flex justify-between text-[11px] text-[#77758A]">
              <span>On time</span>
              <span>15 days</span>
              <span>45 days late</span>
            </div>
          </div>

          {/* New EMI Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#17152D]">
              <label>New Monthly EMI</label>
              <span className="text-[#7650A8] font-bold tabular-nums">₹{emiAmount.toLocaleString('en-IN')}/mo</span>
            </div>
            <input
              type="range"
              min={0}
              max={50000}
              step={2500}
              value={emiAmount}
              onChange={(e) => {
                setEmiAmount(Number(e.target.value));
                setIncludeEmi(Number(e.target.value) > 0);
              }}
              className="w-full h-2 bg-[#EBE2F7] rounded-lg appearance-none cursor-pointer accent-[#7650A8]"
            />
            <div className="flex justify-between text-[11px] text-[#77758A]">
              <span>₹0</span>
              <span>₹25k</span>
              <span>₹50k</span>
            </div>
          </div>

          {/* Lump Sum Inflow */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#17152D]">
              <label>Lump-Sum Capital Inflow</label>
              <span className="text-[#159B72] font-bold tabular-nums">+₹{lumpSumInflow.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={0}
              max={300000}
              step={10000}
              value={lumpSumInflow}
              onChange={(e) => setLumpSumInflow(Number(e.target.value))}
              className="w-full h-2 bg-[#EBE2F7] rounded-lg appearance-none cursor-pointer accent-[#7650A8]"
            />
            <div className="flex justify-between text-[11px] text-[#77758A]">
              <span>₹0</span>
              <span>₹1.5 Lakh</span>
              <span>₹3 Lakh</span>
            </div>
          </div>

          {/* Living Spend Cut / Hike */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#17152D]">
              <label>Living Spend Adjustment</label>
              <span className="text-[#7650A8] font-bold tabular-nums">
                {discretionaryReductionPct > 0 ? `Cut ${discretionaryReductionPct}%` : (discretionaryReductionPct < 0 ? `Hike ${Math.abs(discretionaryReductionPct)}%` : 'Standard')}
              </span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              step={5}
              value={discretionaryReductionPct}
              onChange={(e) => setDiscretionaryReductionPct(Number(e.target.value))}
              className="w-full h-2 bg-[#EBE2F7] rounded-lg appearance-none cursor-pointer accent-[#7650A8]"
            />
            <div className="flex justify-between text-[11px] text-[#77758A]">
              <span>Hike +50%</span>
              <span>Baseline</span>
              <span>Cut -50%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Before / After Comparative Chart */}
      <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#17152D]">
              Comparative Trajectory: Baseline vs. Simulated Decision
            </h3>
            <p className="text-xs text-[#77758A] mt-1 font-medium">
              Comparing your status quo baseline against the simulated decision path over 60 days.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="h-0.5 w-4 bg-[#77758A] inline-block" />
              <span className="text-[#77758A]">Baseline</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-1 w-4 bg-[#7650A8] rounded inline-block" />
              <span className="text-[#7650A8] font-bold">Simulated Decision</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-0.5 w-4 border-b-2 border-dashed border-[#E64B55] inline-block" />
              <span className="text-[#E64B55]">Safe Buffer</span>
            </div>
          </div>
        </div>

        {simulationError && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F7C5C5] bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]"
          >
            <span>Simulation update failed: {simulationError}</span>
            <button
              type="button"
              onClick={runSimulation}
              className="min-h-11 rounded-full border border-[#B42318] bg-white px-4 font-semibold text-[#B42318] hover:bg-[#FFF7F7] focus-visible:outline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="relative h-[360px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hasTimeline ? simulationData.timeline : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6F0" vertical={false} />
              <XAxis dataKey="displayDate" stroke="#77758A" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE6F0' }} />
              <YAxis stroke="#77758A" fontSize={11} tickLine={false} axisLine={{ stroke: '#EAE6F0' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomSimTooltip />} />
              <ReferenceLine y={safeBalance} stroke="#E64B55" strokeDasharray="4 4" strokeWidth={1.5} />
              
              {/* Baseline Line */}
              <Line
                type="monotone"
                dataKey="baseline_p50"
                stroke="#77758A"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />

              {/* Simulated Decision Line */}
              <Line
                type="monotone"
                dataKey="simulated_p50"
                stroke="#7650A8"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: '#7650A8', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          {!hasTimeline && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95" aria-live="polite">
              {loading ? (
                <div className="w-full max-w-sm space-y-4 px-6 text-center">
                  <p className="text-sm font-semibold text-[#3B3552]">Calculating your forecast paths…</p>
                  <div className="h-2 overflow-hidden rounded-full bg-[#F4EEFA]">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-[#7650A8]" />
                  </div>
                  <p className="text-xs text-[#6B6584]">This can take a little while for detailed transaction histories.</p>
                </div>
              ) : (
                <div className="px-6 text-center">
                  <p className="text-sm font-semibold text-[#3B3552]">Your simulation chart will appear here.</p>
                  <p className="mt-1 text-xs text-[#6B6584]">Adjust a setting or retry the simulation to calculate a forecast.</p>
                  <button
                    type="button"
                    onClick={runSimulation}
                    className="mt-4 min-h-11 rounded-full bg-[#663399] px-5 text-sm font-semibold text-white hover:bg-[#55297F] focus-visible:outline"
                  >
                    Run simulation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
