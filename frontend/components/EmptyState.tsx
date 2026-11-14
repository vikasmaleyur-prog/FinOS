'use client';

import React from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Smartphone, 
  UserCheck,
  Building2,
  ArrowRight
} from 'lucide-react';

interface EmptyStateProps {
  onOpenUpload: () => void;
  onLoadSample: (datasetName?: string) => void;
  isLoadingSample?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenUpload,
  onLoadSample,
  isLoadingSample
}) => {
  return (
    <div className="rounded-[20px] border border-[#EAE6F0] bg-white p-8 sm:p-12 text-center max-w-3xl mx-auto my-8 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.05)] relative overflow-hidden">
      <div className="relative z-10 space-y-6">
        {/* Icon & Title */}
        <div className="space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-[#F3EDFA] flex items-center justify-center mx-auto text-[#7650A8] shadow-xs">
            <FileSpreadsheet size={30} />
          </div>

          <h2 className="text-2xl font-bold text-[#17152D] tracking-tight">
            No Bank Statement Loaded Yet
          </h2>
          <p className="text-sm text-[#77758A] max-w-lg mx-auto leading-relaxed font-medium">
            Upload your Indian bank statement (HDFC, SBI, ICICI, PhonePe CSV/PDF) or explore one of our realistic reference datasets for irregular earners and SMB shop owners.
          </p>
        </div>

        {/* Primary Upload CTA */}
        <div>
          <button
            onClick={onOpenUpload}
            className="w-full sm:w-auto min-h-[44px] px-8 py-3 rounded-full bg-[#7650A8] hover:bg-[#633F94] active:bg-[#52327D] text-white text-sm font-semibold tracking-tight transition-all inline-flex items-center justify-center space-x-2 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7650A8] focus:ring-offset-2"
          >
            <UploadCloud size={18} />
            <span>Import Statement (CSV / PDF)</span>
          </button>
        </div>

        {/* 3 One-Click Sample Datasets */}
        <div className="pt-6 border-t border-[#EAE6F0]">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#77758A] mb-4">
            Or explore an interactive reference profile in 1-click
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
            {/* Dataset 1: Freelancer */}
            <button
              onClick={() => onLoadSample('freelancer')}
              disabled={isLoadingSample}
              className="p-4 rounded-2xl bg-[#F7F5FA] hover:bg-[#F3EDFA] border border-[#EAE6F0] hover:border-[#7650A8]/30 transition-all text-left group cursor-pointer disabled:opacity-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="p-2 rounded-xl bg-[#E8F8F2] text-[#159B72]">
                    <UserCheck size={16} />
                  </span>
                  <span className="text-[11px] font-semibold text-[#77758A]">24 Months</span>
                </div>
                <h3 className="text-xs font-bold text-[#17152D] group-hover:text-[#7650A8] transition-colors">
                  Freelancer / Gig Earner
                </h3>
                <p className="text-xs text-[#77758A] mt-1 leading-snug">
                  Irregular milestone retainers, Rent on 1st, Personal Loan EMI on 5th.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#EAE6F0] text-xs font-bold text-[#7650A8] flex items-center gap-1">
                <span>Load Dataset</span>
                <ArrowRight size={13} />
              </div>
            </button>

            {/* Dataset 2: PhonePe 90-Day */}
            <button
              onClick={() => onLoadSample('phonepe_90d')}
              disabled={isLoadingSample}
              className="p-4 rounded-2xl bg-[#F7F5FA] hover:bg-[#F3EDFA] border border-[#EAE6F0] hover:border-[#7650A8]/30 transition-all text-left group cursor-pointer disabled:opacity-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="p-2 rounded-xl bg-[#FEF6E9] text-[#F5A623]">
                    <Smartphone size={16} />
                  </span>
                  <span className="text-[11px] font-semibold text-[#77758A]">90 Days UPI</span>
                </div>
                <h3 className="text-xs font-bold text-[#17152D] group-hover:text-[#7650A8] transition-colors">
                  PhonePe UPI Export
                </h3>
                <p className="text-xs text-[#77758A] mt-1 leading-snug">
                  90-day UPI export with transaction preambles and no running balance.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#EAE6F0] text-xs font-bold text-[#7650A8] flex items-center gap-1">
                <span>Load Dataset</span>
                <ArrowRight size={13} />
              </div>
            </button>

            {/* Dataset 3: SMB Retail Shop Owner */}
            <button
              onClick={() => onLoadSample('shop_owner')}
              disabled={isLoadingSample}
              className="p-4 rounded-2xl bg-[#F7F5FA] hover:bg-[#F3EDFA] border border-[#EAE6F0] hover:border-[#7650A8]/30 transition-all text-left group cursor-pointer disabled:opacity-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="p-2 rounded-xl bg-[#F3EDFA] text-[#7650A8]">
                    <Building2 size={16} />
                  </span>
                  <span className="text-[11px] font-semibold text-[#77758A]">SMB Current</span>
                </div>
                <h3 className="text-xs font-bold text-[#17152D] group-hover:text-[#7650A8] transition-colors">
                  Shop Owner Current Account
                </h3>
                <p className="text-xs text-[#77758A] mt-1 leading-snug">
                  Daily UPI sales, wholesale suppliers, staff salaries, GST, and 14-day credit delays.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-[#EAE6F0] text-xs font-bold text-[#7650A8] flex items-center gap-1">
                <span>Load Dataset</span>
                <ArrowRight size={13} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
