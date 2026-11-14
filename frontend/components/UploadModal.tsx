'use client';

import React, { useState } from 'react';
import { UploadCloud, X, FileText, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  onUploadStart: () => void;
  onUploadSuccess: (data: any) => void;
  onError: (errorMsg: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  apiBase,
  onUploadStart,
  onUploadSuccess,
  onError
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [accountType, setAccountType] = useState<'savings' | 'current'>('savings');
  const [startingBalance, setStartingBalance] = useState<string>('75000');
  const [minSafeBalance, setMinSafeBalance] = useState<string>('5000');
  const [uploading, setUploading] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLocalError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setLocalError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setLocalError('Please select a CSV statement to upload.');
      return;
    }

    // CRITICAL: Reset previous state immediately when upload starts
    onUploadStart();
    setUploading(true);
    setLocalError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('account_type', accountType);
    if (startingBalance) {
      formData.append('starting_balance', startingBalance);
      formData.append('opening_balance', startingBalance);
    }
    if (minSafeBalance) {
      formData.append('minimum_safe_balance', minSafeBalance);
    }

    try {
      const res = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errDetail = data?.detail || 'Failed to process statement. Please ensure the CSV has valid transaction headers.';
        throw new Error(errDetail);
      }

      if (!data || !data.transactions || data.transactions.length === 0) {
        throw new Error('Statement contained no valid transaction records.');
      }

      // Success: pass full processed stateless payload to dashboard
      onUploadSuccess(data);
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to process statement. Please check CSV format.';
      setLocalError(msg);
      onError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0F1014] border border-white/[0.12] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center space-x-2 text-[#d9f154] mb-1">
            <UploadCloud size={18} />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">
              Stateless Ingestion
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Upload PhonePe or Bank Statement (CSV)
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Supports PhonePe UPI exports, HDFC, SBI, ICICI, Axis, Razorpay statements.
          </p>
        </div>

        {/* DPDP Act 2023 Shield Banner */}
        <div className="mb-5 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-start space-x-2.5">
          <ShieldCheck size={18} className="text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-xs text-white/80 leading-relaxed">
            <strong className="text-emerald-400 block font-medium mb-0.5">
              DPDP Act 2023 Compliant Ingestion
            </strong>
            Zero server retention. UPI IDs, phone numbers, and UTRs are sanitized on-the-fly.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-white/[0.12] hover:border-[#d9f154]/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white/[0.01]"
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,.txt,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileText size={28} className="mx-auto text-white/40 mb-2" />
            {file ? (
              <div className="text-xs font-mono text-white">
                Selected: <span className="text-[#d9f154] font-semibold">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </div>
            ) : (
              <>
                <div className="text-xs font-medium text-white">
                  Drop CSV or PDF statement here or <span className="text-[#d9f154]">browse files</span>
                </div>
                <div className="text-[10px] font-mono text-white/40 mt-1">
                  Supports PhonePe (CSV/PDF), HDFC, SBI, ICICI, Razorpay, and Current Accounts
                </div>
              </>
            )}
          </div>

          {/* Account Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-white/50 block">Account Classification</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccountType('savings');
                  setMinSafeBalance('5000');
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  accountType === 'savings'
                    ? 'bg-[#d9f154] text-black border-[#d9f154] font-bold'
                    : 'bg-white/[0.03] text-white/70 border-white/[0.08] hover:text-white'
                }`}
              >
                Savings / Freelancer
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountType('current');
                  setMinSafeBalance('25000');
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  accountType === 'current'
                    ? 'bg-[#d9f154] text-black border-[#d9f154] font-bold'
                    : 'bg-white/[0.03] text-white/70 border-white/[0.08] hover:text-white'
                }`}
              >
                Current / SMB Overdraft
              </button>
            </div>
          </div>

          {/* Inputs: Starting Balance & Minimum Safe Buffer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-white/50 block mb-1">
                Starting Balance (₹)
              </label>
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                placeholder="75000"
                className="w-full px-3 py-2 bg-black/40 border border-white/[0.1] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#d9f154]"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-white/50 block mb-1">
                {accountType === 'current' ? 'Overdraft / Safe Buffer (₹)' : 'Minimum Safe Buffer (₹)'}
              </label>
              <input
                type="number"
                value={minSafeBalance}
                onChange={(e) => setMinSafeBalance(e.target.value)}
                placeholder={accountType === 'current' ? '25000' : '5000'}
                className="w-full px-3 py-2 bg-black/40 border border-white/[0.1] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#d9f154]"
              />
            </div>
          </div>

          {localError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle size={15} className="shrink-0 text-rose-400" />
              <span>{localError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full py-2.5 rounded-lg bg-[#d9f154] hover:bg-[#cbf037] text-black text-xs font-bold tracking-tight transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center space-x-2 cursor-pointer shadow-[0_0_15px_rgba(217,241,84,0.25)]"
          >
            {uploading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Processing & Categorizing...</span>
              </div>
            ) : (
              <span>Sanitize & Load Dataset</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
