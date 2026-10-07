'use client'

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function DeleteSettlementButton({ id, onDelete }: { id: string, onDelete: (id: string) => Promise<{ success?: boolean; error?: string }> }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if(confirm('Are you sure you want to delete this settlement?')) {
      setLoading(true);
      try {
        const res = await onDelete(id);
        if(res?.error) alert(res.error);
      } catch(e) {
        alert('Failed to delete settlement');
      }
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className={`text-sm text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 ${loading ? 'opacity-50' : ''}`}
    >
      <Trash2 size={14} /> Delete
    </button>
  );
}
