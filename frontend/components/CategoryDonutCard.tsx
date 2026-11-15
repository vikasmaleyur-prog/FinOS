'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';

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

  // Clean cohesive colors matching Paynix
  const categoryPalette = [
    '#7650A8', // Software / Rent
    '#3B82F6', // Marketing / Food
    '#159B72', // Operations / Utilities
    '#F5A623', // Payroll / Shopping
    '#EC4899', // Subscriptions
    '#A78BFA', // Other
  ];

  const sortedCategories = [...safeCats]
    .sort((a, b) => (b?.amount || 0) - (a?.amount || 0))
    .slice(0, 5);

  const chartData = sortedCategories.map((c, i) => ({
    name: c.category || 'Other',
    value: c.amount || 0,
    color: categoryPalette[i % categoryPalette.length]
  }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="p-2.5 rounded-xl bg-white border border-[#ECE7F2] shadow-md text-xs space-y-1">
          <div className="font-bold text-[#17152D] flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-[#77758A]">
            <strong className="text-[#17152D] tabular-nums">₹{Math.round(data.value).toLocaleString('en-IN')}</strong> ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-[24px] border border-[#ECE7F2] bg-white p-6 shadow-[0_8px_30px_rgba(118,80,168,0.05)] w-full flex flex-col justify-between transition-all hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-[#17152D] tracking-tight">Expense Breakdown</h3>
            <p className="text-xs text-[#77758A] mt-0.5">Top expenditure streams</p>
          </div>
          <button 
            type="button"
            className="p-1 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors"
            title="Options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Content: Left Legend + Right Donut Chart */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 py-2">
          {/* Left: Category Legend (7 cols) */}
          <div className="sm:col-span-7 space-y-2.5">
            {chartData.length === 0 ? (
              <div className="text-xs text-[#77758A] py-6">No expense categories detected.</div>
            ) : (
              chartData.map((item, idx) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-[#17152D] truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[#77758A] shrink-0 font-medium tabular-nums">
                      {pct}%
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Real Donut Ring with Center Text (5 cols) */}
          <div className="sm:col-span-5 relative flex items-center justify-center h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.length > 0 ? chartData : [{ name: 'None', value: 1, color: '#ECE7F2' }]}
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text inside Donut Ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs sm:text-sm font-bold text-[#17152D] tabular-nums">
                ₹{Math.round(total).toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#77758A] font-semibold">
                Total Spend
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Pill Badge matching Paynix */}
      <div className="mt-4 pt-3 border-t border-[#ECE7F2] flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F3EDFA] text-[#7650A8] border border-[#ECE7F2]">
          <TrendingUp size={12} className="text-[#7650A8]" />
          <span>Increased by 12% this month</span>
        </span>

        <span className="text-[11px] font-medium text-[#77758A]">
          {sortedCategories.length} categories
        </span>
      </div>
    </div>
  );
};
