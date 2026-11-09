'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">Application Connection Error</h2>
          <p className="text-slate-300 text-xs mb-6 leading-relaxed">
            The application encountered a server or database connectivity issue. Please try refreshing the page.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw size={15} />
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
