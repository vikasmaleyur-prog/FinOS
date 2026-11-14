'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDownLeft, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface Transaction {
  Date: string;
  Description: string;
  Amount: number;
  Category: string;
  Reference_No?: string;
  Balance?: number;
  'Running Balance'?: number;
  is_ai_categorized?: boolean;
  categorization_method?: string;
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

  // Safe client-side filtering with optional chaining
  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    return transactions.filter((txn) => {
      if (!txn) return false;
      
      // Category filter
      if (categoryFilter !== 'All') {
        const cat = (txn.Category || '').toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const desc = (txn.Description || '').toLowerCase();
        const ref = (txn.Reference_No || '').toLowerCase();
        const cat = (txn.Category || '').toLowerCase();
        if (!desc.includes(query) && !ref.includes(query) && !cat.includes(query)) {
          return false;
        }
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

  // Check if a transaction is flagged as anomaly safely
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
        return 'bg-[#d9f154]/10 text-[#d9f154] border-[#d9f154]/30';
      case 'investments':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'rent':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'emi/loans':
      case 'emi':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'food':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'travel':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'bills & utilities':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'shopping':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'health':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      case 'subscriptions':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-white/[0.06] text-white/70 border-white/[0.1]';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-[#121418] border border-white/[0.08]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search merchant, narration, reference number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/[0.1] rounded-lg text-xs font-sans text-white placeholder-white/40 focus:outline-none focus:border-[#d9f154] transition-colors"
          />
        </div>

        {/* DPDP Act 2023 Masking Indicator */}
        <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20 px-3 py-1.5 rounded-lg shrink-0">
          <ShieldCheck size={14} />
          <span>DPDP Act 2023: PII Masked & Zero-Retention</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories?.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategoryFilter(cat);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              categoryFilter === cat
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-white/[0.08] bg-[#121418] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-white/40">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description (PII Sanitized)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] font-sans">
              {!transactions || transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40 font-mono">
                    No transactions loaded. Please import a bank statement.
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40 font-mono">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                paginatedTransactions?.map((txn, idx) => {
                  const amt = Number(txn?.Amount || 0);
                  const isCredit = amt > 0;
                  const anomaly = isAnomaly(txn);
                  const anomalyData = anomaly ? getAnomalyDetails(txn) : null;
                  const bal = Number(txn?.['Running Balance'] ?? txn?.Balance ?? 0);

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-white/60 text-[11px] whitespace-nowrap">
                        {txn?.Date || '-'}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white truncate group-hover:text-[#d9f154] transition-colors">
                            {txn?.Description || 'Transaction'}
                          </span>
                        </div>
                        {txn?.Reference_No && (
                          <div className="text-[10px] font-mono text-white/30 mt-0.5">
                            {txn.Reference_No}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${getCategoryBadge(txn?.Category || 'Other')}`}>
                            {txn?.Category || 'Other'}
                          </span>
                          {txn?.is_ai_categorized && (
                            <span 
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              title="Categorized via AI LLM Fallback (DPDP Masked)"
                            >
                              <Sparkles size={9} />
                              <span>AI-categorized</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-semibold whitespace-nowrap">
                        <span className={isCredit ? 'text-[#d9f154]' : 'text-white'}>
                          {isCredit ? '+' : ''}₹{Math.abs(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Running Balance */}
                      <td className="py-3 px-4 text-right font-mono text-white/60 whitespace-nowrap">
                        ₹{Math.round(bal).toLocaleString('en-IN')}
                      </td>

                      {/* Status / Anomaly */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {anomaly ? (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-help"
                              title={anomalyData?.reason || "Statistical anomaly detected by Isolation Forest"}
                            >
                              <AlertTriangle size={11} />
                              <span>ANOMALY</span>
                            </span>
                            {anomalyData?.reason && (
                              <span className="text-[10px] text-amber-400/90 font-mono max-w-[200px] truncate" title={anomalyData.reason}>
                                {anomalyData.reason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-white/30">
                            VERIFIED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-4 border-t border-white/[0.08] text-xs font-mono text-white/50">
          <div>
            Showing {paginatedTransactions.length} of {total} transactions
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-white/80">
              Page {currentPage} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={currentPage >= pages}
              className="p-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
