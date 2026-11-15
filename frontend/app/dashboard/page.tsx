'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { RiskBanner } from '@/components/RiskBanner';
import { MetricsRow } from '@/components/MetricsRow';
import { YourCardsWidget } from '@/components/YourCardsWidget';
import { ForecastChart } from '@/components/ForecastChart';
import { CategoryDonutCard } from '@/components/CategoryDonutCard';
import { RecentTransactionsCard } from '@/components/RecentTransactionsCard';
import { AIAssistantCard } from '@/components/AIAssistantCard';
import { RecurringBillsCard } from '@/components/RecurringBillsCard';
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
  Bookmark, 
  Search, 
  Sliders,
  ChevronDown
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'simulator' | 'accuracy' | 'multi-account'>('overview');
  const [accountType, setAccountType] = useState<'savings' | 'current'>('savings');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);
  const [minSafeBalance, setMinSafeBalance] = useState<number>(5000);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
    // Hydrate persistent user session from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('finos_session_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.transactions && parsed.transactions.length > 0) {
            setTransactions(parsed.transactions);
            setForecast(parsed.forecast || null);
            setOverview(parsed);
            setRecurringBills(parsed.recurring_bills || []);
            setAnomalies(parsed.anomalies || []);
            if (parsed.minimum_safe_balance) {
              setMinSafeBalance(Number(parsed.minimum_safe_balance));
            }
            if (parsed.account_type) {
              setAccountType(parsed.account_type);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to hydrate session from localStorage', e);
      }
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
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('finos_session_data', JSON.stringify(data));
      } catch (e) {
        console.warn('Could not persist session to localStorage', e);
      }
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

  const handleDeleteData = () => {
    setTransactions(null);
    setForecast(null);
    setOverview(null);
    setRecurringBills([]);
    setAnomalies([]);
    setUploadError(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('finos_session_data');
      } catch (e) {
        console.warn('Failed to clear localStorage', e);
      }
    }
  };

  const hasData = Boolean(transactions && Array.isArray(transactions) && transactions.length > 0);

  // Runway calculation for payment card
  const discretionaryBurn = Number(forecast?.burn_metrics?.mean_daily_burn ?? 850);
  const fixedMonthly = Number(overview?.metrics_30d?.fixed_commitments ?? 0);
  const currentBal = Number(overview?.current_balance ?? 0);
  const daysOfRunway = Math.max(
    0,
    Math.round((currentBal - minSafeBalance) / (discretionaryBurn + (fixedMonthly / 30)))
  );

  return (
    <div className="min-h-screen text-[#3B3552] flex font-sans selection:bg-[#F3EDFA] selection:text-[#7650A8]">
      {/* Floating Dock Sidebar Navigation */}
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
      <main className={`flex-1 min-w-0 w-full ${isSidebarCollapsed ? 'md:ml-[98px]' : 'md:ml-[280px]'} pb-24 md:pb-8 p-4 sm:p-6 lg:p-8 pr-4 sm:pr-6 lg:pr-10 max-w-[1600px] transition-all duration-300`}>
        {/* Top Header (Paynix Style) */}
        <header className="mb-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Greeting & User Name */}
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 text-xs text-[#77758A] font-semibold">
                <span>Hey, Welcome</span>
                <span className="text-sm">👋</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17152D] mt-0.5">
                {overview?.account_holder || (activeTab === 'overview' ? 'Jhon Lelly' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
              </h1>
            </div>

            {/* Center: Rounded Pill Search Bar */}
            <div className="flex-1 max-w-md hidden lg:block mx-4">
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-4 text-[#77758A] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search transaction, card, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-full bg-white border border-[#ECE7F2] text-xs sm:text-sm text-[#17152D] placeholder-[#77758A] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#7650A8] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Right: Controls & Profile */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Account Type Toggle Switch */}
              <div className="inline-flex items-center bg-white border border-[#ECE7F2] p-1 rounded-full shadow-xs">
                <button
                  onClick={() => handleSwitchAccountType('savings')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    accountType === 'savings'
                      ? 'bg-[#181326] text-white shadow-xs'
                      : 'text-[#77758A] hover:text-[#17152D]'
                  }`}
                  title="Switch to Personal Savings"
                >
                  Savings
                </button>
                <button
                  onClick={() => handleSwitchAccountType('current')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    accountType === 'current'
                      ? 'bg-[#181326] text-white shadow-xs'
                      : 'text-[#77758A] hover:text-[#17152D]'
                  }`}
                  title="Switch to SMB Current Account"
                >
                  Current
                </button>
              </div>

              {/* Ask FinOS Chat Trigger */}
              <button
                onClick={() => {
                  setChatInitialPrompt(undefined);
                  setIsChatOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F3EDFA] hover:bg-[#EBE2F7] active:bg-[#DBC3F0] text-[#7650A8] border border-[#ECE7F2] text-xs font-semibold transition-all shadow-xs cursor-pointer"
                title="Open Ask FinOS Copilot"
              >
                <Sparkles size={14} className="text-[#7650A8]" />
                <span className="hidden sm:inline">Ask FinOS</span>
              </button>

              {/* Quick Upload Button */}
              <button
                onClick={() => {
                  setUploadError(null);
                  setIsUploadModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7650A8] hover:bg-[#643F96] active:bg-[#523082] text-white text-xs font-semibold transition-all shadow-[0_4px_12px_rgba(118,80,168,0.25)] cursor-pointer"
              >
                <UploadCloud size={14} />
                <span>Import Statement</span>
              </button>

              {/* Bookmark / Quick Action Button */}
              <button
                type="button"
                className="p-2.5 rounded-full bg-white hover:bg-[#F3EDFA] text-[#77758A] hover:text-[#7650A8] border border-[#ECE7F2] shadow-xs transition-colors hidden sm:inline-flex"
                title="Saved Insights"
              >
                <Bookmark size={16} />
              </button>

              {/* User Profile Avatar with Active Indicator */}
              <Link
                href="/login"
                className="relative group p-0.5 rounded-full bg-white border border-[#ECE7F2] shadow-xs hover:border-[#7650A8] transition-all"
                title="User Profile / Sign Out"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6838AC] to-[#9965E8] flex items-center justify-center text-white text-xs font-bold uppercase shadow-2xs">
                  {overview?.account_holder ? overview.account_holder.charAt(0) : 'JL'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#159B72] border-2 border-white" />
              </Link>
            </div>
          </div>
        </header>

        {/* Upload Error Alert / Toast Notification */}
        {uploadError && (
          <div className="mb-6 p-4 rounded-[20px] bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-xs flex items-start justify-between shadow-xs">
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
            {/* VIEW 1: OVERVIEW (Paynix Exact Layout) */}
            {/* ======================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Row 1: 4 Top KPI Metric Cards (Total Balance, Net Profit, Monthly Income, Monthly Expenses) */}
                <MetricsRow
                  currentBalance={Number(overview?.current_balance ?? 0)}
                  inflows30d={Number(overview?.metrics_30d?.inflows ?? 0)}
                  outflows30d={Number(overview?.metrics_30d?.outflows ?? 0)}
                  netFlow30d={Number(overview?.metrics_30d?.net_flow ?? 0)}
                  fixedMonthly={Number(overview?.metrics_30d?.fixed_commitments ?? 0)}
                  meanDailyBurn={Number(forecast?.burn_metrics?.mean_daily_burn ?? 850)}
                  minimumSafeBalance={minSafeBalance}
                />

                {/* Risk Banner (Sleek Redesigned Card) */}
                {(forecast?.forecast_meta?.prob_below_safe_balance !== undefined || overview?.risk_summary) && (
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
                )}

                {/* Row 2: "Your Cards" (Left) + "Transaction Overview" Area Chart (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div className="lg:col-span-5 flex">
                    <YourCardsWidget
                      currentBalance={Number(overview?.current_balance ?? 0)}
                      minSafeBalance={minSafeBalance}
                      daysOfRunway={daysOfRunway}
                      accountType={accountType}
                      accountHolder={overview?.account_holder || 'JHON LELLY'}
                      accountNumber={overview?.account_number || '•••• 8589'}
                    />
                  </div>
                  <div className="lg:col-span-7 flex">
                    <ForecastChart
                      data={forecast?.timeline}
                      currentBalance={Number(overview?.current_balance ?? 0)}
                      minimumSafeBalance={minSafeBalance}
                      probBelowSafe={Number(forecast?.forecast_meta?.prob_below_safe_balance ?? 0)}
                      breachDate={forecast?.forecast_meta?.first_breach_date}
                      dataSufficiency={overview?.data_sufficiency ?? forecast?.forecast_meta?.data_sufficiency}
                    />
                  </div>
                </div>

                {/* Row 3: Expense Breakdown (Donut) + Recent Transactions + AI Assistant */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                  <div className="flex">
                    <CategoryDonutCard
                      categories={overview?.category_spending || []}
                    />
                  </div>

                  <div className="flex">
                    <RecentTransactionsCard
                      transactions={transactions || []}
                      onViewAll={() => setActiveTab('transactions')}
                    />
                  </div>

                  <div className="flex">
                    <AIAssistantCard
                      onOpenChat={(prompt) => {
                        setChatInitialPrompt(prompt);
                        setIsChatOpen(true);
                      }}
                    />
                  </div>
                </div>

                {/* Quick Action Navigation Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <button
                    onClick={() => setActiveTab('simulator')}
                    className="p-4 rounded-[22px] bg-white border border-[#ECE7F2] hover:border-[#7650A8]/40 hover:bg-[#F3EDFA]/40 transition-all text-left shadow-[0_4px_20px_rgba(118,80,168,0.03)] group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F3EDFA] text-[#7650A8] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <SlidersHorizontal size={18} />
                    </div>
                    <h3 className="font-bold text-sm text-[#17152D] mb-0.5">What-If Stress Test</h3>
                    <p className="text-xs text-[#77758A]">Simulate loans, delayed invoices, or major purchases</p>
                  </button>

                  <button
                    onClick={() => {
                      setChatInitialPrompt(undefined);
                      setIsChatOpen(true);
                    }}
                    className="p-4 rounded-[22px] bg-white border border-[#ECE7F2] hover:border-[#7650A8]/40 hover:bg-[#F3EDFA]/40 transition-all text-left shadow-[0_4px_20px_rgba(118,80,168,0.03)] group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F3EDFA] text-[#7650A8] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Sparkles size={18} />
                    </div>
                    <h3 className="font-bold text-sm text-[#17152D] mb-0.5">Ask FinOS Copilot</h3>
                    <p className="text-xs text-[#77758A]">Get instant AI explanations on cash flow risks and spending</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="p-4 rounded-[22px] bg-white border border-[#ECE7F2] hover:border-[#7650A8]/40 hover:bg-[#F3EDFA]/40 transition-all text-left shadow-[0_4px_20px_rgba(118,80,168,0.03)] group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#E8F8F2] text-[#159B72] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet size={18} />
                    </div>
                    <h3 className="font-bold text-sm text-[#17152D] mb-0.5">Ledger & Anomalies</h3>
                    <p className="text-xs text-[#77758A]">Audit UPI transactions, DPDP redactions, and unusual spikes</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('multi-account')}
                    className="p-4 rounded-[22px] bg-white border border-[#ECE7F2] hover:border-[#7650A8]/40 hover:bg-[#F3EDFA]/40 transition-all text-left shadow-[0_4px_20px_rgba(118,80,168,0.03)] group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FEF7EC] text-[#F5A623] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <ArrowRightLeft size={18} />
                    </div>
                    <h3 className="font-bold text-sm text-[#17152D] mb-0.5">Multi-Account Balancing</h3>
                    <p className="text-xs text-[#77758A]">Consolidate savings and current accounts to eliminate deficits</p>
                  </button>
                </div>

                {/* Personalized Limits & Recurring Bills */}
                {overview?.limits && (
                  <div className="pt-2">
                    <PersonalizedLimitsCard limits={overview.limits} />
                  </div>
                )}

                {recurringBills && recurringBills.length > 0 && (
                  <div className="pt-2">
                    <RecurringBillsCard
                      bills={recurringBills || []}
                      totalMonthly={Number(overview?.metrics_30d?.fixed_commitments ?? 0)}
                    />
                  </div>
                )}
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

      {/* CSV / PDF Upload Modal */}
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
