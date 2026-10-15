'use client'

import { Trash2 } from 'lucide-react';

export default function DeleteWorkerButton({ id, onDelete }: { id: string, onDelete: (id: string) => void }) {
  return (
    <button 
      onClick={() => {
        if(confirm('Are you sure you want to move this employee to the Recycle Bin? Super Admins can restore them if needed.')) {
          onDelete(id);
        }
      }}
      className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded transition flex items-center gap-1"
    >
      <Trash2 size={14} /> Delete
    </button>
  );
}
