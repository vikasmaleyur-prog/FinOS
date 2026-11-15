'use client';

import React from 'react';
import { 
  MoreHorizontal, 
  ShoppingBag, 
  Coffee, 
  Tv, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard,
  Building,
  Briefcase,
  Zap,
  ArrowRight
} from 'lucide-react';

interface Transaction {
  date: string;
  time?: string;
  description: string;
  merchant?: string;
  amount: number;
  type?: 'DEBIT' | 'CREDIT' | string;
  category?: string;
  is_anomaly?: boolean;
}

interface RecentTransactionsCardProps {
  transactions?: Transaction[] | null;
  onViewAll?: () => void;
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  transactions,
  onViewAll
}) => {
  const safeTxns = (transactions || []).slice(0, 4);

  // Category Icon & Color Mapping inspired by Paynix Brand Icons
  const getCategoryMeta = (cat: string = '', amount: number = 0, desc: string = '') => {
    const text = (cat + ' ' + desc).toLowerCase();
    
    if (amount > 0 || text.includes('salary') || text.includes('client') || text.includes('inflow')) {
      return {
        icon: ArrowDownLeft,
        bg: 'bg-[#E8F8F2]',
        color: 'text-[#159B72]',
        dotColor: '#159B72'
      };
    }
    if (text.includes('food') || text.includes('swiggy') || text.includes('zomato') || text.includes('zepto') || text.includes('blinkit')) {
      return {
        icon: Coffee,
        bg: 'bg-[#FFF4E5]',
        color: 'text-[#FF8800]',
        dotColor: '#FF8800'
      };
    }
    if (text.includes('shopping') || text.includes('amazon') || text.includes('flipkart') || text.includes('myntra')) {
      return {
        icon: ShoppingBag,
        bg: 'bg-[#F3EDFA]',
        color: 'text-[#7650A8]',
        dotColor: '#7650A8'
      };
    }
    if (text.includes('sub') || text.includes('netflix') || text.includes('spotify') || text.includes('software') || text.includes('figma')) {
      return {
        icon: Tv,
        bg: 'bg-[#EBF5FF]',
        color: 'text-[#3B82F6]',
        dotColor: '#3B82F6'
      };
    }
    if (text.includes('rent') || text.includes('bill') || text.includes('emi') || text.includes('utility')) {
      return {
        icon: Building,
        bg: 'bg-[#FEF7EC]',
        color: 'text-[#F5A623]',
        dotColor: '#F5A623'
      };
    }
    return {
      icon: CreditCard,
      bg: 'bg-[#F7F5FA]',
      color: 'text-[#77758A]',
      dotColor: '#77758A'
    };
  };

  return (
    <div className="rounded-[24px] border border-[#ECE7F2] bg-white p-6 shadow-[0_8px_30px_rgba(118,80,168,0.05)] w-full flex flex-col justify-between transition-all hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)]">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#17152D] tracking-tight">Recent Transactions</h3>
            <p className="text-xs text-[#77758A] mt-0.5">Live stream from primary account</p>
          </div>
          <button 
            type="button"
            className="p-1 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors"
            title="Transaction Options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Transactions List */}
        <div className="divide-y divide-[#ECE7F2]/60">
          {safeTxns.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#77758A]">
              No transactions recorded yet.
            </div>
          ) : (
            safeTxns.map((tx, idx) => {
              const meta = getCategoryMeta(tx.category, tx.amount, tx.description);
              const Icon = meta.icon;
              const isPositive = tx.amount > 0;
              const cleanMerchant = tx.merchant || tx.description || 'Transaction';

              return (
                <div key={idx} className="py-3.5 flex items-center justify-between group hover:bg-[#F8F5FC]/60 px-2 -mx-2 rounded-xl transition-colors">
                  {/* Left: Brand Icon + Title & Date */}
                  <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.bg} ${meta.color} shadow-xs`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-[#17152D] truncate">
                        {cleanMerchant}
                      </div>
                      <div className="text-[11px] text-[#77758A] truncate mt-0.5">
                        {tx.date} {tx.time ? `· ${tx.time}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right shrink-0">
                    <div className={`text-xs sm:text-sm font-bold tabular-nums ${
                      isPositive ? 'text-[#159B72]' : 'text-[#17152D]'
                    }`}>
                      {isPositive ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    {tx.category && (
                      <span className="text-[10px] text-[#77758A] uppercase tracking-wider font-medium">
                        {tx.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Action */}
      {onViewAll && (
        <div className="mt-4 pt-3 border-t border-[#ECE7F2]">
          <button
            onClick={onViewAll}
            className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold text-[#7650A8] hover:text-[#523082] hover:bg-[#F3EDFA] rounded-xl transition-colors cursor-pointer"
          >
            <span>View All Transactions</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
