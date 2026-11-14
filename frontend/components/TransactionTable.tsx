'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

interface Transaction {
  Date: string;
  Description: string;
  Amount: number;
  Category: string;
  Reference_No?: string;
  Balance?: number;
  'Running Balance'?: number;
}

interface Anomaly {
  date: string;
  description: string;
  amount: number;
  category: string;
  severity: string;
  reason: string;
  reference_no?: string;
}

interface TransactionTableProps {
  transactions?: Transaction[] | null;
  anomalies?: Anomaly[] | null;
  piiStats?: Record<string, number> | null;
}

const formatRupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  anomalies,
  piiStats
}) => {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 20;

  const categories = ['All', 'Income', 'Investments', 'Food', 'Travel', 'Bills & Utilities', 'Shopping', 'Health', 'EMI/Loans', 'Rent', 'Subscriptions', 'Other/Transfer'];

  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];

    return transactions.filter((txn) => {
      if (!txn) return false;
      if (categoryFilter !== 'All') {
        const cat = (txn.Category || '').toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const desc = (txn.Description || '').toLowerCase();
        const ref = (txn.Reference_No || '').toLowerCase();
        const cat = (txn.Category || '').toLowerCase();
        if (!desc.includes(query) && !ref.includes(query) && !cat.includes(query)) return false;
      }
      return true;
    });
  }, [transactions, categoryFilter, searchQuery]);

  const total = filteredTransactions.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const isAnomaly = (txn: Transaction) => {
    if (!anomalies || !Array.isArray(anomalies) || !txn) return false;
    return anomalies.some(
      (a) => a?.date === txn.Date && Math.abs((a?.amount || 0) - (txn.Amount || 0)) < 0.01
    );
  };

  const getAnomalyDetails = (txn: Transaction) => {
    if (!anomalies || !Array.isArray(anomalies) || !txn) return null;
    return anomalies.find(
      (a) => a?.date === txn.Date && Math.abs((a?.amount || 0) - (txn.Amount || 0)) < 0.01
    );
  };

  const getCategoryBadge = (cat: string) => {
    switch ((cat || '').toLowerCase()) {
      case 'income':
      case 'investments':
        return 'border-finos-category-income bg-finos-category-income-tint text-finos-success-strong';
      case 'rent':
        return 'border-finos-category-rent bg-finos-category-rent-tint text-finos-category-rent';
      case 'emi/loans':
      case 'emi':
        return 'border-finos-category-emi bg-finos-category-emi-tint text-finos-category-emi';
      case 'food':
        return 'border-finos-category-food bg-finos-category-food-tint text-finos-category-food-strong';
      case 'travel':
        return 'border-finos-category-travel bg-finos-category-travel-tint text-finos-category-travel';
      case 'bills & utilities':
        return 'border-finos-warning bg-finos-warning-tint text-finos-warning-dark';
      case 'health':
        return 'border-finos-category-health bg-finos-category-health-tint text-finos-category-health';
      case 'subscriptions':
        return 'border-finos-category-travel bg-finos-category-travel-tint text-finos-category-travel';
      default:
        return 'border-finos-border bg-finos-category-other-tint text-finos-category-other';
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 rounded-card border border-finos-border bg-finos-card p-6 shadow-card md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-finos-muted" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search merchant, narration or reference..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="min-h-12 w-full rounded-xl border border-finos-control-border bg-white pl-11 pr-4 text-sm text-finos-heading placeholder:text-finos-muted focus:border-finos-purple focus:outline-none focus:ring-2 focus:ring-finos-purple"
          />
        </div>
        <div className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border border-finos-success-border bg-finos-success-tint px-4 text-xs font-medium text-finos-success-strong md:self-auto">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>PII masked for your privacy</span>
        </div>
      </section>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setCategoryFilter(cat);
              setPage(1);
            }}
            aria-pressed={categoryFilter === cat}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline ${
              categoryFilter === cat
                ? 'border-finos-purple bg-finos-purple text-white'
                : 'border-finos-control-border bg-white text-finos-body hover:bg-finos-purple-tint'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-card border border-finos-border bg-finos-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="sticky top-16 z-10 bg-finos-purple-tint text-finos-body">
              <tr className="border-b border-finos-purple-soft text-xs font-semibold">
                <th scope="col" className="px-4 py-4">Date</th>
                <th scope="col" className="px-4 py-4">Description</th>
                <th scope="col" className="px-4 py-4">Category</th>
                <th scope="col" className="px-4 py-4 text-right">Amount</th>
                <th scope="col" className="px-4 py-4 text-right">Running balance</th>
                <th scope="col" className="px-4 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-finos-border text-finos-body">
              {!transactions || transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-finos-muted">
                    No transactions loaded. Please import a bank statement.
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-finos-muted">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((txn, idx) => {
                  const amt = Number(txn?.Amount || 0);
                  const isCredit = amt > 0;
                  const anomaly = isAnomaly(txn);
                  const anomalyData = anomaly ? getAnomalyDetails(txn) : null;
                  const bal = Number(txn?.['Running Balance'] ?? txn?.Balance ?? 0);
                  const category = txn?.Category || 'Other';

                  return (
                    <tr key={idx} className="transition-colors hover:bg-finos-surface-hover">
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-finos-muted">{txn?.Date || '-'}</td>
                      <td className="max-w-sm px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${getCategoryBadge(category)}`}>
                            <span className="text-sm font-semibold">{category.charAt(0)}</span>
                          </span>
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-medium text-finos-heading">
                              {txn?.Description || 'Transaction'}
                            </span>
                            {txn?.Reference_No && (
                              <span className="mt-0.5 block truncate text-xs text-finos-muted">{txn.Reference_No}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className={`inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-medium ${getCategoryBadge(category)}`}>
                          {category}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <span className={`inline-flex items-center justify-end gap-1 tabular-nums text-sm font-semibold ${isCredit ? 'text-finos-success-strong' : 'text-finos-heading'}`}>
                          {isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                          {isCredit ? '+' : ''}{formatRupees.format(Math.abs(amt))}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-finos-body">
                        ₹{Math.round(bal).toLocaleString('en-IN')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        {anomaly ? (
                          <span
                            className="inline-flex min-h-7 items-center gap-1 rounded-full border border-finos-warning-border bg-finos-warning-tint px-3 text-xs font-semibold text-finos-warning-dark"
                            title={anomalyData?.reason || 'Statistical anomaly detected'}
                          >
                            <AlertTriangle size={14} aria-hidden="true" />
                            <span>Review</span>
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-finos-success-strong">Verified</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-finos-border p-4 text-sm text-finos-body sm:flex-row sm:items-center sm:justify-between">
          <div>Showing {paginatedTransactions.length} of {total} transactions</div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-finos-control-border bg-white text-finos-purple transition-colors hover:bg-finos-purple-tint focus-visible:outline disabled:cursor-not-allowed disabled:bg-finos-purple-tint disabled:text-finos-muted"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-2 text-sm text-finos-body">Page {currentPage} of {pages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={currentPage >= pages}
              aria-label="Next page"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-finos-control-border bg-white text-finos-purple transition-colors hover:bg-finos-purple-tint focus-visible:outline disabled:cursor-not-allowed disabled:bg-finos-purple-tint disabled:text-finos-muted"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
