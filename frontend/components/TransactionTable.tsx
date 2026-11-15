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
  apiBase?: string;
  transactions?: Transaction[] | null;
  anomalies?: Anomaly[] | null;
  piiStats?: Record<string, number> | null;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  apiBase = '/api',
  transactions,
  anomalies,
  piiStats
}) => {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const pageSize = 20;

  const categories = [
    'All', 'Income', 'Investments', 'Food', 'Travel', 'Bills & Utilities',
    'Shopping', 'Health', 'Insurance', 'EMI/Loans', 'Rent', 'Subscriptions',
    'Sales Receipts', 'Supplier Payments', 'Salaries', 'Other/Transfer'
  ];

  const handleCategoryChange = async (desc: string, newCat: string) => {
    setCategoryOverrides(prev => ({ ...prev, [desc]: newCat }));
    try {
      await fetch(`${apiBase}/categorize/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, category: newCat })
      });
    } catch (e) {
      console.error('Failed to register category correction:', e);
    }
  };

  // Safe client-side filtering
  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    return transactions.map(t => {
      const override = categoryOverrides[t.Description];
      return override ? { ...t, Category: override } : t;
    }).filter((txn) => {
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
  }, [transactions, categoryFilter, searchQuery, categoryOverrides]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Helper map for flagged anomalies
  const anomalyMap = useMemo(() => {
    const map = new Map<string, Anomaly>();
    if (anomalies && Array.isArray(anomalies)) {
      anomalies.forEach((a) => {
        const key = `${a.date}_${Math.abs(Math.round(a.amount))}_${(a.description || '').slice(0, 15)}`;
        map.set(key, a);
      });
    }
    return map;
  }, [anomalies]);

  // Category pill style mapping
  const getCategoryBadgeClass = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('income') || cat.includes('sales')) {
      return 'bg-[#E8F8F2] text-[#0E684C] border-[#B4E8D6]';
    }
    if (cat.includes('rent')) {
      return 'bg-[#F3EDFA] text-[#7650A8] border-[#7650A8]/30';
    }
    if (cat.includes('emi') || cat.includes('loan')) {
      return 'bg-[#FEF7EC] text-[#8F5805] border-[#FBD9A3]';
    }
    if (cat.includes('health') || cat.includes('emergency')) {
      return 'bg-[#FDF1F2] text-[#9B1C23] border-[#F9B8BC]';
    }
    if (cat.includes('bills') || cat.includes('util')) {
      return 'bg-[#FEF7EC] text-[#8F5805] border-[#FBD9A3]';
    }
    if (cat.includes('shopping')) {
      return 'bg-[#F3EDFA] text-[#7650A8] border-[#7650A8]/30';
    }
    return 'bg-[#F7F5FA] text-[#17152D] border-[#EAE6F0]';
  };

  return (
    <div className="space-y-5 w-full min-w-0">
      {/* Search & Filter Controls Header */}
      <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77758A]" size={16} />
            <input
              type="text"
              placeholder="Search by description, reference, or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-full bg-[#F7F5FA] border border-[#EAE6F0] text-xs text-[#17152D] placeholder-[#77758A] focus:outline-none focus:border-[#7650A8] focus:ring-2 focus:ring-[#F3EDFA] transition-all"
            />
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-[#77758A]">
              Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
            </span>

            {/* DPDP Privacy Badge */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#E8F8F2] border border-[#B4E8D6] text-[#0E684C] text-xs font-semibold">
              <ShieldCheck size={14} className="text-[#159B72]" />
              <span>DPDP Sanitized</span>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategoryFilter(cat);
                setPage(1);
              }}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${
                categoryFilter === cat
                  ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                  : 'bg-[#F7F5FA] text-[#77758A] border-[#EAE6F0] hover:bg-[#F3EDFA] hover:text-[#17152D]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5FA] text-[#77758A] border-b border-[#EAE6F0] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6F0]">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#77758A] text-xs">
                    No transactions match your search filter.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((txn, idx) => {
                  const amt = Number(txn.Amount) || 0;
                  const isPositive = amt > 0;
                  const bal = txn.Balance !== undefined ? txn.Balance : txn['Running Balance'];
                  const txnKey = `${txn.Date}_${Math.abs(Math.round(amt))}_${(txn.Description || '').slice(0, 15)}`;
                  const anomaly = anomalyMap.get(txnKey);

                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-[#F7F5FA] transition-colors ${
                        anomaly ? 'bg-[#FEF7EC]/40' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#77758A] tabular-nums">
                        {txn.Date}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-[#17152D] truncate" title={txn.Description}>
                            {txn.Description}
                          </span>
                          {anomaly && (
                            <span 
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#FEF7EC] border border-[#FBD9A3] text-[#8F5805] text-[10px] font-bold shrink-0 cursor-help"
                              title={anomaly.reason}
                            >
                              <AlertTriangle size={11} className="text-[#F5A623]" />
                              <span>Anomaly</span>
                            </span>
                          )}
                          {txn.is_ai_categorized && (
                            <span 
                              className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full bg-[#F3EDFA] text-[#7650A8] text-[9px] font-bold shrink-0 border border-[#EAE6F0]"
                              title="Categorized via TF-IDF Logistic Regression & NLP"
                            >
                              <Sparkles size={9} />
                              <span>AI</span>
                            </span>
                          )}
                        </div>
                        {txn.Reference_No && (
                          <div className="text-[11px] text-[#9896A9] truncate font-medium">
                            Ref: {txn.Reference_No}
                          </div>
                        )}
                        {anomaly && (
                          <div className="text-[11px] text-[#8F5805] mt-0.5 font-medium">
                            Notice: {anomaly.reason}
                          </div>
                        )}
                      </td>

                      {/* Category with Manual Edit Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={txn.Category || 'Other/Transfer'}
                          onChange={(e) => handleCategoryChange(txn.Description, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7650A8] ${getCategoryBadgeClass(txn.Category)}`}
                          title="Click to manually correct category"
                        >
                          {categories.filter(c => c !== 'All').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap tabular-nums">
                        <span className={`font-bold inline-flex items-center space-x-1 ${
                          isPositive ? 'text-[#159B72]' : 'text-[#17152D]'
                        }`}>
                          {isPositive ? <ArrowDownLeft size={13} className="text-[#159B72]" /> : <ArrowUpRight size={13} className="text-[#77758A]" />}
                          <span>
                            {isPositive ? '+' : ''}₹{Math.abs(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap tabular-nums font-medium text-[#77758A]">
                        {bal !== undefined ? `₹${Number(bal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3.5 px-4 bg-[#F7F5FA] border-t border-[#EAE6F0] flex items-center justify-between text-xs text-[#77758A]">
          <div>
            Page <span className="font-bold text-[#17152D]">{currentPage}</span> of <span className="font-bold text-[#17152D]">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="min-h-[36px] flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white border border-[#EAE6F0] text-[#17152D] hover:bg-[#F3EDFA] hover:text-[#7650A8] transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="min-h-[36px] flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white border border-[#EAE6F0] text-[#17152D] hover:bg-[#F3EDFA] hover:text-[#7650A8] transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
