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
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  apiBase,
  currentBalance,
  minimumSafeBalance,
  transactions
}) => {
  // Simulator Inputs
  const [purchaseName, setPurchaseName] = useState('New MacBook Pro M3');
  const [purchaseAmount, setPurchaseAmount] = useState<number>(125000);
  const [purchaseDayOffset, setPurchaseDayOffset] = useState<number>(10);
  const [includePurchase, setIncludePurchase] = useState<boolean>(true);

  const [emiName, setEmiName] = useState('Car / Equipment Loan');
  const [emiAmount, setEmiAmount] = useState<number>(12000);
  const [emiDayOfMonth, setEmiDayOfMonth] = useState<number>(7);
  const [includeEmi, setIncludeEmi] = useState<boolean>(false);

  const [incomeDelayDays, setIncomeDelayDays] = useState<number>(14);
  const [incomeBoostPct, setIncomeBoostPct] = useState<number>(0);
  const [safeBalance, setSafeBalance] = useState<number>(minimumSafeBalance);

  const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload: any = {
        transactions: transactions || [],
        current_balance: currentBalance,
        minimum_safe_balance: safeBalance,
        income_delay_days: incomeDelayDays,
        income_boost_pct: incomeBoostPct,
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
        <div className="min-w-[220px] space-y-2 rounded-2xl border border-finos-border bg-white p-4 text-sm text-finos-body shadow-card">
          <div className="border-b border-finos-border pb-2 font-semibold text-finos-muted">
            {pt.date}
          </div>
          <div className="flex items-center justify-between text-finos-body">
            <span>Baseline (P50):</span>
            <span className="tabular-nums font-bold text-finos-heading">₹{Math.round(pt.baseline_p50 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-finos-purple">
            <span>Simulated (P50):</span>
            <span className="tabular-nums font-bold">₹{Math.round(pt.simulated_p50 || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between border-t border-finos-border pt-2 text-xs text-finos-critical-dark">
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
        <h2 className="flex items-center gap-2 text-xl font-bold text-finos-heading">
          <SlidersHorizontal size={20} className="text-finos-purple" />
          <span>What-If Cash Flow Stress Testing</span>
        </h2>
        <p className="mt-2 text-sm text-finos-body">
          Stress-test major capital expenditures, freelance payment delays, or new EMI debt before committing.
        </p>
      </div>

      {/* Delta Metrics Headline Row */}
      {delta && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Risk Change */}
          <div className="rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
            <span className="mb-1 block text-sm font-medium text-finos-muted">Breach Probability Delta</span>
            <div className="flex items-baseline space-x-2">
              <span className="tabular-nums text-2xl font-bold text-finos-heading">
                {delta.baseline_risk}%
              </span>
              <ArrowRight size={16} className="text-finos-muted" />
              <span className={`tabular-nums text-2xl font-bold ${delta.simulated_risk > delta.baseline_risk ? 'text-finos-critical-dark' : 'text-finos-success-strong'}`}>
                {delta.simulated_risk}%
              </span>
            </div>
            <div className="mt-2 text-xs text-finos-muted">
              {delta.risk_increase_pct > 0 ? `+${delta.risk_increase_pct}% increase in risk` : 'Risk unchanged'}
            </div>
          </div>

          {/* Lowest Balance Impact */}
          <div className="rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
            <span className="mb-1 block text-sm font-medium text-finos-muted">Lowest Median Balance</span>
            <div className="flex items-baseline space-x-2">
              <span className="tabular-nums text-2xl font-bold text-finos-heading">
                ₹{Math.round(delta.simulated_min_balance || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={`mt-2 text-xs font-medium ${delta.balance_impact < 0 ? 'text-finos-critical-dark' : 'text-finos-success-strong'}`}>
              Impact: {delta.balance_impact < 0 ? '' : '+'}₹{Math.round(delta.balance_impact || 0).toLocaleString('en-IN')}
            </div>
          </div>

          {/* First Breach Date */}
          <div className="rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
            <span className="mb-1 block text-sm font-medium text-finos-muted">Simulated Breach Date</span>
            <div className="text-2xl font-bold text-finos-heading">
              {delta.new_breach_date || 'No Breach'}
            </div>
            <div className="mt-2 text-xs text-finos-muted">
              Safe buffer: ₹{safeBalance.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Main Comparative Chart */}
      <div className="rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-finos-heading">
              Before vs. After Trajectory (P50 Comparison)
            </h3>
            <p className="mt-1 text-sm text-finos-muted">
              Grey-purple line: current baseline · Purple line: simulated scenario
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-finos-body">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-finos-chart-baseline" />
            <span>Baseline</span>
            <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-finos-purple" />
            <span className="text-finos-purple">Simulated</span>
          </div>
        </div>

        <div className="h-[320px] w-full">
          {simulationData && simulationData.timeline && simulationData.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={simulationData.timeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-inter)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--chart-grid)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-inter)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--chart-grid)' }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomSimTooltip />} />
                <ReferenceLine
                  y={safeBalance}
                  stroke="var(--critical)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Buffer: ₹${safeBalance.toLocaleString('en-IN')}`,
                    position: 'right',
                    fill: 'var(--critical-dark)',
                    fontSize: 12,
                    fontFamily: 'var(--font-inter)'
                  }}
                />

                {/* Baseline Line */}
                <Line
                  type="monotone"
                  dataKey="baseline_p50"
                  stroke="var(--chart-baseline)"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                />

                {/* Simulated Line */}
                <Line
                  type="monotone"
                  dataKey="simulated_p50"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--card-background)', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-finos-muted">
              Running simulation...
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: Large One-Time Expense */}
        <div className="space-y-4 rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-finos-heading">
              <DollarSign size={18} className="text-finos-purple" />
              <span>Simulate One-Time Purchase</span>
            </span>
            <input
              type="checkbox"
              checked={includePurchase}
              onChange={(e) => setIncludePurchase(e.target.checked)}
              className="h-5 w-5 cursor-pointer accent-finos-purple focus-visible:outline"
            />
          </div>

          <div className={`space-y-4 ${!includePurchase ? 'pointer-events-none' : ''}`}>
            <div>
              <label className="mb-2 block text-sm font-medium text-finos-body">Item Name</label>
              <input
                type="text"
                value={purchaseName}
                onChange={(e) => setPurchaseName(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-finos-control-border bg-white px-3 text-sm text-finos-heading focus:border-finos-purple focus:outline-none focus:ring-2 focus:ring-finos-purple"
              />
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-finos-body">Amount</span>
                <span className="tabular-nums font-bold text-finos-purple">₹{purchaseAmount.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={300000}
                step={5000}
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                className="w-full accent-finos-purple"
              />
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-finos-body">Purchase Date Offset</span>
                <span className="text-finos-heading">Day {purchaseDayOffset}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={purchaseDayOffset}
                onChange={(e) => setPurchaseDayOffset(Number(e.target.value))}
                className="w-full accent-finos-purple"
              />
            </div>
          </div>
        </div>

        {/* Module 2: Freelance Client Payment Delay */}
        <div className="space-y-4 rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-finos-heading">
              <Calendar size={18} className="text-finos-warning-dark" />
              <span>Client Invoice Payment Delay</span>
            </span>
            <span className="rounded-full bg-finos-warning-tint px-3 py-1.5 text-xs font-semibold text-finos-warning-dark">
              +{incomeDelayDays} Days
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-finos-body">Simulated Payment Lag</span>
                <span className="text-finos-heading">{incomeDelayDays} days delayed</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={incomeDelayDays}
                onChange={(e) => setIncomeDelayDays(Number(e.target.value))}
                className="w-full accent-finos-purple"
              />
              <p className="mt-2 text-xs text-finos-muted">
                Simulates late client approval or escrow clearance delay.
              </p>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-finos-body">Client Payout Variation</span>
                <span className="text-finos-heading">{incomeBoostPct >= 0 ? `+${incomeBoostPct}%` : `${incomeBoostPct}%`}</span>
              </div>
              <input
                type="range"
                min={-40}
                max={40}
                step={5}
                value={incomeBoostPct}
                onChange={(e) => setIncomeBoostPct(Number(e.target.value))}
                className="w-full accent-finos-purple"
              />
            </div>
          </div>
        </div>

        {/* Module 3: New Loan / Monthly EMI */}
        <div className="space-y-4 rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-finos-heading">
              <PlusCircle size={18} className="text-finos-purple" />
              <span>Simulate New Monthly EMI</span>
            </span>
            <input
              type="checkbox"
              checked={includeEmi}
              onChange={(e) => setIncludeEmi(e.target.checked)}
              className="h-5 w-5 cursor-pointer accent-finos-purple focus-visible:outline"
            />
          </div>

          <div className={`space-y-4 ${!includeEmi ? 'pointer-events-none' : ''}`}>
            <div>
              <label className="mb-2 block text-sm font-medium text-finos-body">Loan Purpose</label>
              <input
                type="text"
                value={emiName}
                onChange={(e) => setEmiName(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-finos-control-border bg-white px-3 text-sm text-finos-heading focus:border-finos-purple focus:outline-none focus:ring-2 focus:ring-finos-purple"
              />
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-finos-body">Monthly Installment</span>
                <span className="tabular-nums font-bold text-finos-purple">₹{emiAmount.toLocaleString('en-IN')}/mo</span>
              </div>
              <input
                type="range"
                min={2000}
                max={50000}
                step={1000}
                value={emiAmount}
                onChange={(e) => setEmiAmount(Number(e.target.value))}
                className="w-full accent-finos-purple"
              />
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-finos-body">Debit Day of Month</span>
                <span className="text-finos-heading">{emiDayOfMonth}th of month</span>
              </div>
              <input
                type="range"
                min={1}
                max={28}
                step={1}
                value={emiDayOfMonth}
                onChange={(e) => setEmiDayOfMonth(Number(e.target.value))}
                className="w-full accent-finos-purple"
              />
            </div>
          </div>
        </div>

        {/* Module 4: Minimum Safe Buffer */}
        <div className="space-y-4 rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-finos-heading">
              <Zap size={18} className="text-finos-critical-dark" />
              <span>Safe Buffer Threshold</span>
            </span>
            <span className="tabular-nums rounded-full bg-finos-critical-tint px-3 py-1.5 text-xs font-semibold text-finos-critical-dark">
              ₹{safeBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-finos-body">Trigger Limit</span>
                <span className="tabular-nums text-finos-heading">₹{safeBalance.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={2000}
                max={50000}
                step={1000}
                value={safeBalance}
                onChange={(e) => setSafeBalance(Number(e.target.value))}
                className="w-full accent-finos-purple"
              />
              <p className="mt-2 text-xs text-finos-muted">
                The minimum emergency balance you refuse to drop below.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Explainability & Diagnostic Analysis */}
      {simulationData && simulationData.explanation && (
        <div className="space-y-4 rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
          <div className="flex items-center space-x-2">
            <Sparkles size={18} className="text-finos-purple" />
            <h4 className="text-base font-semibold text-finos-heading">
              Stress Test Diagnosis & Strategy
            </h4>
          </div>

          <p className="text-sm leading-relaxed text-finos-body">
            {simulationData.explanation.root_cause || ''}
          </p>

          {simulationData.explanation.actionable_recommendations && (
            <div className="space-y-2 border-t border-finos-border pt-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.06em] text-finos-muted">
                Suggested Mitigations:
              </span>
              {simulationData.explanation.actionable_recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-finos-body">
                  <span className="mt-0.5 text-finos-purple">•</span>
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
