'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Users } from 'lucide-react';

export default function WorkersErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Workers Module Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Employees Directory Error</h2>
      <p className="text-gray-600 mb-6 max-w-md text-sm leading-relaxed">
        Unable to load employee records or query the database. This may be due to a temporary network disruption.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
        >
          <RotateCcw size={16} /> Try Again
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/workers';
          }}
          className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
        >
          <Users size={16} /> Reset Directory
        </button>
      </div>
    </div>
  );
}
