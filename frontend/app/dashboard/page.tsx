'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { RiskBanner } from '@/components/RiskBanner';
import { MetricsRow } from '@/components/MetricsRow';
import { ForecastChart } from '@/components/ForecastChart';
import { RecurringBillsCard } from '@/components/RecurringBillsCard';
import { CategoryDonutCard } from '@/components/CategoryDonutCard';
import { TransactionTable } from '@/components/TransactionTable';
import { SimulatorView } from '@/components/SimulatorView';
import { AccuracyView } from '@/components/AccuracyView';
import { PersonalizedLimitsCard } from '@/components/PersonalizedLimitsCard';
import { UploadModal } from '@/components/UploadModal';
import { EmptyState } from '@/components/EmptyState';
import { 
  UploadCloud, 
  CircleAlert, 
  LogOut, 
  X,
  AlertCircle
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'simulator' | 'accuracy'>('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [minSafeBalance, setMinSafeBalance] = useState<number>(5000);
  
  // Stateless Client-Side Data States
  const [transactions, setTransactions] = useState<any[] | null>(null);
  const [forecast, setForecast] = useState<any | null>(null);
  const [overview, setOverview] = useState<any | null>(null);
  const [recurringBills, setRecurringBills] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  
  // UI & Error States
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // CRITICAL: Reset previous state immediately on new upload action to prevent stale data
  const handleUploadStart = () => {
    setTransactions(null);
    setForecast(null);
    setOverview(null);
    setRecurringBills([]);
    setAnomalies([]);
    setUploadError(null);
  };

  // Populate data when statement is successfully ingested
  const handleUploadSuccess = (data: any) => {
    if (!data || !data.transactions || data.transactions.length === 0) {
      setUploadError("Failed to process statement: no valid transactions returned.");
      setTransactions(null);
      return;
    }

    setUploadError(null);
    setTransactions(data.transactions || []);
    setForecast(data.forecast || null);
    setOverview(data);
    setRecurringBills(data.recurring_bills || []);
    setAnomalies(data.anomalies || []);
    if (data.minimum_safe_balance) {
      setMinSafeBalance(Number(data.minimum_safe_balance));
    }
  };

  // Robust error notification handler
  const handleUploadError = (errorMsg: string) => {
    setUploadError(errorMsg);
    setTransactions(null);
    setForecast(null);
    setOverview(null);
  };

  // One-click sample dataset loader
  const handleLoadSample = async () => {
    handleUploadStart();
    setIsLoadingSample(true);
    setUploadError(null);

    try {
      const res = await fetch(`${API_BASE}/sample/load`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starting_balance: 75000.0,
          minimum_safe_balance: minSafeBalance
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to load sample dataset (HTTP ${res.status})`);
      }

      const data = await res.json();
      handleUploadSuccess(data);
    } catch (e: any) {
      setUploadError(e.message || "Failed to load reference dataset.");
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Purge data under DPDP Act 2023
  const handleDeleteData = () => {
    setTransactions(null);
    setForecast(null);
    setOverview(null);
    setRecurringBills([]);
    setAnomalies([]);
    setUploadError(null);
  };

  const hasData = Boolean(transactions && Array.isArray(transactions) && transactions.length > 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex font-sans selection:bg-[#d9f154] selection:text-black">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openUploadModal={() => {
          setUploadError(null);
          setIsUploadModalOpen(true);
        }}
        minSafeBalance={minSafeBalance}
        setMinSafeBalance={setMinSafeBalance}
        onDeleteData={handleDeleteData}
        hasData={hasData}
        onRefresh={() => {
          if (hasData) {
            setIsRefreshing(true);
            setTimeout(() => setIsRefreshing(false), 300);
          }
        }}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-[72px] md:ml-[260px] p-5 md:p-8 max-w-7xl transition-all">
        {/* Top Ramp-style Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] mb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-white/50 mb-1">
              <span>FINOS WORKSPACE</span>
              <span>/</span>
              <span className="text-[#d9f154] font-semibold uppercase">{activeTab}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white capitalize">
              {activeTab === 'overview' && 'Cash Flow Overview & Risk Radar'}
              {activeTab === 'transactions' && 'Ledger & Categorized Transactions'}
              {activeTab === 'simulator' && 'What-If Cash Flow Stress Testing'}
              {activeTab === 'accuracy' && 'Predictive Accuracy & Backtesting'}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Upload Button */}
            <button
              onClick={() => {
                setUploadError(null);
                setIsUploadModalOpen(true);
              }}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#d9f154] hover:bg-[#cbf037] text-black text-xs font-bold tracking-tight transition-all shadow-[0_0_15px_rgba(217,241,84,0.25)] cursor-pointer"
            >
              <UploadCloud size={15} />
              <span>Import Statement</span>
            </button>

            {/* User Avatar & Logout */}
            <Link
              href="/login"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors border border-white/[0.08]"
              title="Sign Out to Login Page"
            >
              <LogOut size={16} />
            </Link>
          </div>
        </header>

        {/* Upload Error Alert / Toast Notification */}
        {uploadError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
              <div>
                <strong className="block font-semibold mb-0.5">Failed to Process Statement</strong>
                <span>{uploadError}</span>
              </div>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Empty State when no statement is loaded */}
        {!hasData ? (
          <EmptyState
            onOpenUpload={() => {
              setUploadError(null);
              setIsUploadModalOpen(true);
            }}
            onLoadSample={handleLoadSample}
            isLoadingSample={isLoadingSample}
          />
        ) : (
          <>
            {/* ======================================================== */}
            {/* VIEW 1: OVERVIEW */}
            {/* ======================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Headline Risk Banner */}
                <RiskBanner
                  probBelowSafe={Number(forecast?.forecast_meta?.prob_below_safe_balance ?? overview?.risk_summary?.prob_below_safe_balance ?? 0)}
                  riskLevel={forecast?.forecast_meta?.risk_level ?? overview?.risk_summary?.risk_level ?? 'HEALTHY'}
                  firstBreachDate={forecast?.forecast_meta?.first_breach_date ?? overview?.risk_summary?.first_breach_date}
                  breachDateRange={overview?.risk_summary?.breach_date_range ?? forecast?.forecast_meta?.breach_date_range}
                  minSafeBalance={minSafeBalance}
                  headline={forecast?.explanation?.headline ?? overview?.risk_summary?.headline}
                  rootCause={forecast?.explanation?.root_cause ?? overview?.risk_summary?.root_cause}
                  recommendations={forecast?.explanation?.actionable_recommendations ?? overview?.risk_summary?.recommendations}
                  lowestExpectedBalance={Number(forecast?.forecast_meta?.lowest_median_balance ?? overview?.risk_summary?.lowest_median_balance ?? 0)}
                  topDrivers={overview?.risk_summary?.top_drivers ?? forecast?.explanation?.top_drivers}
                  billsBeforeInflow={overview?.risk_summary?.bills_before_inflow ?? forecast?.explanation?.bills_before_inflow}
                  expectedInflowGapDays={overview?.risk_summary?.expected_inflow_gap_days ?? forecast?.explanation?.expected_inflow_gap_days}
                />

                {/* Personalized Safe Spending Limits Card */}
                {overview?.limits && (
                  <PersonalizedLimitsCard limits={overview.limits} />
                )}

                {/* Metrics Row */}
                <MetricsRow
                  currentBalance={Number(overview?.current_balance ?? 0)}
                  inflows30d={Number(overview?.metrics_30d?.inflows ?? 0)}
                  outflows30d={Number(overview?.metrics_30d?.outflows ?? 0)}
                  netFlow30d={Number(overview?.metrics_30d?.net_flow ?? 0)}
                  fixedMonthly={Number(overview?.metrics_30d?.fixed_commitments ?? 0)}
                  meanDailyBurn={Number(forecast?.burn_metrics?.mean_daily_burn ?? 850)}
                  minimumSafeBalance={minSafeBalance}
                />

                {/* Main Recharts 60-Day Forecast Chart */}
                {forecast && forecast.timeline && forecast.timeline.length > 0 ? (
                  <ForecastChart
                    data={forecast.timeline}
                    currentBalance={Number(overview?.current_balance ?? 0)}
                    minimumSafeBalance={minSafeBalance}
                    probBelowSafe={Number(forecast?.forecast_meta?.prob_below_safe_balance ?? 0)}
                    breachDate={forecast?.forecast_meta?.first_breach_date}
                    dataSufficiency={overview?.data_sufficiency ?? forecast?.forecast_meta?.data_sufficiency}
                  />
                ) : (
                  <div className="p-12 text-center rounded-xl border border-white/[0.08] bg-[#121418] text-white/40 font-mono text-xs">
                    Computing 1,000 Monte Carlo paths...
                  </div>
                )}

                {/* Bottom Row: Recurring Obligations + Category Spending */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RecurringBillsCard
                    bills={recurringBills || []}
                    totalMonthly={Number(overview?.metrics_30d?.fixed_commitments ?? 0)}
                  />
                  <CategoryDonutCard
                    categories={overview?.category_spending || []}
                  />
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: TRANSACTIONS TABLE */}
            {/* ======================================================== */}
            {activeTab === 'transactions' && (
              <TransactionTable
                transactions={transactions || []}
                anomalies={anomalies || []}
                piiStats={overview?.pii_stats || null}
              />
            )}

            {/* ======================================================== */}
            {/* VIEW 3: WHAT-IF SIMULATOR */}
            {/* ======================================================== */}
            {activeTab === 'simulator' && (
              <SimulatorView
                apiBase={API_BASE}
                currentBalance={Number(overview?.current_balance ?? 0)}
                minimumSafeBalance={minSafeBalance}
                transactions={transactions || []}
              />
            )}

            {/* ======================================================== */}
            {/* VIEW 4: ACCURACY & BACKTESTING */}
            {/* ======================================================== */}
            {activeTab === 'accuracy' && (
              <AccuracyView
                apiBase={API_BASE}
                transactions={transactions || []}
                startingBalance={Number(overview?.starting_balance ?? 75000)}
              />
            )}
          </>
        )}
      </main>

      {/* CSV Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        apiBase={API_BASE}
        onUploadStart={handleUploadStart}
        onUploadSuccess={handleUploadSuccess}
        onError={handleUploadError}
      />
    </div>
  );
}
