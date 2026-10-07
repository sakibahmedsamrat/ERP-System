'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function DeleteCompanyButton({ id, onDelete }: { id: string, onDelete: (id: string) => Promise<any> }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      setLoading(true);
      const res = await onDelete(id);
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
      className={`text-red-500 hover:text-red-700 transition flex items-center gap-1 ${loading ? 'opacity-50' : ''}`}
      title="Delete Company"
    >
      <Trash2 size={18} />
      {loading ? <span className="text-xs">Deleting...</span> : null}
    </button>
  );
}
