'use client';

import Link from 'next/link';
import { createUser } from '../actions';
import { useState } from 'react';

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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Add New User</h1>
        <Link href="/users" className="text-blue-600 hover:underline">
          &larr; Back to Users
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" name="name" required className="w-full border rounded p-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID (Login ID) *</label>
            <input type="text" name="userId" required className="w-full border rounded p-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input type="password" name="password" required className="w-full border rounded p-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select name="role" required className="w-full border rounded p-2 outline-none focus:border-blue-500 bg-white">
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
                  <input type="checkbox" name="modules" value={mod.id} className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                  {mod.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Super Admins automatically have access to all modules.</p>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
