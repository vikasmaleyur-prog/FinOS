'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  Eye, 
  EyeOff,
  TrendingUp,
  CheckCircle2,
  Zap,
  HelpCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('arjun.mehta@consultant.io');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F5FA] text-[#17152D] flex flex-col lg:flex-row font-sans selection:bg-[#F3EDFA] selection:text-[#17152D]">
      {/* ======================================================== */}
      {/* LEFT SIDE: CLEAN FRIENDLY AUTH FORM */}
      {/* ======================================================== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-[#7650A8] flex items-center justify-center font-bold text-white text-base shadow-sm">
              F
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-[#17152D]">FinOS</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F3EDFA] text-[#7650A8] border border-[#EAE6F0]">
                  INDIA
                </span>
              </div>
              <p className="text-[11px] text-[#77758A]">Personal Financial Operating System</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-[#159B72] bg-[#E8F8F2] border border-[#B4E8D2] px-3 py-1 rounded-full font-medium">
            <ShieldCheck size={14} className="text-[#159B72]" />
            <span>DPDP Act 2023 Compliant</span>
          </div>
        </div>

        {/* Auth Box Card */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="bg-white border border-[#EAE6F0] rounded-[20px] p-6 sm:p-8 shadow-[0_4px_20px_-2px_rgba(118,80,168,0.06)]">
            <div className="space-y-2 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17152D]">
                Sign in to FinOS
              </h1>
              <p className="text-sm text-[#77758A] leading-relaxed">
                Smart predictive cash flow management and liquidity forecasting for individuals and businesses in India.
              </p>
              
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-[#F3EDFA] border border-[#EAE6F0] text-[#7650A8] text-xs font-medium mt-3">
                <Sparkles size={15} className="shrink-0 text-[#7650A8]" />
                <span>Interactive Demo: Pre-filled credentials active. One-click access.</span>
              </div>
            </div>

            {/* SSO Buttons */}
            <div className="space-y-2.5 mb-6">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full min-h-[44px] flex items-center justify-center space-x-3 py-2.5 px-4 rounded-full bg-white hover:bg-[#F7F5FA] active:bg-[#F3EDFA] border border-[#EAE6F0] text-xs font-semibold text-[#17152D] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7650A8] focus:ring-offset-2 cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4L1.9 7C.7 9.4 0 12.1 0 15s.7 5.6 1.9 8l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 6.5 10.1 6.5z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full min-h-[44px] flex items-center justify-center space-x-3 py-2.5 px-4 rounded-full bg-white hover:bg-[#F7F5FA] active:bg-[#F3EDFA] border border-[#EAE6F0] text-xs font-semibold text-[#17152D] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7650A8] focus:ring-offset-2 cursor-pointer"
              >
                <svg className="h-4 w-4 fill-current text-[#17152D]" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.85-.9.04-2 .6-2.65 1.35-.58.65-1.09 1.72-1.01 2.75.99.08 2.03-.5 2.65-1.25z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EAE6F0]" />
              </div>
              <span className="relative px-3 bg-white text-[11px] uppercase tracking-wider text-[#77758A] font-medium">
                Or sign in with email
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#17152D] block mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-[#EAE6F0] rounded-xl text-sm text-[#17152D] placeholder-[#77758A] focus:outline-none focus:border-[#7650A8] focus:ring-2 focus:ring-[#F3EDFA] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#17152D]">
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-[#7650A8] hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-[#EAE6F0] rounded-xl text-sm text-[#17152D] placeholder-[#77758A] focus:outline-none focus:border-[#7650A8] focus:ring-2 focus:ring-[#F3EDFA] transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#77758A] hover:text-[#17152D] transition-colors rounded-full cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-[#17152D] cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-[#7650A8] rounded h-4 w-4 cursor-pointer"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              {/* Primary Submit Pill Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] mt-2 py-3 px-6 rounded-full bg-[#7650A8] hover:bg-[#633F94] active:bg-[#52327D] text-white text-sm font-semibold tracking-tight transition-all flex items-center justify-center space-x-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7650A8] focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Workspace</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Security Footer */}
        <div className="pt-6 border-t border-[#EAE6F0] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#77758A] gap-2">
          <div className="flex items-center space-x-2">
            <Lock size={14} className="text-[#159B72]" />
            <span>256-bit Bank Grade Security • Zero Server Persistence</span>
          </div>
          <div>© 2026 FinOS India</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT SIDE: POLISHED FINTECH HIGHLIGHTS */}
      {/* ======================================================== */}
      <div className="hidden lg:flex w-1/2 bg-white relative overflow-hidden flex-col justify-between p-12 border-l border-[#EAE6F0]">
        {/* Subtle Decorative Background Bubbles */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#F3EDFA] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#F3EDFA]/60 rounded-full blur-2xl pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-[#17152D] font-medium bg-[#F3EDFA] px-3.5 py-1.5 rounded-full border border-[#EAE6F0]">
            <span className="h-2 w-2 rounded-full bg-[#159B72] animate-pulse" />
            <span>Monte Carlo Stochastic Engine v2.4</span>
          </div>

          <div className="text-xs text-[#77758A] font-medium">
            Designed for Individuals & SMBs
          </div>
        </div>

        {/* Floating Center Visual Stack */}
        <div className="relative z-10 max-w-md mx-auto my-auto space-y-4 w-full">
          {/* Card 1: 60-Day Cash Flow Radar */}
          <div className="p-6 rounded-[20px] bg-white border border-[#EAE6F0] shadow-[0_8px_30px_-4px_rgba(118,80,168,0.08)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#EAE6F0] pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#77758A] flex items-center space-x-2">
                <TrendingUp size={16} className="text-[#7650A8]" />
                <span>60-Day Cash Flow Forecast</span>
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#159B72] border border-[#B4E8D2]">
                1,000 PATHS
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-[#77758A] block font-medium">Zero-Breach Runway</span>
                <span className="text-2xl font-bold text-[#17152D] tabular-nums">42 Days Safe Buffer</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#77758A] block font-medium">Breach Probability</span>
                <span className="text-sm font-bold text-[#159B72] tabular-nums">0.0% (Safe)</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-2 w-full bg-[#F7F5FA] rounded-full overflow-hidden flex">
              <div className="h-full bg-[#7650A8]" style={{ width: '70%' }} />
              <div className="h-full bg-[#F5A623]" style={{ width: '20%' }} />
              <div className="h-full bg-[#E64B55]" style={{ width: '10%' }} />
            </div>
          </div>

          {/* Card 2: Cash Timing Asymmetry Solved */}
          <div className="p-6 rounded-[20px] bg-[#F3EDFA] border border-[#EAE6F0] shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-sm font-bold text-[#17152D]">
              <Sparkles size={16} className="text-[#7650A8]" />
              <span>Smart Indian Cash Timing Architecture</span>
            </div>
            <p className="text-xs text-[#17152D] leading-relaxed">
              Rent on the 1st and Loan EMIs on the 5th demand liquidity before variable client retainers or GST settlements arrive. FinOS warns you 28 days before friction happens.
            </p>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative z-10 p-5 rounded-[20px] bg-white border border-[#EAE6F0] shadow-sm">
          <p className="text-xs text-[#17152D] leading-relaxed italic mb-3">
            "FinOS removed all anxiety around when my freelance retainers would clear against fixed EMIs and rent. The 60-day Monte Carlo projections are essential."
          </p>
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-[#F3EDFA] border border-[#EAE6F0] flex items-center justify-center font-bold text-xs text-[#7650A8]">
              AM
            </div>
            <div>
              <div className="text-xs font-bold text-[#17152D]">Arjun Mehta</div>
              <div className="text-[11px] text-[#77758A]">Independent AI Consultant • Bengaluru, India</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
