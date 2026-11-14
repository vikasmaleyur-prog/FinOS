'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  Sparkles,
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
    }, 600);
  };

  return (
    <main className="min-h-screen bg-finos-background px-4 py-6 text-finos-heading sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-card border border-finos-border bg-finos-card p-6 shadow-card sm:p-10">
            <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
              <Link href="/dashboard" className="flex min-h-11 items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-finos-purple font-bold text-white">F</span>
                <span className="text-xl font-bold text-finos-heading">FinOS</span>
              </Link>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-finos-purple-tint px-3 text-xs font-medium text-finos-purple">
                <ShieldCheck size={16} aria-hidden="true" />
                Privacy first
              </span>
            </header>

            <div className="mx-auto max-w-md">
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-finos-heading sm:text-3xl">
                  Welcome back
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-finos-body">
                  Sign in to see what’s coming in and plan your next steps with confidence.
                </p>
              </div>

              <div className="mb-6 space-y-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-finos-control-border bg-white px-4 text-sm font-medium text-finos-heading transition-colors hover:bg-finos-purple-tint focus-visible:outline"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4L1.9 7C.7 9.4 0 12.1 0 15s.7 5.6 1.9 8l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 6.5 10.1 6.5z" />
                  </svg>
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-finos-control-border bg-white px-4 text-sm font-medium text-finos-heading transition-colors hover:bg-finos-purple-tint focus-visible:outline"
                >
                  <svg className="h-5 w-5 fill-current text-finos-heading" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.85-.9.04-2 .6-2.65 1.35-.58.65-1.09 1.72-1.01 2.75.99.08 2.03-.5 2.65-1.25z" />
                  </svg>
                  Continue with Apple
                </button>
              </div>

              <div className="relative my-6 text-center">
                <div className="absolute inset-x-0 top-1/2 border-t border-finos-border" />
                <span className="relative bg-finos-card px-3 text-xs font-medium text-finos-muted">
                  Or use your email
                </span>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="work-email" className="mb-2 block text-sm font-medium text-finos-body">
                    Work email
                  </label>
                  <input
                    id="work-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="min-h-12 w-full rounded-xl border border-finos-control-border bg-white px-4 text-sm text-finos-heading placeholder:text-finos-muted focus:border-finos-purple focus:outline-none focus:ring-2 focus:ring-finos-purple"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="work-password" className="text-sm font-medium text-finos-body">
                      Password
                    </label>
                    <a href="#" className="text-sm font-medium text-finos-purple hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="work-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-h-12 w-full rounded-xl border border-finos-control-border bg-white px-4 pr-12 text-sm text-finos-heading focus:border-finos-purple focus:outline-none focus:ring-2 focus:ring-finos-purple"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-finos-muted transition-colors hover:bg-finos-purple-tint hover:text-finos-purple"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <label className="flex min-h-11 items-center gap-3 text-sm text-finos-body">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded accent-finos-purple focus-visible:outline"
                  />
                  <span>Remember this workstation</span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-finos-purple px-4 text-sm font-semibold text-white transition-colors hover:bg-finos-purple-hover focus-visible:outline disabled:cursor-wait disabled:bg-finos-purple-soft disabled:text-finos-muted"
                >
                  {isLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Sign in to FinOS</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-finos-purple-soft bg-finos-purple-tint p-4 text-xs text-finos-body">
                <span>Demo account is ready to use</span>
                <span className="font-semibold text-finos-purple">One-click sign in</span>
              </div>
            </div>

            <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-finos-border pt-5 text-xs text-finos-muted">
              <span className="inline-flex items-center gap-2">
                <Lock size={15} className="text-finos-success" />
                Your information is handled with care
              </span>
              <span>© 2026 FinOS</span>
            </footer>
          </section>

          <aside className="hidden flex-col justify-between rounded-card border border-finos-purple-soft bg-finos-purple-tint p-8 lg:flex lg:p-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-finos-purple-soft bg-white px-4 py-2 text-sm font-medium text-finos-purple">
              <span className="h-2.5 w-2.5 rounded-full bg-finos-success" />
              A clearer view of your cash flow
            </div>

            <div className="mx-auto my-8 w-full max-w-md space-y-4">
              <div className="rounded-card border border-finos-border bg-white p-6 shadow-card">
                <div className="flex items-center justify-between border-b border-finos-border pb-4">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-finos-heading">
                    <TrendingUp size={18} className="text-finos-purple" />
                    Cash flow forecast
                  </span>
                  <span className="rounded-full bg-finos-purple-tint px-3 py-1.5 text-xs font-semibold text-finos-purple">
                    60 days
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4 py-5">
                  <div>
                    <span className="block text-sm text-finos-muted">Your buffer</span>
                    <span className="mt-1 block text-2xl font-bold text-finos-heading">42 days</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm text-finos-muted">Chance of a shortfall</span>
                    <span className="mt-1 block text-lg font-bold text-finos-success-strong">Low</span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-finos-purple-soft">
                  <div className="h-full w-[70%] rounded-full bg-finos-purple" />
                </div>
              </div>

              <div className="rounded-card border border-finos-purple-soft bg-white p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-finos-heading">
                  <Sparkles size={18} className="text-finos-purple" />
                  Plan around your bills
                </div>
                <p className="mt-3 text-sm leading-relaxed text-finos-body">
                  See how rent and loan payments line up with expected client income, and explore ways to stay comfortably above your safe balance.
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-finos-body">
              FinOS helps you make your cash flow easier to understand, so you can plan ahead with less guesswork.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
