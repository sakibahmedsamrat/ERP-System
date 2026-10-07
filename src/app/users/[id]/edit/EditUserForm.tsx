'use client';

import { useState } from 'react';
import { updateUser } from '../../actions';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input type="text" name="name" defaultValue={user.name} required className="w-full border rounded p-2 outline-none focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
        <select name="role" defaultValue={user.role} required className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-white">
          <option value="USER">User (Standard Access)</option>
          <option value="ADMIN">Admin (Manager Access)</option>
          <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
        </select>
      </div>
      
      <div className="pt-2 border-t mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">Assign Modules</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'WORKERS', label: 'Employees' },
            { id: 'COMPANIES', label: 'Companies' },
            { id: 'ATTENDANCE', label: 'Attendance' },
            { id: 'SETTLEMENTS', label: 'Settlements' },
            { id: 'TRAINING', label: 'Training' },
            { id: 'RECRUITMENT', label: 'Recruitment' },
            { id: 'TASKS', label: 'Tasks' },
          ].map(mod => (
            <label key={mod.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                name="modules" 
                value={mod.id} 
                defaultChecked={user.modules === '*' || userModules.includes(mod.id)}
                className="rounded text-blue-600 focus:ring-blue-500" 
              />
              {mod.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Super Admins automatically have access to all modules regardless of checkboxes.</p>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={loading}
          className={`bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full md:w-auto ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Saving...' : 'Update User Access'}
        </button>
      </div>
    </form>
  );
}
