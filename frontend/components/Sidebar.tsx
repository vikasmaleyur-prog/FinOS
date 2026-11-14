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
  Sparkles,
  RefreshCw,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'overview' | 'transactions' | 'simulator';
  setActiveTab: (tab: 'overview' | 'transactions' | 'simulator') => void;
  openUploadModal: () => void;
  minSafeBalance: number;
  setMinSafeBalance: (val: number) => void;
  onDeleteData: () => void;
  hasData: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
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
  isRefreshing
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions' as const, label: 'Transactions', icon: ReceiptText },
    { id: 'simulator' as const, label: 'What-If Simulator', icon: SlidersHorizontal },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 transition-all duration-300 ease-in-out border-r border-white/[0.08] bg-[#0A0B0E] flex flex-col justify-between ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
          {!collapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="h-7 w-7 rounded-md bg-[#d9f154] flex items-center justify-center font-bold text-black text-sm shadow-[0_0_12px_rgba(217,241,84,0.4)]">
                F
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-base tracking-tight text-white">FinOS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                  PRO
                </span>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="mx-auto h-7 w-7 rounded-md bg-[#d9f154] flex items-center justify-center font-bold text-black text-sm">
              F
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#181A20] text-white border border-white/[0.12] shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  size={18}
                  className={isActive ? 'text-[#d9f154]' : 'text-white/60'}
                />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="px-3 pt-2">
          {!collapsed && (
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 px-3 mb-2">
              Cash Controls
            </div>
          )}

          <div className="space-y-1.5">
            <button
              onClick={openUploadModal}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-white bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-colors"
              title={collapsed ? "Upload Statement" : undefined}
            >
              <UploadCloud size={16} className="text-[#d9f154]" />
              {!collapsed && <span>Upload Statement</span>}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"
              title={collapsed ? "Sync Calculations" : undefined}
            >
              <RefreshCw size={15} className={`text-white/50 ${isRefreshing ? 'animate-spin' : ''}`} />
              {!collapsed && <span>Sync Calculations</span>}
            </button>
          </div>
        </div>

        {/* Minimum Safe Balance Slider in Sidebar */}
        {!collapsed && (
          <div className="px-3 mt-4">
            <div className="p-3 rounded-lg bg-[#121418] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/60 font-medium flex items-center space-x-1">
                  <ShieldAlert size={12} className="text-amber-400" />
                  <span>Min Safe Balance</span>
                </span>
                <span className="text-xs font-mono font-semibold text-[#d9f154]">
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
                className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-[#d9f154]"
              />
              <p className="text-[10px] text-white/40 leading-tight">
                Alerts fire when 60-day Monte Carlo paths dip below this buffer.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Privacy & Delete My Data */}
      <div className="p-3 border-t border-white/[0.06] space-y-2">
        {!collapsed && (
          <div className="p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 flex items-start space-x-2">
            <ShieldCheck size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-[10px] text-white/70 leading-relaxed">
              <span className="font-semibold text-emerald-400 block mb-0.5">DPDP Act 2023 Compliant</span>
              PII is masked on-the-fly. Zero raw transaction persistence.
            </div>
          </div>
        )}

        {/* Delete My Data Button */}
        {showConfirmDelete ? (
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-2">
            {!collapsed && (
              <p className="text-[10px] text-rose-300">
                Permanently purge all data from session memory?
              </p>
            )}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => {
                  onDeleteData();
                  setShowConfirmDelete(false);
                }}
                className="flex-1 py-1 px-2 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="py-1 px-2 rounded bg-white/10 hover:bg-white/20 text-white/80 text-[11px] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmDelete(true)}
            disabled={!hasData}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-white/40 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title={collapsed ? "Delete My Data (DPDP)" : undefined}
          >
            <Trash2 size={15} />
            {!collapsed && <span>Delete My Data</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
