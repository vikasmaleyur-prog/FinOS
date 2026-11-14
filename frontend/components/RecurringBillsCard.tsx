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
    <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.04)] w-full min-w-0">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-[#17152D] tracking-tight flex items-center space-x-2">
            <Repeat size={18} className="text-[#7650A8]" />
            <span>Recurring Obligations</span>
          </h3>
          <p className="text-xs text-[#77758A] mt-0.5">
            Auto-detected recurring EMIs, rent, utilities, and subscriptions
          </p>
        </div>
        <span className="text-xs font-bold text-[#7650A8] bg-[#F3EDFA] px-3 py-1.5 rounded-full border border-[#EAE6F0] tabular-nums">
          ₹{Math.round(totalMonthly || 0).toLocaleString('en-IN')}/mo
        </span>
      </div>

      <div className="space-y-3">
        {safeBills.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#77758A]">
            No recurring payments detected yet.
          </div>
        ) : (
          safeBills.slice(0, 5).map((bill, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#F7F5FA] hover:bg-[#F3EDFA] border border-[#EAE6F0] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="h-10 w-10 rounded-xl bg-white border border-[#EAE6F0] flex items-center justify-center text-xs font-bold text-[#7650A8] shadow-xs tabular-nums">
                  {bill?.day_of_month || 1}th
                </div>
                <div>
                  <div className="text-xs font-bold text-[#17152D] truncate max-w-[180px] sm:max-w-[240px]">
                    {bill?.merchant || 'Recurring Outflow'}
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-[#77758A] mt-0.5">
                    <span>{bill?.cadence || 'Monthly'}</span>
                    <span>•</span>
                    <span>Due {bill?.next_due_date || 'Upcoming'}</span>
                    {bill?.confidence_pct ? (
                      <>
                        <span>•</span>
                        <span className="text-[#0E684C] bg-[#E8F8F2] px-1.5 py-0.2 rounded font-semibold border border-[#B4E8D6]">
                          {bill.confidence_pct}% conf
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-[#17152D] tabular-nums">
                  ₹{Math.round(bill?.average_amount || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#EAE6F0] text-[#77758A] inline-block mt-0.5">
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
