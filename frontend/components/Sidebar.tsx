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
  Sparkles,
  Settings,
  HelpCircle
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
    { id: 'simulator' as const, label: 'What-If Simulator', icon: SlidersHorizontal },
    { id: 'accuracy' as const, label: 'Accuracy & Backtest', icon: Target },
    { id: 'multi-account' as const, label: 'Multi-Account', icon: Layers },
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP FLOATING DOCK / SIDEBAR (Paynix Style) */}
      {/* ======================================================== */}
      <aside
        className={`hidden md:flex fixed top-4 left-4 bottom-4 z-30 transition-all duration-300 ease-in-out border border-[#ECE7F2] bg-white rounded-[28px] shadow-[0_12px_40px_rgba(118,80,168,0.06)] flex-col justify-between overflow-hidden ${
          collapsed ? 'w-[74px]' : 'w-[250px]'
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Logo Brand Header */}
          <div className="h-20 flex items-center justify-between px-4 border-b border-[#ECE7F2]/60">
            {!collapsed ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6838AC] to-[#9965E8] flex items-center justify-center shadow-[0_4px_12px_rgba(118,80,168,0.3)]">
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#6838AC]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-lg tracking-tight text-[#17152D]">FinOS</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#F3EDFA] text-[#7650A8] border border-[#ECE7F2]">
                      AI 2.0
                    </span>
                  </div>
                  <span className="text-[10px] text-[#77758A] block -mt-0.5">Financial Operating System</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6838AC] to-[#9965E8] flex items-center justify-center shadow-[0_4px_12px_rgba(118,80,168,0.3)]">
                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#6838AC]" />
                </div>
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors focus:outline-none"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {/* Primary Navigation List */}
          <div className="p-3 space-y-2 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[46px] flex items-center space-x-3 px-3 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all focus:outline-none ${
                    isActive
                      ? 'bg-[#181326] text-white shadow-[0_6px_16px_rgba(24,19,38,0.25)]'
                      : 'text-[#77758A] hover:text-[#17152D] hover:bg-[#F8F5FC]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-[#77758A]'
                  }`}>
                    <Icon size={18} />
                  </div>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Actions & Safe Buffer Settings */}
          <div className="px-3 pt-3 mt-auto">
            {!collapsed && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#77758A] px-3 mb-2">
                Quick Actions
              </div>
            )}

            <div className="space-y-1.5">
              <button
                onClick={openUploadModal}
                className="w-full min-h-[42px] flex items-center space-x-3 px-3 py-2 rounded-2xl text-xs font-semibold text-[#7650A8] bg-[#F3EDFA] hover:bg-[#EBE2F7] active:bg-[#DBC3F0] border border-[#ECE7F2] transition-colors"
                title={collapsed ? "Import Statement" : undefined}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                  <UploadCloud size={17} className="text-[#7650A8]" />
                </div>
                {!collapsed && <span>Import Statement</span>}
              </button>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="w-full min-h-[40px] flex items-center space-x-3 px-3 py-2 rounded-2xl text-xs font-medium text-[#77758A] hover:text-[#17152D] hover:bg-[#F7F5FA] transition-colors disabled:opacity-50"
                title={collapsed ? "Sync Engine" : undefined}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                  <RefreshCw size={15} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                </div>
                {!collapsed && <span>Sync Engine</span>}
              </button>
            </div>

            {/* Minimum Safe Balance Slider in Expanded Mode */}
            {!collapsed && (
              <div className="mt-4 p-3.5 rounded-2xl bg-[#F7F5FA] border border-[#ECE7F2] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#17152D] font-bold flex items-center space-x-1">
                    <ShieldAlert size={13} className="text-[#F5A623]" />
                    <span>Safe Buffer</span>
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
              </div>
            )}
          </div>

          {/* Privacy & Reset Session Data */}
          <div className="p-3 border-t border-[#ECE7F2]/60 mt-3 space-y-1.5">
            {showConfirmDelete ? (
              <div className="p-2.5 rounded-2xl bg-[#FDF1F2] border border-[#F9B8BC] space-y-2">
                {!collapsed && (
                  <p className="text-[11px] text-[#9B1C23] font-medium leading-tight">
                    Reset statement session?
                  </p>
                )}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      onDeleteData();
                      setShowConfirmDelete(false);
                    }}
                    className="flex-1 py-1 px-2 rounded-xl bg-[#E64B55] text-white text-[11px] font-semibold"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="py-1 px-2 rounded-xl bg-white border border-[#ECE7F2] text-[#17152D] text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmDelete(true)}
                disabled={!hasData}
                className="w-full min-h-[38px] flex items-center space-x-3 px-3 py-1.5 rounded-2xl text-xs font-medium text-[#77758A] hover:text-[#E64B55] hover:bg-[#FDF1F2] transition-colors disabled:opacity-40 disabled:pointer-events-none"
                title={collapsed ? "Reset Session" : undefined}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                  <Trash2 size={15} />
                </div>
                {!collapsed && <span>Reset Session</span>}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {/* ======================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ECE7F2] md:hidden flex justify-around items-center h-16 px-1 shadow-[0_-4px_20px_rgba(118,80,168,0.06)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all ${
                isActive ? 'text-[#7650A8] font-bold' : 'text-[#77758A]'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${isActive ? 'bg-[#181326] text-white shadow-xs' : ''}`}>
                <Icon size={18} className={isActive ? 'text-white' : 'text-[#77758A]'} />
              </div>
              <span className="text-[10px] mt-0.5 truncate max-w-[64px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
