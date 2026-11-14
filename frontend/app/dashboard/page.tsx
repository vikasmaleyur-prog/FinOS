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
import { UploadModal } from '@/components/UploadModal';
import { EmptyState } from '@/components/EmptyState';
import { 
  UploadCloud, 
  X,
  AlertCircle,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'simulator'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    <div className="min-h-screen bg-finos-background font-sans text-finos-heading">
      <header className="sticky top-0 z-40 border-b border-finos-border bg-white">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-finos-purple text-sm font-bold text-white shadow-sm">
              F
            </span>
            <span className="text-lg font-bold text-finos-heading">FinOS</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <span
              aria-label="Privacy: data stays local"
              className="inline-flex h-10 w-10 items-center justify-center gap-1.5 rounded-full bg-finos-purple-tint text-xs font-medium text-finos-purple sm:h-auto sm:w-auto sm:px-3 sm:py-2"
            >
              <ShieldCheck size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Privacy: data stays local</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-finos-purple px-4 text-xs font-semibold text-white transition-colors hover:bg-finos-purple-hover focus-visible:outline sm:text-sm"
            >
              <UploadCloud size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Import statement</span>
              <span className="sm:hidden">Import</span>
            </button>
            <Link
              href="/login"
              aria-label="Sign out"
              title="Sign out"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-finos-purple-soft bg-finos-purple-tint text-sm font-semibold text-finos-purple transition-colors hover:bg-finos-purple-soft focus-visible:outline"
            >
              <UserRound size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
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
      <main
        className={`min-w-0 pb-24 transition-[margin] duration-300 ease-out md:pb-8 ${
          isSidebarCollapsed ? 'md:ml-[84px]' : 'md:ml-64'
        }`}
      >
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <header className="mb-6 border-b border-finos-border pb-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-finos-purple">
              Your workspace <span className="px-1 text-finos-muted">/</span> {activeTab}
            </p>
            <h1 className="text-2xl font-bold text-finos-heading sm:text-3xl">
              {activeTab === 'overview' && 'Cash flow overview'}
              {activeTab === 'transactions' && 'Your transactions'}
              {activeTab === 'simulator' && 'Plan a what-if'}
            </h1>
          </header>

        {/* Upload Error Alert / Toast Notification */}
        {uploadError && (
          <div className="mb-6 flex items-start justify-between rounded-2xl border border-finos-critical-border bg-finos-critical-tint p-4 text-sm text-finos-critical-dark">
            <div className="flex items-start space-x-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <strong className="mb-0.5 block font-semibold">Could not process your statement</strong>
                <span>{uploadError}</span>
              </div>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-finos-critical-tint focus-visible:outline"
              aria-label="Dismiss error"
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
                  minSafeBalance={minSafeBalance}
                  headline={forecast?.explanation?.headline ?? overview?.risk_summary?.headline}
                  rootCause={forecast?.explanation?.root_cause ?? overview?.risk_summary?.root_cause}
                  recommendations={forecast?.explanation?.actionable_recommendations ?? overview?.risk_summary?.recommendations}
                  lowestExpectedBalance={Number(forecast?.forecast_meta?.lowest_median_balance ?? overview?.risk_summary?.lowest_median_balance ?? 0)}
                />

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
                  />
                ) : (
                  <div className="rounded-card border border-finos-border bg-finos-card p-12 text-center text-sm text-finos-muted shadow-card">
                    Preparing your forecast…
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
          </>
        )}
        </div>
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
