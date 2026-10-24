'use client';

import Link from 'next/link';
import { createUser } from '../actions';
import { useState } from 'react';
import { ArrowLeft, KeyRound, Lock, Shield, Sparkles, User, UserPlus } from 'lucide-react';

export default function NewUserPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const res = await createUser(formData);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Access Control</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New User</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create user login credentials and provision system module authorizations
          </p>
        </div>
        <Link 
          href="/users" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200/80 transition text-xs font-bold shadow-xs w-fit"
        >
          <ArrowLeft size={16} /> Back to Users
        </Link>
      </div>

      {/* Glass Card Form */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/70 shadow-sm">
        {error && (
          <div className="bg-rose-50/80 text-rose-700 p-3.5 rounded-xl mb-5 text-xs font-bold border border-rose-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-blue-600" />
              <span>Full Name *</span>
            </label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="e.g. John Doe"
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound size={14} className="text-blue-600" />
              <span>User ID (Login ID) *</span>
            </label>
            <input 
              type="text" 
              name="userId" 
              required 
              placeholder="e.g. john.doe"
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400 font-mono" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock size={14} className="text-blue-600" />
              <span>Password *</span>
            </label>
            <input 
              type="password" 
              name="password" 
              required 
              placeholder="••••••••"
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900 placeholder:text-slate-400" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Shield size={14} className="text-blue-600" />
              <span>System Role *</span>
            </label>
            <select 
              name="role" 
              required 
              className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900"
            >
              <option value="USER">User (Standard Access)</option>
              <option value="ADMIN">Admin (Manager Access)</option>
              <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
            </select>
          </div>
          
          <div className="pt-3 border-t border-slate-200/70">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Assign Module Access
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'WORKERS', label: 'Employees' },
                { id: 'CONFIRMATIONS', label: 'Confirmation' },
                { id: 'IDCARD', label: 'ID Card' },
                { id: 'COMPANIES', label: 'Companies' },
                { id: 'ATTENDANCE', label: 'Attendance' },
                { id: 'PAYROLL', label: 'Payroll' },
                { id: 'SETTLEMENTS', label: 'Settlements' },
                { id: 'TRAINING', label: 'Training' },
                { id: 'RECRUITMENT', label: 'Recruitment' },
                { id: 'TASKS', label: 'Tasks' },
              ].map(mod => (
                <label 
                  key={mod.id} 
                  className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-white/60 hover:bg-white border border-slate-200/70 cursor-pointer transition shadow-xs"
                >
                  <input 
                    type="checkbox" 
                    name="modules" 
                    value={mod.id} 
                    className="rounded text-blue-600 focus:ring-blue-500" 
                    defaultChecked 
                  />
                  <span>{mod.label}</span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Note: Super Administrators automatically receive access to all modules.
            </p>
          </div>

          <div className="pt-3">
            <button 
              type="submit" 
              disabled={loading}
              className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-md shadow-blue-600/20 w-full flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <UserPlus size={16} />
              <span>{loading ? 'Creating User Account...' : 'Create User Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
