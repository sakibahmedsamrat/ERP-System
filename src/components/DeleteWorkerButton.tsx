'use client'

import { Trash2 } from 'lucide-react';

export default function DeleteWorkerButton({ id, onDelete }: { id: string, onDelete: (id: string) => void }) {
  return (
    <button 
      onClick={() => {
        if(confirm('Are you sure you want to delete this employee? This will also delete their attendance and settlement records.')) {
          onDelete(id);
        }
      }}
      className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded transition flex items-center gap-1"
    >
      <Trash2 size={14} /> Delete
    </button>
  );
}
