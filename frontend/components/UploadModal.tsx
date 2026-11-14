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
      setLocalError('Please select a CSV or PDF statement to upload.');
      return;
    }

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

      onUploadSuccess(data);
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to process statement. Please check file format.';
      setLocalError(msg);
      onError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-[#EAE6F0] rounded-[20px] shadow-[0_10px_40px_-5px_rgba(118,80,168,0.18)] p-6 sm:p-8 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE6F0]">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#F3EDFA] flex items-center justify-center text-[#7650A8]">
              <UploadCloud size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#17152D] tracking-tight">Import Bank Statement</h2>
              <p className="text-xs text-[#77758A]">HDFC, SBI, ICICI, PhonePe CSV/PDF exports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Local Error Notice */}
        {localError && (
          <div className="p-3.5 rounded-xl bg-[#FDF0F0] border border-[#F7B5B7] text-[#8B1E22] text-xs flex items-center space-x-2 font-medium">
            <AlertCircle size={16} className="text-[#E64B55] shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop File Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-[#EAE6F0] hover:border-[#7650A8] bg-[#F7F5FA] hover:bg-[#F3EDFA] rounded-2xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              accept=".csv,.txt,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
              <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center mx-auto text-[#7650A8] shadow-xs">
                {file ? <CheckCircle2 size={24} className="text-[#159B72]" /> : <FileText size={24} />}
              </div>
              <div className="text-xs font-semibold text-[#17152D]">
                {file ? file.name : 'Click to select CSV/PDF or drag and drop here'}
              </div>
              <p className="text-[11px] text-[#77758A]">
                Supports auto-detection of messy transaction headers and preamble rows.
              </p>
            </label>
          </div>

          {/* Account Persona Selector */}
          <div>
            <label className="text-xs font-bold text-[#17152D] block mb-1.5">
              Account Profile
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccountType('savings');
                  setMinSafeBalance('5000');
                }}
                className={`min-h-[44px] py-2.5 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  accountType === 'savings'
                    ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                    : 'bg-[#F7F5FA] text-[#77758A] border-[#EAE6F0] hover:bg-white'
                }`}
              >
                Personal / Freelance Savings
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountType('current');
                  setMinSafeBalance('25000');
                }}
                className={`min-h-[44px] py-2.5 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  accountType === 'current'
                    ? 'bg-[#7650A8] text-white border-[#7650A8] shadow-xs'
                    : 'bg-[#F7F5FA] text-[#77758A] border-[#EAE6F0] hover:bg-white'
                }`}
              >
                SMB Current Account
              </button>
            </div>
          </div>

          {/* Starting Balance & Safe Threshold Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#17152D] block mb-1.5">
                Current Balance (₹)
              </label>
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                placeholder="75000"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0] text-xs font-bold text-[#17152D] tabular-nums focus:outline-none focus:border-[#7650A8] focus:ring-2 focus:ring-[#F3EDFA]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#17152D] block mb-1.5">
                Min Safe Buffer (₹)
              </label>
              <input
                type="number"
                value={minSafeBalance}
                onChange={(e) => setMinSafeBalance(e.target.value)}
                placeholder="5000"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0] text-xs font-bold text-[#17152D] tabular-nums focus:outline-none focus:border-[#7650A8] focus:ring-2 focus:ring-[#F3EDFA]"
              />
            </div>
          </div>

          {/* DPDP Sanitization Guarantee */}
          <div className="p-3 rounded-xl bg-[#E8F8F2] border border-[#B4E8D2] flex items-center space-x-2 text-[11px] text-[#159B72] font-medium">
            <ShieldCheck size={16} className="text-[#159B72] shrink-0" />
            <span>DPDP Act 2023: Names, phone numbers, UPI IDs, and account numbers are sanitized in memory.</span>
          </div>

          {/* Submit Pill Button */}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full min-h-[44px] py-3 rounded-full bg-[#7650A8] hover:bg-[#633F94] active:bg-[#52327D] text-white text-xs font-bold tracking-tight transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#7650A8] focus:ring-offset-2"
          >
            {uploading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UploadCloud size={16} />
                <span>Process & Forecast Cash Flow</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
