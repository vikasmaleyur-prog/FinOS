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
    Income: 'var(--category-income)',
    Investments: 'var(--success)',
    Rent: 'var(--category-rent)',
    'EMI/Loans': 'var(--category-emi)',
    EMI: 'var(--category-emi)',
    Food: 'var(--category-food)',
    Travel: 'var(--category-travel)',
    'Bills & Utilities': 'var(--warning-dark)',
    Shopping: 'var(--primary)',
    Subscriptions: 'var(--category-travel)',
    Health: 'var(--category-health)',
    'Other/Transfer': 'var(--category-other)',
    Other: 'var(--category-other)'
  };

  const sortedCategories = [...safeCats].sort((a, b) => (b?.amount || 0) - (a?.amount || 0));

  return (
    <section className="rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-finos-heading">
            <PieChartIcon size={18} className="text-finos-purple" />
            <span>Outflow Breakdown by Category</span>
          </h3>
          <p className="mt-1 text-sm text-finos-muted">
            NLP categorized expenses across operating history
          </p>
        </div>
        <span className="tabular-nums text-sm font-semibold text-finos-body">
          ₹{Math.round(total).toLocaleString('en-IN')} total
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        {sortedCategories.length === 0 ? (
          <div className="py-6 text-center text-sm text-finos-muted">
            No category spend recorded yet.
          </div>
        ) : (
          sortedCategories.slice(0, 6)?.map((cat, idx) => {
            const amt = cat?.amount || 0;
            const pct = total > 0 ? (amt / total) * 100 : 0;
            const color = categoryColors[cat?.category] || '#94A3B8';
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm text-finos-body">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>{cat?.category || 'Other'}</span>
                  </span>
                  <span className="tabular-nums text-finos-muted">
                    <strong className="font-semibold text-finos-heading">₹{Math.round(amt).toLocaleString('en-IN')}</strong> ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-finos-purple-tint">
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
    </section>
  );
};
