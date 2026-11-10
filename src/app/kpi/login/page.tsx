'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, User, ArrowRight, Loader2, Target, Eye, EyeOff, ShieldCheck, ArrowLeft, Award } from 'lucide-react';
import { kpiLoginAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Verifying Credentials...</span>
        </>
      ) : (
        <>
          <span>Sign In to KPI Portal</span>
          <ArrowRight size={18} />
        </>
      )}
    </button>
  );
}

export default function KpiLoginPage() {
  const [state, formAction] = useFormState(kpiLoginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-amber-600/25 blur-[120px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[34rem] h-[34rem] rounded-full bg-orange-600/20 blur-[130px] animate-pulse"
          style={{ animationDuration: '10s' }}
        />
        <div
          className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] rounded-full bg-yellow-600/15 blur-[110px]"
        />
      </div>

      {/* Glassmorphic Login Card */}
      <div className="max-w-md w-full bg-white/85 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/50 border border-white/60 overflow-hidden relative z-10 transition-all">
        {/* Top Header Card Section */}
        <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8 text-center flex flex-col items-center relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-orange-500/15 pointer-events-none" />

          <div className="w-20 h-20 p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl mb-3.5 flex items-center justify-center relative group">
            <Image
              src="/logo-hr.png"
              alt="MEP HR Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>

          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Target size={14} />
            <span>MEP KPI Performance Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5">
            Key Performance Indicators
          </h1>
          <p className="text-slate-400 text-xs max-w-xs">
            Workers &amp; Supervisors Login with your ID Number as Default Username and Password
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5 bg-white/50 backdrop-blur-md">
          {/* Helpful First-time Info Box */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Initial Access Notice:</span> Your default Username and Password is your{' '}
              <span className="font-extrabold underline">Employee ID Number</span> (e.g. 4917).
            </div>
          </div>

          {state?.error && (
            <div className="bg-red-500/10 backdrop-blur-md text-red-700 p-3.5 rounded-xl text-xs font-semibold border border-red-200/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Employee ID Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={17} />
                </div>
                <input
                  type="text"
                  name="workerId"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 outline-none transition text-slate-900 placeholder:text-slate-400 text-sm shadow-xs font-medium"
                  placeholder="e.g. 4917, 1001"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Default: Your ID Number</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={17} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 outline-none transition text-slate-900 placeholder:text-slate-400 text-sm shadow-xs font-medium"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

          {/* Return to Main ERP Portal */}
          <div className="pt-2 border-t border-slate-200/70 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Enterprise ERP Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer attribution */}
      <div className="absolute bottom-4 right-6 text-right text-xs text-slate-400 select-none print:hidden leading-relaxed z-10">
        <div>MEP Group Human Resources Division</div>
        <div>KPI Performance Management System 2026.</div>
      </div>
    </div>
  );
}
