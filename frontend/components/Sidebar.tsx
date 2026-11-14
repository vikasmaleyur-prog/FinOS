'use client';

import React from 'react';
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
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
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
  collapsed,
  onCollapsedChange,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions' as const, label: 'Transactions', icon: ReceiptText },
    { id: 'simulator' as const, label: 'What-If', icon: SlidersHorizontal },
  ];

  return (
    <>
      <aside
        className={`fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] flex-col justify-between rounded-r-3xl border-r border-finos-border bg-white px-3 py-5 shadow-card transition-[width] duration-300 ease-out md:flex ${
          collapsed ? 'w-[84px]' : 'w-64'
        }`}
      >
        <div>
          <div className="mb-5 flex items-center justify-between px-1">
            {!collapsed && (
              <span className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-finos-muted">
                Workspace
              </span>
            )}
            <button
              type="button"
              onClick={() => onCollapsedChange(!collapsed)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-finos-muted transition-colors hover:bg-finos-purple-tint hover:text-finos-purple focus-visible:outline"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav aria-label="Main navigation" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex h-12 w-full items-center gap-3 rounded-full px-3 text-left text-sm font-medium transition-colors focus-visible:outline ${
                    isActive
                      ? 'bg-finos-purple-tint text-finos-purple'
                      : 'text-finos-body hover:bg-finos-background hover:text-finos-heading'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={19} aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="mt-7 space-y-2">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-finos-muted">
                Cash controls
              </p>
            )}
            <button
              type="button"
              onClick={openUploadModal}
              className={`flex h-11 w-full items-center gap-3 rounded-full border border-finos-purple-soft bg-white px-3 text-sm font-semibold text-finos-purple transition-colors hover:bg-finos-purple-tint focus-visible:outline ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Upload statement' : undefined}
            >
              <UploadCloud size={18} aria-hidden="true" />
              {!collapsed && <span>Upload statement</span>}
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`flex h-11 w-full items-center gap-3 rounded-full px-3 text-sm font-medium text-finos-body transition-colors hover:bg-finos-background focus-visible:outline disabled:cursor-wait ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Refresh calculations' : undefined}
            >
              <RefreshCw
                size={17}
                className={isRefreshing ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              {!collapsed && <span>Refresh calculations</span>}
            </button>
          </div>

          {!collapsed && (
            <div className="mt-5 rounded-2xl border border-finos-border bg-finos-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-finos-body">
                  <ShieldAlert size={15} className="text-finos-warning-dark" aria-hidden="true" />
                  Safe balance
                </span>
                <span className="tabular-nums text-xs font-semibold text-finos-purple">
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
                aria-label="Minimum safe balance"
                className="w-full accent-finos-purple"
              />
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-finos-border pt-4">
          {!collapsed && (
            <div className="flex gap-2 rounded-2xl bg-finos-purple-tint p-3 text-xs leading-relaxed text-finos-body">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-finos-success-strong" aria-hidden="true" />
              <p>
                <span className="block font-semibold text-finos-heading">Privacy first</span>
                Your data stays local to this session.
              </p>
            </div>
          )}

          {showConfirmDelete ? (
            <div className="space-y-2 rounded-2xl border border-finos-critical-border bg-finos-critical-tint p-3">
              {!collapsed && (
                <p className="text-xs leading-relaxed text-finos-body">
                  Delete your data from this session?
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteData();
                    setShowConfirmDelete(false);
                  }}
                  className="min-h-11 flex-1 rounded-full bg-finos-critical px-3 text-xs font-semibold text-white transition-colors hover:bg-finos-critical-dark"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="min-h-11 flex-1 rounded-full border border-finos-border bg-white px-3 text-xs font-semibold text-finos-body hover:bg-finos-background"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              disabled={!hasData}
              className={`flex min-h-11 w-full items-center gap-2 rounded-full px-3 text-sm font-medium text-finos-critical-dark transition-colors hover:bg-finos-critical-tint focus-visible:outline disabled:cursor-not-allowed disabled:bg-finos-critical-tint disabled:text-finos-muted ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Delete my data' : undefined}
            >
              <Trash2 size={17} aria-hidden="true" />
              {!collapsed && <span>Delete my data</span>}
            </button>
          )}
        </div>
      </aside>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-finos-border bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-1 shadow-card md:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium focus-visible:outline ${
                isActive ? 'text-finos-purple' : 'text-finos-muted'
              }`}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
