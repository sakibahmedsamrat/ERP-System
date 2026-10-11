'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">পেজটি লোড করা যায়নি (Something went wrong)</h2>
      <p className="text-gray-600 mb-6 max-w-md text-sm">
        সার্ভার বা ডেটাবেজে সাময়িক সংযোগ বিঘ্ন ঘটেছে। দয়া করে নিচের বাটনে ক্লিক করে আবার চেষ্টা করুন।
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shadow-blue-500/20 active:scale-95"
      >
        <RotateCcw size={18} /> আবার লোড করুন (Retry)
      </button>
    </div>
  );
}
