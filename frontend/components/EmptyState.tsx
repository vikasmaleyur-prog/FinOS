'use client';

import React from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  Smartphone, 
  UserCheck,
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
    <div className="rounded-2xl border border-white/[0.08] bg-[#121418] p-6 sm:p-10 text-center max-w-3xl mx-auto my-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#d9f154]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Icon & Title */}
        <div className="space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-[#d9f154] shadow-[0_0_25px_rgba(217,241,84,0.15)]">
            <FileSpreadsheet size={26} />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            No bank statement loaded
          </h2>
          <p className="text-xs sm:text-sm text-white/50 max-w-lg mx-auto leading-relaxed">
            Import your Indian bank statement (HDFC, SBI, ICICI, PhonePe CSV/PDF) or explore one of our realistic reference datasets for irregular earners and SMB shop owners.
          </p>
        </div>

        {/* Primary Upload CTA */}
        <div>
          <button
            onClick={onOpenUpload}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#d9f154] hover:bg-[#cbf037] text-black text-xs font-bold tracking-tight transition-all inline-flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(217,241,84,0.3)] cursor-pointer"
          >
            <UploadCloud size={16} />
            <span>Import Statement (CSV / PDF)</span>
          </button>
        </div>

        {/* 3 One-Click Sample Datasets */}
        <div className="pt-4 border-t border-white/[0.08]">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-3">
            Or load a reference dataset in 1-click
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {/* Dataset 1: Freelancer */}
            <button
              onClick={() => onLoadSample('freelancer')}
              disabled={isLoadingSample}
              className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#d9f154]/40 transition-all text-left group cursor-pointer disabled:opacity-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <UserCheck size={14} />
                  </span>
                  <span className="text-[10px] font-mono text-white/40">24 Months</span>
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-[#d9f154] transition-colors">
                  Freelancer / Gig
                </h3>
                <p className="text-[11px] text-white/50 mt-1 leading-snug">
                  Irregular milestone retainers (Upwork/Razorpay), Rent on 1st, Personal Loan EMI on 5th.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/[0.04] text-[10px] font-mono text-[#d9f154] flex items-center gap-1">
                <span>Load Dataset</span>
                <ArrowRight size={11} />
              </div>
            </button>

            {/* Dataset 2: PhonePe 90-Day */}
            <button
              onClick={() => onLoadSample('phonepe_90d')}
              disabled={isLoadingSample}
              className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#d9f154]/40 transition-all text-left group cursor-pointer disabled:opacity-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Smartphone size={14} />
                  </span>
                  <span className="text-[10px] font-mono text-white/40">90 Days</span>
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-[#d9f154] transition-colors">
                  PhonePe Export
                </h3>
                <p className="text-[11px] text-white/50 mt-1 leading-snug">
                  Real 3-line preamble, newest-first ordering, no running balance column, UPI reference strings.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/[0.04] text-[10px] font-mono text-[#d9f154] flex items-center gap-1">
                <span>Load Dataset</span>
                <ArrowRight size={11} />
              </div>
            </button>

            {/* Dataset 3: Shop Owner Current Account */}
            <button
              onClick={() => onLoadSample('shop_owner')}
              disabled={isLoadingSample}
              className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#d9f154]/40 transition-all text-left group cursor-pointer disabled:opacity-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Building2 size={14} />
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 font-bold">SMB Current A/C</span>
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-[#d9f154] transition-colors">
                  Shop Owner
                </h3>
                <p className="text-[11px] text-white/50 mt-1 leading-snug">
                  Daily sales receipts, wholesale suppliers, salaries on 1st, GST on 20th, delayed B2B invoice crunch.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/[0.04] text-[10px] font-mono text-[#d9f154] flex items-center gap-1">
                <span>Load Dataset</span>
                <ArrowRight size={11} />
              </div>
            </button>
          </div>
        </div>

        {/* Privacy badge */}
        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-center space-x-2 text-[11px] font-mono text-emerald-400">
          <ShieldCheck size={14} />
          <span>DPDP Act 2023 Compliant: 100% Stateless. PII masked in-memory. Zero server retention.</span>
        </div>
      </div>
    </div>
  );
};
