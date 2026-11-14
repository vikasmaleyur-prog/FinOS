'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Eye, 
  EyeOff,
  TrendingUp,
  Cpu
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
    // Instant smooth transition to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex flex-col lg:flex-row font-sans selection:bg-[#d9f154] selection:text-black">
      {/* ======================================================== */}
      {/* LEFT SIDE: CLEAN HIGH-CONVERTING AUTH FORM */}
      {/* ======================================================== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#d9f154] flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(217,241,84,0.4)]">
              F
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-lg tracking-tight text-white">FinOS</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.1]">
                ENTERPRISE
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-white/50 font-mono">
            <ShieldCheck size={14} className="text-[#d9f154]" />
            <span>DPDP Act 2023 Compliant</span>
          </div>
        </div>

        {/* Auth Box */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Sign in to your workspace
            </h1>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
              Predictive liquidity modeling and stochastic cash flow manager for irregular earners.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#d9f154]/10 border border-[#d9f154]/20 text-[#d9f154] text-[11px] font-mono mt-2">
              <Sparkles size={12} />
              <span>Interactive Demo — Click any sign-in option to launch dashboard</span>
            </div>
          </div>

          {/* SSO Buttons */}
          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-medium text-white transition-all shadow-sm"
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
              className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-medium text-white transition-all shadow-sm"
            >
              <svg className="h-4 w-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.85-.9.04-2 .6-2.65 1.35-.58.65-1.09 1.72-1.01 2.75.99.08 2.03-.5 2.65-1.25z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <span className="relative px-3 bg-[#0a0a0a] text-[10px] font-mono uppercase tracking-wider text-white/40">
              Or continue with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-mono text-white/60 block mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.1] rounded-xl text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#d9f154] focus:ring-1 focus:ring-[#d9f154] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono text-white/60">
                  Password
                </label>
                <a href="#" className="text-[11px] text-[#d9f154] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.1] rounded-xl text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#d9f154] focus:ring-1 focus:ring-[#d9f154] transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#d9f154] rounded h-3.5 w-3.5 cursor-pointer"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#d9f154] hover:bg-[#cbf037] text-black text-xs font-bold tracking-tight transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(217,241,84,0.3)] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to FinOS</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials hint */}
          <div className="mt-4 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Demo Mode: Pre-filled credentials active</span>
            <span className="text-[#d9f154]">One-Click Login</span>
          </div>
        </div>

        {/* Security Footer */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-white/40 gap-2">
          <div className="flex items-center space-x-2">
            <Lock size={12} className="text-emerald-400" />
            <span>256-bit AES Zero-Retention Sandbox</span>
          </div>
          <div>© 2026 FinOS Technologies Inc.</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT SIDE: PREMIUM FINTECH ABSTRACT GRAPHIC & QUOTE */}
      {/* ======================================================== */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0e1015] via-[#12141c] to-[#08090b] relative overflow-hidden flex-col justify-between p-12 border-l border-white/[0.08]">
        {/* Ambient Neon Glows */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#d9f154]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-white/60 bg-white/[0.04] backdrop-blur-md px-3 py-1.5 rounded-full border border-white/[0.08]">
            <span className="h-2 w-2 rounded-full bg-[#d9f154] animate-pulse" />
            <span>Stochastic Engine v2.4 Active</span>
          </div>

          <div className="text-xs font-mono text-white/40">
            Ramp.com Enterprise Architecture
          </div>
        </div>

        {/* Floating Center Visual Stack */}
        <div className="relative z-10 max-w-md mx-auto my-auto space-y-4 w-full">
          {/* Visual Card 1: 60-Day Runway Radar */}
          <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/[0.12] shadow-2xl space-y-3 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 flex items-center space-x-1.5">
                <TrendingUp size={13} className="text-[#d9f154]" />
                <span>60-Day Cash Flow Radar</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d9f154]/10 text-[#d9f154] border border-[#d9f154]/20 font-semibold">
                1,000 MONTE CARLO RUNS
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-white/50 block">Projected Runway</span>
                <span className="text-2xl font-bold font-mono text-white">42 Days Buffer</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-white/50 block">Breach Risk</span>
                <span className="text-sm font-bold font-mono text-emerald-400">0.0% Optimal</span>
              </div>
            </div>

            {/* Simulated mini sparkline bar */}
            <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden flex">
              <div className="h-full bg-[#d9f154]" style={{ width: '70%' }} />
              <div className="h-full bg-amber-400" style={{ width: '20%' }} />
              <div className="h-full bg-rose-400" style={{ width: '10%' }} />
            </div>
          </div>

          {/* Visual Card 2: Asymmetric Cash Timing Diagnostic */}
          <div className="p-5 rounded-2xl bg-[#14161f]/80 backdrop-blur-xl border border-white/[0.1] shadow-xl space-y-2 transform translate-x-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-white">
              <Sparkles size={14} className="text-[#d9f154]" />
              <span>Cash Timing Asymmetry Solved</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-sans">
              "Rent (1st) and Loan EMIs (5th) demand liquidity before variable client retainers arrive on the 12th. FinOS alerts you 28 days before friction occurs."
            </p>
          </div>
        </div>

        {/* Bottom Testimonial Quote */}
        <div className="relative z-10 p-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.08]">
          <p className="text-xs text-white/80 leading-relaxed italic mb-3">
            "FinOS completely eliminated the monthly anxiety of when my freelance retainers would clear against fixed EMIs and rent. The 60-day Monte Carlo radar is indispensable."
          </p>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-[#d9f154]/20 border border-[#d9f154]/40 flex items-center justify-center font-bold text-xs text-[#d9f154]">
              AM
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Arjun Mehta</div>
              <div className="text-[10px] text-white/50 font-mono">Principal AI Consultant • Autonomous Earner</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
