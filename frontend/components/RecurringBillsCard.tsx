'use client';

import React from 'react';
import { Repeat } from 'lucide-react';

interface RecurringBill {
  merchant: string;
  cadence: string;
  average_amount: number;
  occurrences: number;
  last_paid_date: string;
  next_due_date: string;
  category: string;
  day_of_month: number;
}

interface RecurringBillsCardProps {
  bills?: RecurringBill[] | null;
  totalMonthly?: number;
}

export const RecurringBillsCard: React.FC<RecurringBillsCardProps> = ({ bills, totalMonthly = 0 }) => {
  const safeBills = bills || [];

  return (
    <section className="rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-finos-heading">
            <Repeat size={18} className="text-finos-purple" />
            <span>Detected Recurring Obligations</span>
          </h3>
          <p className="mt-1 text-sm text-finos-muted">
            Auto-detected recurring payments via amount variance & frequency
          </p>
        </div>
        <span className="tabular-nums rounded-full border border-finos-purple-soft bg-finos-purple-tint px-3 py-2 text-xs font-semibold text-finos-purple">
          ₹{Math.round(totalMonthly || 0).toLocaleString('en-IN')}/mo
        </span>
      </div>

      <div className="space-y-2.5">
        {safeBills.length === 0 ? (
          <div className="py-6 text-center text-sm text-finos-muted">
            No recurring payments detected yet.
          </div>
        ) : (
          safeBills.slice(0, 5)?.map((bill, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 rounded-2xl border border-finos-purple-soft bg-finos-purple-tint p-3 transition-colors hover:bg-finos-surface-hover"
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xs font-semibold text-finos-purple">
                  {bill?.day_of_month || 1}th
                </div>
                <div>
                  <div className="max-w-[180px] truncate text-sm font-medium text-finos-heading sm:max-w-[240px]">
                    {bill?.merchant || 'Recurring Outflow'}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-finos-muted">
                    <span>{bill?.cadence || 'Monthly'}</span>
                    <span>•</span>
                    <span>Due {bill?.next_due_date || 'Upcoming'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="tabular-nums text-sm font-bold text-finos-heading">
                  ₹{Math.round(bill?.average_amount || 0).toLocaleString('en-IN')}
                </div>
                <span className="mt-1 inline-block rounded-full bg-white px-2 py-1 text-xs text-finos-body">
                  {bill?.category || 'Subscription'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
