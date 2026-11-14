'use client';

import React from 'react';
import { Calendar, Repeat, ArrowRight, Shield } from 'lucide-react';

interface RecurringBill {
  merchant: string;
  cadence: string;
  average_amount: number;
  occurrences: number;
  last_paid_date: string;
  next_due_date: string;
  category: string;
  day_of_month: number;
  confidence?: number;
  confidence_pct?: number;
}

interface RecurringBillsCardProps {
  bills?: RecurringBill[] | null;
  totalMonthly?: number;
}

export const RecurringBillsCard: React.FC<RecurringBillsCardProps> = ({ bills, totalMonthly = 0 }) => {
  const safeBills = bills || [];

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#121418] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight flex items-center space-x-2">
            <Repeat size={15} className="text-[#d9f154]" />
            <span>Detected Recurring Obligations</span>
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Auto-detected recurring payments via amount variance & frequency
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-white bg-white/[0.05] px-2.5 py-1 rounded-md border border-white/[0.08]">
          ₹{Math.round(totalMonthly || 0).toLocaleString('en-IN')}/mo
        </span>
      </div>

      <div className="space-y-2.5">
        {safeBills.length === 0 ? (
          <div className="py-6 text-center text-xs text-white/40">
            No recurring payments detected yet.
          </div>
        ) : (
          safeBills.slice(0, 5)?.map((bill, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-md bg-white/[0.05] flex items-center justify-center font-mono text-xs font-bold text-white/80">
                  {bill?.day_of_month || 1}th
                </div>
                <div>
                  <div className="text-xs font-medium text-white truncate max-w-[180px] sm:max-w-[240px]">
                    {bill?.merchant || 'Recurring Outflow'}
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-white/40 mt-0.5">
                    <span>{bill?.cadence || 'Monthly'}</span>
                    <span>•</span>
                    <span className="text-white/60">Due {bill?.next_due_date || 'Upcoming'}</span>
                    {bill?.confidence_pct && (
                      <>
                        <span>•</span>
                        <span className="text-[#d9f154]/90 bg-[#d9f154]/10 px-1 rounded">
                          {bill.confidence_pct}% conf
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-white">
                  ₹{Math.round(bill?.average_amount || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/60 inline-block mt-0.5">
                  {bill?.category || 'Subscription'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
