'use client'

import { Trash2 } from 'lucide-react';
import { deleteTraining } from './actions';
import { useTransition } from 'react';

export default function DeleteTrainingButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this training? This action cannot be undone.')) {
      startTransition(() => {
        deleteTraining(id);
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className={`${isPending ? 'text-gray-300' : 'text-gray-500 hover:text-red-500'} transition`}
      title="Delete Training"
    >
      <Trash2 size={16} />
    </button>
  );
}
