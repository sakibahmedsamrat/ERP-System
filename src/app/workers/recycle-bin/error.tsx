'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Trash2, ArrowLeft } from 'lucide-react';

export default function RecycleBinErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Recycle Bin Module Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Recycle Bin Error</h2>
      <p className="text-gray-600 mb-6 max-w-md text-sm leading-relaxed">
        Could not load deleted employee records or perform recycle bin operations.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition flex items-center gap-2 shadow-sm shadow-rose-500/20 active:scale-95"
        >
          <RotateCcw size={16} /> Try Again
        </button>
        <Link
          href="/workers"
          className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Employees
        </Link>
      </div>
    </div>
  );
}
