'use client';

import { useState } from 'react';
import { updateUser } from '../../actions';
import { Shield, User, UserCheck } from 'lucide-react';

export default function EditUserForm({ user }: { user: any }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append('id', user.id);
    
    const res = await updateUser(formData);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  const userModules = (user.modules || '').split(',').map((m: string) => m.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-rose-50/80 text-rose-700 p-3.5 rounded-xl mb-5 text-xs font-bold border border-rose-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
          <User size={14} className="text-blue-600" />
          <span>Full Name</span>
        </label>
        <input 
          type="text" 
          name="name" 
          defaultValue={user.name} 
          required 
          className="w-full text-sm border border-slate-200/80 rounded-xl px-4 py-2.5 bg-white/70 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium text-slate-900" 
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Shield size={14} className="text-blue-600" />
          <span>System Role *</span>
        </label>
        <select 
          name="role" 
          defaultValue={user.role} 
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
                defaultChecked={user.modules === '*' || userModules.includes(mod.id)}
                className="rounded text-blue-600 focus:ring-blue-500" 
              />
              <span>{mod.label}</span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-medium">
          Note: Super Administrators automatically receive access to all modules regardless of individual checkboxes.
        </p>
      </div>

      <div className="pt-3">
        <button 
          type="submit" 
          disabled={loading}
          className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-md shadow-blue-600/20 w-full flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <UserCheck size={16} />
          <span>{loading ? 'Saving Changes...' : 'Update User Access'}</span>
        </button>
      </div>
    </form>
  );
}
