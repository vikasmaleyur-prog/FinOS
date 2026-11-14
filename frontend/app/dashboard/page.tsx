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
import { AskFinOSChat } from '@/components/AskFinOSChat';
import { MultiAccountView } from '@/components/MultiAccountView';
import { 
  UploadCloud, 
  LogOut, 
  X,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRightLeft,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

const API_BASE = '/api/backend';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'simulator' | 'accuracy' | 'multi-account'>('overview');
  const [accountType, setAccountType] = useState<'savings' | 'current'>('savings');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [minSafeBalance, setMinSafeBalance] = useState<number>(5000);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
  }, []);
  
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

  // Reset state on new upload action
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
    if (data.account_type) {
      setAccountType(data.account_type);
    }
  };

  const handleUploadError = (errorMsg: string) => {
    setUploadError(errorMsg);
    setTransactions(null);
    setForecast(null);
    setOverview(null);
  };

  // Sample dataset loader
  const handleLoadSample = async (datasetName: string = 'freelancer') => {
    handleUploadStart();
    setIsLoadingSample(true);
    setUploadError(null);

    const isCurrent = datasetName === 'shop_owner';
    const startBal = isCurrent ? 150000.0 : (datasetName === 'phonepe_90d' ? 45000.0 : 75000.0);
    const safeBuffer = isCurrent ? 25000.0 : 5000.0;
    const accType = isCurrent ? 'current' : 'savings';

    setAccountType(accType);
    setMinSafeBalance(safeBuffer);

    try {
      const res = await fetch(`${API_BASE}/sample/load`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_name: datasetName,
          starting_balance: startBal,
          minimum_safe_balance: safeBuffer,
          account_type: accType
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to load ${datasetName} dataset (HTTP ${res.status})`);
      }

      const data = await res.json();
      handleUploadSuccess(data);
    } catch (e: any) {
      setUploadError(e.message || "Failed to load reference dataset.");
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Dynamic account type toggle & re-forecast
  const handleSwitchAccountType = async (newType: 'savings' | 'current') => {
    setAccountType(newType);
    const newMinSafe = newType === 'current' ? 25000 : 5000;
    setMinSafeBalance(newMinSafe);

    if (transactions && transactions.length > 0) {
      try {
        const res = await fetch(`${API_BASE}/forecast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: transactions,
            current_balance: Number(overview?.current_balance ?? 75000),
            minimum_safe_balance: newMinSafe,
            account_type: newType
          })
        });

        if (res.ok) {
          const updated = await res.json();
          handleUploadSuccess(updated);
        }
      } catch (err) {
        console.error('Failed to recalculate forecast:', err);
      }
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
    <div className="min-h-screen bg-[#F7F5FA] text-[#3B3552] flex font-sans">
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
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 w-full ${isSidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'} pb-24 md:pb-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto transition-all`}>
        {/* Sticky Light Top Bar */}
        <header className="sticky top-0 z-30 bg-[#F7F5FA]/90 backdrop-blur-md border-b border-[#EAE6F0] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 transition-all">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Left: Branding & Status */}
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2 text-xs text-[#77758A] mb-1">
                <span className="font-bold uppercase tracking-wider text-[11px] text-[#77758A]">
                  {activeTab === 'multi-account' ? 'FINOS WORKSPACE / MULTI-ACCOUNT' : `YOUR WORKSPACE / ${activeTab.toUpperCase()}`}
                </span>
                
                {/* Privacy Chip */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F8F2] text-[#0E684C] border border-[#B4E8D6]">
                  <ShieldCheck size={12} className="text-[#159B72]" />
                  Privacy: data stays local
                </span>

                {overview?.dataset_loaded && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF7EC] text-[#8F5805] border border-[#FBD9A3]">
                    Demo: {overview.dataset_loaded}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17152D]">
                {activeTab === 'overview' && 'Cash flow overview'}
                {activeTab === 'transactions' && 'Ledger & Categorized Transactions'}
                {activeTab === 'simulator' && 'What-If Cash Flow Stress Testing'}
                {activeTab === 'accuracy' && 'Predictive Accuracy & Backtesting'}
                {activeTab === 'multi-account' && 'Multi-Account Consolidation & Balancing'}
              </h1>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Account Type Toggle */}
              <div className="inline-flex items-center bg-white border border-[#EAE6F0] p-1 rounded-full shadow-sm">
                <button
                  onClick={() => handleSwitchAccountType('savings')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    accountType === 'savings'
                      ? 'bg-[#7650A8] text-white shadow-sm'
                      : 'text-[#77758A] hover:text-[#17152D]'
                  }`}
                  title="Switch to Personal/Freelance Savings Account"
                >
                  Savings
                </button>
                <button
                  onClick={() => handleSwitchAccountType('current')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    accountType === 'current'
                      ? 'bg-[#7650A8] text-white shadow-sm'
                      : 'text-[#77758A] hover:text-[#17152D]'
                  }`}
                  title="Switch to Small Business Current Account"
                >
                  Current (SMB)
                </button>
              </div>

              {/* Ask FinOS Chat Button */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-[#F3EDFA] hover:bg-[#EBE2F7] active:bg-[#DBC3F0] text-[#7650A8] border border-[#EAE6F0] text-xs font-semibold tracking-tight transition-all shadow-sm cursor-pointer"
                title="Open Ask FinOS AI Chat Copilot"
              >
                <Sparkles size={15} className="text-[#7650A8]" />
                <span>Ask FinOS</span>
              </button>

              {/* Quick Upload Button */}
              <button
                onClick={() => {
                  setUploadError(null);
                  setIsUploadModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-[#7650A8] hover:bg-[#643F96] active:bg-[#523082] text-white text-xs font-semibold tracking-tight transition-all shadow-[0_2px_8px_rgba(118,80,168,0.25)] cursor-pointer"
              >
                <UploadCloud size={15} />
                <span>Import Statement</span>
              </button>

              {/* User Sign Out Link */}
              <Link
                href="/login"
                className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full bg-white hover:bg-[#F3EDFA] text-[#77758A] hover:text-[#7650A8] transition-colors border border-[#EAE6F0] shadow-sm"
                title="Sign Out to Login Page"
              >
                <LogOut size={16} />
              </Link>
            </div>
          </div>
        </header>

        {/* Upload Error Alert / Toast Notification */}
        {uploadError && (
          <div className="mb-6 p-4 rounded-[16px] bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-xs flex items-start justify-between shadow-sm">
            <div className="flex items-start space-x-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-[#E5484D]" />
              <div>
                <strong className="block font-semibold mb-0.5">Failed to Process Statement</strong>
                <span>{uploadError}</span>
              </div>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="p-1 rounded text-[#9B1C1C] hover:bg-[#FDE8E8] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Empty State when no statement is loaded */}
        {!hasData && activeTab !== 'multi-account' ? (
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

                {/* Quick-Action Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('simulator')}
                    className="p-4 rounded-[20px] bg-white border border-[#EAE6F0] hover:border-[#7650A8]/40 hover:bg-[#F3EDFA]/50 transition-all text-left shadow-[0_4px_20px_rgba(118,80,168,0.04)] group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F3EDFA] text-[#7650A8] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <SlidersHorizontal size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-[#17152D] mb-0.5">What-If Stress Test</h3>
                    <p className="text-xs text-[#77758A]">Simulate loans, delayed invoices, or major purchases</p>
                  </button>

                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="p-4 rounded-[20px] bg-white border border-[#EAE6F0] hover:border-[#7650A8]/40 hover:bg-[#F3EDFA]/50 transition-all text-left shadow-[0_4px_20px_rgba(118,80,168,0.04)] group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F3EDFA] text-[#7650A8] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-[#17152D] mb-0.5">Ask FinOS Copilot</h3>
                    <p className="text-xs text-[#77758A]">Get instant AI explanations on cash flow risks and spending</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="p-4 rounded-[20px] bg-white border border-[#EAE6F0] hover:border-[#7650A8]/40 hover:bg-[#F3EDFA]/50 transition-all text-left shadow-[0_4px_20px_rgba(118,80,168,0.04)] group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#E8F8F2] text-[#159B72] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-[#17152D] mb-0.5">Ledger & Anomalies</h3>
                    <p className="text-xs text-[#77758A]">Audit UPI transactions, DPDP redactions, and unusual spikes</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('multi-account')}
                    className="p-4 rounded-[20px] bg-white border border-[#EAE6F0] hover:border-[#7650A8]/40 hover:bg-[#F3EDFA]/50 transition-all text-left shadow-[0_4px_20px_rgba(118,80,168,0.04)] group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FEF7EC] text-[#F5A623] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <ArrowRightLeft size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-[#17152D] mb-0.5">Multi-Account Balancing</h3>
                    <p className="text-xs text-[#77758A]">Consolidate savings and current accounts to eliminate deficits</p>
                  </button>
                </div>

                {/* Personalized Safe Spending Limits Card */}
                {overview?.limits && (
                  <PersonalizedLimitsCard limits={overview.limits} />
                )}

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
                  <div className="p-12 text-center rounded-[20px] border border-[#ECE7F2] bg-white text-[#6B6584] text-xs shadow-sm">
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
                apiBase={API_BASE}
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
                accountType={accountType}
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

            {/* ======================================================== */}
            {/* VIEW 5: MULTI-ACCOUNT CONSOLIDATION */}
            {/* ======================================================== */}
            {activeTab === 'multi-account' && (
              <MultiAccountView
                apiBase={API_BASE}
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

      {/* Ask FinOS Chat Copilot Drawer */}
      <AskFinOSChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        apiBase={API_BASE}
        context={{
          current_balance: Number(overview?.current_balance ?? 75000),
          minimum_safe_balance: minSafeBalance,
          forecast: forecast,
          limits: overview?.limits,
          anomalies: anomalies,
          recurring_bills: recurringBills
        }}
        transactions={transactions || []}
      />
    </div>
  );
}
