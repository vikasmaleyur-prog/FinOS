'use client';

import React from 'react';
import { UploadCloud, FileSpreadsheet, ShieldCheck, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onOpenUpload: () => void;
  onLoadSample: () => void;
  isLoadingSample?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenUpload,
  onLoadSample,
  isLoadingSample
}) => (
  <section className="mx-auto my-8 max-w-2xl rounded-card border border-finos-border bg-finos-card p-6 text-center shadow-card sm:my-12 sm:p-10">
    <div className="space-y-5">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-finos-purple-soft bg-finos-purple-tint text-finos-purple">
        <FileSpreadsheet size={30} aria-hidden="true" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-finos-heading sm:text-2xl">
          No statement loaded yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-finos-body">
          Add a bank or UPI statement to see your upcoming cash flow, recurring bills and spending.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 pt-1 sm:flex-row">
        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-finos-purple px-5 text-sm font-semibold text-white transition-colors hover:bg-finos-purple-hover focus-visible:outline sm:w-auto"
        >
          <UploadCloud size={17} aria-hidden="true" />
          <span>Import bank statement</span>
        </button>

        <button
          type="button"
          onClick={onLoadSample}
          disabled={isLoadingSample}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-finos-purple bg-white px-5 text-sm font-semibold text-finos-purple transition-colors hover:bg-finos-purple-tint focus-visible:outline disabled:cursor-wait disabled:bg-finos-purple-tint sm:w-auto"
        >
          <Sparkles size={16} aria-hidden="true" />
          <span>{isLoadingSample ? 'Loading sample data…' : 'Load sample data'}</span>
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-finos-border pt-5 text-xs text-finos-body">
        <ShieldCheck size={16} className="text-finos-success-strong" aria-hidden="true" />
        <span>Your data is processed without server-side storage.</span>
      </div>
    </div>
  </section>
);
