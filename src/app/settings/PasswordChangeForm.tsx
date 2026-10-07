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
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded text-sm">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
        <input type="password" name="currentPassword" required className="w-full border rounded p-2 outline-none focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
        <input type="password" name="newPassword" required className="w-full border rounded p-2 outline-none focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
        <input type="password" name="confirmPassword" required className="w-full border rounded p-2 outline-none focus:border-blue-500" />
      </div>

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={loading}
          className={`bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full md:w-auto ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}
