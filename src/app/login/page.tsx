'use client'

import { useFormState, useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { loginAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide"
    >
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Authenticating...</span>
        </>
      ) : (
        <>
          <span>Sign In to System</span>
          <ArrowRight size={18} />
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, null);
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'HR Module';

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-900 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Dynamic ambient gradient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-blue-600/30 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 -right-40 w-[32rem] h-[32rem] rounded-full bg-indigo-600/25 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[38rem] h-[38rem] rounded-full bg-purple-600/25 blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute top-2/3 left-10 w-80 h-80 rounded-full bg-teal-500/15 blur-[90px]" />
      </div>

      {/* Frosted Glass Login Card */}
      <div className="max-w-md w-full bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/40 border border-white/60 overflow-hidden relative z-10 transition-all">
        {/* Top Header Card Section */}
        <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8 text-center flex flex-col items-center relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-indigo-600/15 pointer-events-none" />
          
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

          <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Enterprise ERP Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">{appName}</h1>
          <p className="text-slate-400 text-xs">Sign in with your credentials to access the workspace</p>
        </div>
        
        {/* Form Body */}
        <div className="p-8 space-y-5 bg-white/40 backdrop-blur-md">
          {state?.error && (
            <div className="bg-red-500/10 backdrop-blur-md text-red-700 p-3.5 rounded-xl text-xs font-semibold border border-red-200/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">User ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={17} />
                </div>
                <input 
                  type="text" 
                  name="userId"
                  required 
                  className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none transition text-slate-900 placeholder:text-slate-400 text-sm shadow-xs"
                  placeholder="Enter your User ID"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={17} />
                </div>
                <input 
                  type="password" 
                  name="password"
                  required 
                  className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none transition text-slate-900 placeholder:text-slate-400 text-sm shadow-xs"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>

      {/* Footer attribution */}
      <div className="absolute bottom-4 right-6 text-right text-xs text-slate-400 select-none print:hidden leading-relaxed z-10">
        <div>Created by <span className="text-slate-300 font-semibold">Sakib Ahmed Samrat</span> (Executive-HR)</div>
        <div>Copyright by HR Team (MEP Group) 2026.</div>
      </div>
    </div>
  );
}
