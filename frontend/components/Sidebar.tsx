'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  SlidersHorizontal, 
  UploadCloud, 
  ShieldAlert, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Target,
  Layers,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'overview' | 'transactions' | 'simulator' | 'accuracy' | 'multi-account';
  setActiveTab: (tab: 'overview' | 'transactions' | 'simulator' | 'accuracy' | 'multi-account') => void;
  openUploadModal: () => void;
  minSafeBalance: number;
  setMinSafeBalance: (val: number) => void;
  onDeleteData: () => void;
  hasData: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openUploadModal,
  minSafeBalance,
  setMinSafeBalance,
  onDeleteData,
  hasData,
  onRefresh,
  isRefreshing,
  isCollapsed: controlledCollapsed,
  setIsCollapsed: setControlledCollapsed
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setCollapsed = setControlledCollapsed || setInternalCollapsed;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, []);

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions' as const, label: 'Transactions', icon: ReceiptText },
    { id: 'simulator' as const, label: 'What-If Stress Test', icon: SlidersHorizontal },
    { id: 'accuracy' as const, label: 'Accuracy & Backtest', icon: Target },
    { id: 'multi-account' as const, label: 'Multi-Account', icon: Layers },
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP COLLAPSIBLE SIDEBAR (Hidden on Mobile) */}
      {/* ======================================================== */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-screen z-30 transition-all duration-300 ease-in-out border-r border-[#EAE6F0] bg-white flex-col justify-between ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#EAE6F0]">
            {!collapsed ? (
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#7650A8] flex items-center justify-center font-bold text-white text-sm shadow-sm">
                  F
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base tracking-tight text-[#17152D]">FinOS</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3EDFA] text-[#7650A8] border border-[#EAE6F0]">
                    PRO
                  </span>
                </div>
              </div>
            ) : (
              <div className="mx-auto h-8 w-8 rounded-xl bg-[#7650A8] flex items-center justify-center font-bold text-white text-sm">
                F
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#7650A8]"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Primary Navigation */}
          <div className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[44px] flex items-center space-x-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
                    isActive
                      ? 'bg-[#F3EDFA] text-[#7650A8] font-semibold shadow-xs'
                      : 'text-[#17152D] hover:text-[#17152D] hover:bg-[#F7F5FA]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 ${isActive ? 'text-[#7650A8]' : 'text-[#77758A]'}`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Quick Cash Controls */}
          <div className="px-3 pt-2">
            {!collapsed && (
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#77758A] px-3 mb-2">
                Actions
              </div>
            )}

            <div className="space-y-1.5">
              <button
                onClick={openUploadModal}
                className="w-full min-h-[44px] flex items-center space-x-3 px-3.5 py-2.5 rounded-full text-xs font-semibold text-[#7650A8] bg-[#F3EDFA] hover:bg-[#EBE2F7] active:bg-[#DBC3F0] border border-[#EAE6F0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#7650A8]"
                title={collapsed ? "Upload Statement" : undefined}
              >
                <UploadCloud size={16} className="text-[#7650A8] shrink-0" />
                {!collapsed && <span>Import Statement</span>}
              </button>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="w-full min-h-[44px] flex items-center space-x-3 px-3.5 py-2.5 rounded-full text-xs font-medium text-[#17152D] hover:text-[#17152D] hover:bg-[#F7F5FA] border border-transparent transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#7650A8]"
                title={collapsed ? "Sync Calculations" : undefined}
              >
                <RefreshCw size={15} className={`text-[#77758A] shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                {!collapsed && <span>Sync Calculations</span>}
              </button>
            </div>
          </div>

          {/* Minimum Safe Balance Slider in Sidebar */}
          {!collapsed && (
            <div className="px-3 mt-4">
              <div className="p-3.5 rounded-2xl bg-[#F7F5FA] border border-[#EAE6F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#17152D] font-semibold flex items-center space-x-1">
                    <ShieldAlert size={14} className="text-[#F5A623]" />
                    <span>Safe Buffer Target</span>
                  </span>
                  <span className="text-xs font-bold text-[#7650A8] tabular-nums">
                    ₹{minSafeBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={50000}
                  step={1000}
                  value={minSafeBalance}
                  onChange={(e) => setMinSafeBalance(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#EBE2F7] rounded-lg appearance-none cursor-pointer accent-[#7650A8]"
                />
                <p className="text-[11px] text-[#77758A] leading-tight">
                  Alerts trigger when Monte Carlo projections breach this threshold.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Privacy & Delete My Data */}
        <div className="p-3 border-t border-[#EAE6F0] space-y-2">
          {!collapsed && (
            <div className="p-2.5 rounded-xl bg-[#E8F8F2] border border-[#B4E8D6] flex items-start space-x-2">
              <ShieldCheck size={16} className="text-[#159B72] mt-0.5 shrink-0" />
              <div className="text-[11px] text-[#0E684C] leading-relaxed">
                <span className="font-bold block mb-0.5">Privacy First</span>
                100% in-memory stateless engine. Zero server transaction retention.
              </div>
            </div>
          )}

          {/* Delete Data Confirmation */}
          {showConfirmDelete ? (
            <div className="p-3 rounded-2xl bg-[#FDF1F2] border border-[#F9B8BC] space-y-2">
              {!collapsed && (
                <p className="text-xs text-[#9B1C23] font-medium leading-snug">
                  Erase statement and reset session state?
                </p>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onDeleteData();
                    setShowConfirmDelete(false);
                  }}
                  className="flex-1 min-h-[36px] py-1 px-3 rounded-full bg-[#E64B55] hover:bg-[#D03D47] text-white text-xs font-semibold transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="py-1 px-3 min-h-[36px] rounded-full bg-white border border-[#EAE6F0] text-[#17152D] text-xs font-medium hover:bg-[#F7F5FA] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={!hasData}
              className="w-full min-h-[44px] flex items-center space-x-2.5 px-3 py-2 rounded-full text-xs font-medium text-[#77758A] hover:text-[#E64B55] hover:bg-[#FDF1F2] transition-colors disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#E64B55]"
              title={collapsed ? "Reset Session Data" : undefined}
            >
              <Trash2 size={16} />
              {!collapsed && <span>Reset Session Data</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Visible only on mobile screens) */}
      {/* ======================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE6F0] md:hidden flex justify-around items-center h-16 px-1 shadow-[0_-4px_20px_-2px_rgba(118,80,168,0.05)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-[#7650A8] font-bold'
                  : 'text-[#77758A] hover:text-[#17152D]'
              }`}
            >
              <div className={`p-1 rounded-full ${isActive ? 'bg-[#F3EDFA]' : ''}`}>
                <Icon size={18} className={isActive ? 'text-[#7650A8]' : 'text-[#77758A]'} />
              </div>
              <span className="text-[10px] mt-0.5 truncate max-w-[64px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
