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
          <div key={w.id} className="bg-blue-50 text-blue-800 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm border border-blue-100">
            <span>{w.name} <span className="text-blue-500 text-xs">({w.workerId})</span></span>
            <button type="button" onClick={() => removeWorker(w.id)} className="text-blue-400 hover:text-red-500 transition">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {isSearching && (
          <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>
        )}

        {results.length > 0 && query.length >= 2 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {results.map((w) => (
              <div 
                key={w.id} 
                onClick={() => addWorker(w)}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
              >
                <div className="font-medium text-gray-800">{w.name}</div>
                <div className="text-xs text-gray-500">ID: {w.workerId} {w.designation ? `• ${w.designation}` : ''}</div>
              </div>
            ))}
          </div>
        )}
        
        {results.length === 0 && query.length >= 2 && !isSearching && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-center text-sm text-gray-500">
            No employees found.
          </div>
        )}
      </div>
    </div>
  );
}

