'use client';

import React from 'react';
import { MoreHorizontal, Wifi, Shield, Calendar, ArrowUpRight } from 'lucide-react';

interface YourCardsWidgetProps {
  currentBalance: number;
  minSafeBalance: number;
  daysOfRunway: number;
  accountType?: 'savings' | 'current';
  accountHolder?: string;
  accountNumber?: string;
}

export const YourCardsWidget: React.FC<YourCardsWidgetProps> = ({
  currentBalance,
  minSafeBalance,
  daysOfRunway,
  accountType = 'savings',
  accountHolder = 'FINOS MEMBER',
  accountNumber = '•••• 8589'
}) => {
  return (
    <div className="rounded-[24px] border border-[#ECE7F2] bg-white p-6 shadow-[0_8px_30px_rgba(118,80,168,0.05)] w-full flex flex-col justify-between transition-all hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)]">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-[#17152D] tracking-tight">Your Cards</h3>
          <button 
            type="button"
            className="p-1 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors"
            title="Card Options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
        <p className="text-xs text-[#77758A] mb-4">
          Card Currency: <span className="font-semibold text-[#17152D]">INR / ₹</span> · Available: <span className="font-semibold text-[#7650A8] tabular-nums">₹{Math.round(currentBalance).toLocaleString('en-IN')}</span>
        </p>

        {/* The Card Graphic (Paynix Purple Wave Style) */}
        <div className="relative w-full aspect-[1.62/1] rounded-[22px] overflow-hidden p-5 sm:p-6 text-white shadow-[0_16px_36px_-6px_rgba(102,51,153,0.35)] select-none transition-transform hover:scale-[1.01] duration-300">
          {/* Multi-layered Purple Wave Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#4D2482] via-[#6B37B2] to-[#925CE5]" />
          
          {/* Abstract Wave Shapes Overlay */}
          <svg
            className="absolute inset-0 w-full h-full opacity-30 mix-blend-screen pointer-events-none"
            viewBox="0 0 360 220"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M-40 180 C 60 120, 140 220, 240 140 C 320 80, 360 160, 420 110 L 420 240 L -40 240 Z"
              fill="url(#waveGrad1)"
            />
            <path
              d="M-20 80 C 80 180, 180 40, 280 120 C 340 170, 390 100, 420 120 L 420 240 L -20 240 Z"
              fill="url(#waveGrad2)"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="waveGrad1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#925CE5" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="waveGrad2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B388FF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4D2482" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Radial Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/15 rounded-full blur-2xl pointer-events-none" />

          {/* Content inside the Card */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Top Row: Chip, Contactless, Card Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Golden EMV Chip */}
                <div className="w-10 h-8 rounded-md bg-gradient-to-br from-[#FFE082] via-[#FFD54F] to-[#FFA000] p-1 shadow-xs border border-[#FFF8E1]/40 flex flex-col justify-between">
                  <div className="h-0.5 w-full bg-[#E08A00]/40 rounded-full" />
                  <div className="flex justify-between h-2.5">
                    <div className="w-2.5 h-full border-r border-[#E08A00]/40" />
                    <div className="w-2.5 h-full border-l border-[#E08A00]/40" />
                  </div>
                  <div className="h-0.5 w-full bg-[#E08A00]/40 rounded-full" />
                </div>
                {/* Contactless Wi-Fi Waves */}
                <Wifi size={18} className="text-white/80 rotate-90" />
              </div>

              {/* Logo: VISA or RuPay */}
              <div className="text-right">
                <span className="text-lg font-black tracking-wider italic text-white drop-shadow-sm">
                  VISA
                </span>
                <span className="block text-[8px] font-semibold text-white/70 tracking-widest uppercase -mt-1">
                  {accountType === 'current' ? 'Business Platinum' : 'Platinum Debit'}
                </span>
              </div>
            </div>

            {/* Middle Row: Card Number */}
            <div className="py-2">
              <div className="text-base sm:text-lg font-mono tracking-[0.22em] text-white/95 font-semibold drop-shadow-sm">
                •••• •••• •••• {accountNumber.replace(/[^0-9]/g, '').slice(-4) || '8589'}
              </div>
            </div>

            {/* Bottom Row: Card Holder & Expiry */}
            <div className="flex items-end justify-between pt-1 text-[11px] font-medium tracking-wide">
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-white/60 font-bold">
                  Card Holder
                </span>
                <span className="font-semibold text-white uppercase tracking-wider text-xs">
                  {accountHolder}
                </span>
              </div>

              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-wider text-white/60 font-bold">
                  Expires
                </span>
                <span className="font-semibold text-white tracking-wider text-xs font-mono">
                  12/28
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Mini Metrics */}
      <div className="mt-5 grid grid-cols-2 gap-2 pt-4 border-t border-[#ECE7F2]">
        <div className="p-2.5 rounded-xl bg-[#F7F5FA] border border-[#ECE7F2]/60">
          <span className="block text-[10px] uppercase font-bold text-[#77758A] tracking-wider">
            Safe Buffer
          </span>
          <span className="text-sm font-bold text-[#17152D] tabular-nums">
            ₹{minSafeBalance.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#F7F5FA] border border-[#ECE7F2]/60">
          <span className="block text-[10px] uppercase font-bold text-[#77758A] tracking-wider">
            Zero-Inflow Runway
          </span>
          <span className="text-sm font-bold text-[#159B72] tabular-nums">
            {daysOfRunway} days
          </span>
        </div>
      </div>
    </div>
  );
};
