'use client';

import React from 'react';
import { UploadCloud, FileSpreadsheet, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  onOpenUpload: () => void;
  onLoadSample: () => void;
  isLoadingSample?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenUpload,
  onLoadSample,
  isLoadingSample
}) => {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#121418] p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-[#d9f154]/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Icon */}
        <div className="h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-[#d9f154] shadow-[0_0_25px_rgba(217,241,84,0.15)]">
          <FileSpreadsheet size={30} />
        </div>

        {/* Headline */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            No bank statement loaded
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1.5 max-w-md mx-auto leading-relaxed">
            Upload your Indian bank or UPI CSV statement (HDFC, SBI, ICICI, PhonePe) to forecast cash flow, detect recurring bills, and stress-test liquidity.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenUpload}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#d9f154] hover:bg-[#cbf037] text-black text-xs font-bold tracking-tight transition-all flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(217,241,84,0.3)] cursor-pointer"
          >
            <UploadCloud size={15} />
            <span>Import Bank Statement (CSV)</span>
          </button>

          <button
            onClick={onLoadSample}
            disabled={isLoadingSample}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-white text-xs font-semibold tracking-tight transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={14} className="text-[#d9f154]" />
            <span>{isLoadingSample ? 'Generating 24-Mo Data...' : 'Load 2-Year Freelancer Dataset'}</span>
          </button>
        </div>

        {/* Privacy badge */}
        <div className="pt-6 border-t border-white/[0.06] flex items-center justify-center space-x-2 text-[11px] font-mono text-emerald-400">
          <ShieldCheck size={14} />
          <span>DPDP Act 2023 Compliant: Zero persistence. PII is sanitized in-memory.</span>
        </div>
      </div>
    </div>
  );
};
