'use client'

import { Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function DeleteWorkerButton({ 
  id, 
  onDelete 
}: { 
  id: string; 
  onDelete: (id: string) => Promise<any> | void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to move this employee to the Recycle Bin? Super Admins can restore them if needed.')) {
      setLoading(true);
      try {
        await onDelete(id);
      } catch (err) {
        console.error('Failed to move employee to recycle bin:', err);
        alert('Failed to delete employee. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className={`text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded transition flex items-center gap-1 font-medium ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <>
          <Loader2 size={13} className="animate-spin" /> Deleting...
        </>
      ) : (
        <>
          <Trash2 size={14} /> Delete
        </>
      )}
    </button>
  );
}
