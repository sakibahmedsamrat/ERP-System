'use client';

import { useState } from 'react';
import { changePassword } from './actions';

export default function PasswordChangeForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    if (formData.get('newPassword') !== formData.get('confirmPassword')) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    const res = await changePassword(formData);
    
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess('Password changed successfully');
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-rose-50/80 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-sm font-medium backdrop-blur-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-sm font-medium backdrop-blur-sm">
          {success}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Current Password *
        </label>
        <input 
          type="password" 
          name="currentPassword" 
          required 
          className="w-full bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-sm placeholder:text-slate-400" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          New Password *
        </label>
        <input 
          type="password" 
          name="newPassword" 
          required 
          className="w-full bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-sm placeholder:text-slate-400" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Confirm New Password *
        </label>
        <input 
          type="password" 
          name="confirmPassword" 
          required 
          className="w-full bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-sm placeholder:text-slate-400" 
        />
      </div>

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={loading}
          className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-md shadow-blue-500/20 disabled:opacity-50 text-sm ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}
