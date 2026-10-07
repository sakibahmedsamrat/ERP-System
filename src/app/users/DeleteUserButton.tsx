'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteUser } from './actions';

export default function DeleteUserButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      setLoading(true);
      const res = await deleteUser(id);
      setLoading(false);
      if (res?.error) {
        alert(res.error);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className={`text-red-500 hover:text-red-700 transition flex items-center justify-center p-1 ${loading ? 'opacity-50' : ''}`}
      title="Delete User"
    >
      <Trash2 size={18} />
    </button>
  );
}
