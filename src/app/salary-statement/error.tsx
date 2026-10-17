'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, FileSpreadsheet } from 'lucide-react';

export default function StandaloneSalaryStatementErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Salary Statement Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Salary Statement Error</h2>
      <p className="text-gray-600 mb-6 max-w-md text-sm leading-relaxed">
        Could not load the salary statement generator or render the statement view. Please try reloading the form.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shadow-blue-500/20 active:scale-95"
        >
          <RotateCcw size={16} /> Try Again
        </button>
        <Link
          href="/salary-statement"
          className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
        >
          <FileSpreadsheet size={16} /> Reload Statement Form
        </Link>
      </div>
    </div>
  );
}
