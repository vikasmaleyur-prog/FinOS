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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-finos-overlay p-4">
      <div className="relative my-auto w-full max-w-lg rounded-card border border-finos-border bg-finos-card p-6 shadow-card">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close upload dialog"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-finos-muted transition-colors hover:bg-finos-purple-tint hover:text-finos-heading"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-5 pr-10">
          <div className="mb-2 flex items-center gap-2 text-finos-purple">
            <UploadCloud size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.06em]">
              Secure import
            </span>
          </div>
          <h3 className="text-xl font-bold text-finos-heading">
            Upload a bank statement
          </h3>
          <p className="mt-2 text-sm text-finos-body">
            Supports UPI exports and HDFC, SBI, ICICI, Axis and Razorpay statements.
          </p>
        </div>

        {/* DPDP Act 2023 Shield Banner */}
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-finos-success-border bg-finos-success-tint p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-finos-success-strong" />
          <div className="text-sm leading-relaxed text-finos-body">
            <strong className="mb-1 block font-semibold text-finos-heading">
              Your statement stays private
            </strong>
            Identifying details are masked during processing and are not stored on the server.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-finos-purple-soft bg-finos-purple-tint p-6 text-center transition-colors hover:border-finos-purple focus-within:ring-2 focus-within:ring-finos-purple"
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileText size={28} className="mx-auto mb-2 text-finos-purple" />
            {file ? (
              <div className="text-sm text-finos-heading">
                Selected: <span className="font-semibold text-finos-purple">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </div>
            ) : (
              <>
                <div className="text-sm font-medium text-finos-heading">
                  Drop a CSV statement here or <span className="text-finos-purple">browse files</span>
                </div>
                <div className="mt-2 text-xs text-finos-muted">
                  Supports bank statement preambles and common CSV exports
                </div>
              </>
            )}
          </div>

          {/* Inputs: Starting Balance & Minimum Safe Buffer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-finos-body">
                Starting Balance (₹)
              </label>
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                placeholder="75000"
                className="min-h-12 w-full rounded-xl border border-finos-control-border bg-white px-3 text-sm text-finos-heading focus:border-finos-purple focus:outline-none focus:ring-2 focus:ring-finos-purple"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-finos-body">
                Minimum Buffer (₹)
              </label>
              <input
                type="number"
                value={minSafeBalance}
                onChange={(e) => setMinSafeBalance(e.target.value)}
                placeholder="5000"
                className="min-h-12 w-full rounded-xl border border-finos-control-border bg-white px-3 text-sm text-finos-heading focus:border-finos-purple focus:outline-none focus:ring-2 focus:ring-finos-purple"
              />
            </div>
          </div>

          {localError && (
            <div className="flex items-center gap-2 rounded-xl border border-finos-critical-border bg-finos-critical-tint p-3 text-sm text-finos-critical-dark">
              <AlertCircle size={16} className="shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file}
            className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-finos-purple px-4 text-sm font-semibold text-white transition-colors hover:bg-finos-purple-hover focus-visible:outline disabled:cursor-not-allowed disabled:bg-finos-purple-soft disabled:text-finos-muted"
          >
            {uploading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
