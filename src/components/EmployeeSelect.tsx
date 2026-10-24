'use client'

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

export default function EmployeeSelect({ 
  initialSelected = [], 
  mode = 'multiple', 
  inputName = 'workerIds[]',
  placeholder = 'Search Employee by Name or Card No...'
}: { 
  initialSelected?: any | any[], 
  mode?: 'single' | 'multiple',
  inputName?: string,
  placeholder?: string
}) {
  const initialArr = Array.isArray(initialSelected) ? initialSelected : (initialSelected ? [initialSelected] : []);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>(initialArr);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/workers/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.workers || []);
      } catch (e) {
        console.error(e);
      }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const addWorker = (w: any) => {
    if (mode === 'single') {
      setSelected([w]);
    } else {
      if (!selected.find((s) => s.id === w.id)) {
        setSelected([...selected, w]);
      }
    }
    setQuery('');
    setResults([]);
  };

  const removeWorker = (id: string) => {
    setSelected(selected.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-3">
      {selected.map(w => (
        <input key={w.id} type="hidden" name={inputName} value={w.id} />
      ))}
      
      <div className="flex flex-wrap gap-2">
        {selected.map((w) => (
          <div key={w.id} className="bg-blue-500/10 text-blue-700 font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 text-xs border border-blue-500/20 backdrop-blur-sm shadow-xs">
            <span>{w.name} <span className="text-blue-500 font-mono text-[11px]">({w.workerId})</span></span>
            <button type="button" onClick={() => removeWorker(w.id)} className="text-blue-400 hover:text-rose-500 transition">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium placeholder:text-slate-400 text-sm"
        />
        {isSearching && (
          <div className="absolute right-3.5 top-3 text-xs text-slate-400 font-medium">Searching...</div>
        )}

        {results.length > 0 && query.length >= 2 && (
          <div className="absolute z-50 w-full mt-1.5 glass-panel border border-white/80 rounded-2xl shadow-2xl max-h-60 overflow-y-auto backdrop-blur-2xl divide-y divide-slate-100/60">
            {results.map((w) => (
              <div 
                key={w.id} 
                onClick={() => addWorker(w)}
                className="px-4 py-2.5 hover:bg-blue-50/60 cursor-pointer transition text-left"
              >
                <div className="font-bold text-slate-900 text-sm">{w.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">ID: {w.workerId} {w.designation ? `• ${w.designation}` : ''}</div>
              </div>
            ))}
          </div>
        )}
        
        {results.length === 0 && query.length >= 2 && !isSearching && (
          <div className="absolute z-50 w-full mt-1.5 glass-panel border border-white/80 rounded-2xl shadow-2xl p-4 text-center text-sm text-slate-500 backdrop-blur-2xl">
            No employees found.
          </div>
        )}
      </div>
    </div>
  );
}

