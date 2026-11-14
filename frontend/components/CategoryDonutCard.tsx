'use client';

import React from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';

interface CategorySpending {
  category: string;
  amount: number;
}

interface CategoryDonutCardProps {
  categories?: CategorySpending[] | null;
}

export const CategoryDonutCard: React.FC<CategoryDonutCardProps> = ({ categories }) => {
  const safeCats = categories && Array.isArray(categories) ? categories : [];
  const total = safeCats.reduce((sum, c) => sum + (c?.amount || 0), 0);

  const categoryColors: Record<string, string> = {
    Income: '#d9f154',
    Investments: '#10B981',
    Rent: '#A855F7',
    'EMI/Loans': '#F59E0B',
    EMI: '#F59E0B',
    Food: '#3B82F6',
    Travel: '#14B8A6',
    'Bills & Utilities': '#F97316',
    Shopping: '#6366F1',
    Subscriptions: '#06B6D4',
    Health: '#EC4899',
    'Other/Transfer': '#64748B',
    Other: '#64748B'
  };

  const sortedCategories = [...safeCats].sort((a, b) => (b?.amount || 0) - (a?.amount || 0));

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight flex items-center space-x-2">
            <PieChartIcon size={15} className="text-[#d9f154]" />
            <span>Outflow Breakdown by Category</span>
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            NLP categorized expenses across operating history
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-white/70">
          ₹{Math.round(total).toLocaleString('en-IN')} total
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        {sortedCategories.length === 0 ? (
          <div className="py-6 text-center text-xs text-white/40 font-mono">
            No category spend recorded yet.
          </div>
        ) : (
          sortedCategories.slice(0, 6)?.map((cat, idx) => {
            const amt = cat?.amount || 0;
            const pct = total > 0 ? (amt / total) * 100 : 0;
            const color = categoryColors[cat?.category] || '#94A3B8';
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/80 flex items-center space-x-2">
                    <span
                      className="h-2 w-2 rounded-full inline-block"
                      style={{ backgroundColor: color }}
                    />
                    <span>{cat?.category || 'Other'}</span>
                  </span>
                  <span className="text-white/50">
                    <strong className="text-white">₹{Math.round(amt).toLocaleString('en-IN')}</strong> ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
