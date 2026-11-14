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
    Income: '#159B72',
    Investments: '#10B981',
    Rent: '#7650A8',
    'EMI/Loans': '#F5A623',
    EMI: '#F5A623',
    Food: '#3B82F6',
    Travel: '#06B6D4',
    'Bills & Utilities': '#F97316',
    Shopping: '#8B5CF6',
    Subscriptions: '#EC4899',
    Health: '#E64B55',
    'Other/Transfer': '#77758A',
    Other: '#77758A'
  };

  const sortedCategories = [...safeCats].sort((a, b) => (b?.amount || 0) - (a?.amount || 0));

  return (
    <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] w-full min-w-0">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-[#17152D] tracking-tight flex items-center space-x-2">
            <PieChartIcon size={18} className="text-[#7650A8]" />
            <span>Outflows by Category</span>
          </h3>
          <p className="text-xs text-[#77758A] mt-0.5">
            Auto-categorized operational and living expenditures
          </p>
        </div>
        <span className="text-xs font-bold text-[#17152D] bg-[#F7F5FA] px-3 py-1.5 rounded-full border border-[#EAE6F0] tabular-nums">
          ₹{Math.round(total).toLocaleString('en-IN')} total
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3.5">
        {sortedCategories.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#77758A]">
            No category spend recorded yet.
          </div>
        ) : (
          sortedCategories.slice(0, 6).map((cat, idx) => {
            const amt = cat?.amount || 0;
            const pct = total > 0 ? (amt / total) * 100 : 0;
            const color = categoryColors[cat?.category] || '#7650A8';
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#17152D] font-semibold flex items-center space-x-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block"
                      style={{ backgroundColor: color }}
                    />
                    <span>{cat?.category || 'Other'}</span>
                  </span>
                  <span className="text-[#77758A]">
                    <strong className="text-[#17152D] tabular-nums">₹{Math.round(amt).toLocaleString('en-IN')}</strong> ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F7F5FA] rounded-full overflow-hidden">
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
