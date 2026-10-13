'use client'

import { useState, useEffect, useRef } from 'react';
import { Search, User, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

export default function EmployeeIdCardSection({ 
  searchParams 
}: { 
  searchParams?: Record<string, string | undefined> 
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const queryParams = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) queryParams.set(k, v);
    });
  }
  const initialParams = queryParams.toString();
  const iframeSrc = `/id-card/index.html?embedded=true${initialParams ? '&' + initialParams : ''}`;

  // Auto-load worker if workerDbId or worker ID is in URL
  useEffect(() => {
    const targetId = searchParams?.workerDbId || searchParams?.id;
    if (targetId) {
      fetch(`/api/workers/search?${searchParams?.workerDbId ? `id=${searchParams.workerDbId}` : `q=${searchParams?.id}`}`)
        .then(res => res.json())
        .then(data => {
          const w = data.worker || (data.workers && data.workers[0]);
          if (w) {
            handleSelectWorker(w);
          }
        })
        .catch(console.error);
    }
  }, [searchParams?.workerDbId, searchParams?.id]);

  // Live Employee Search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/workers/search?q=${encodeURIComponent(query)}&withPhoto=true`);
        const data = await res.json();
        setResults(data.workers || []);
      } catch (err) {
        console.error('Error searching employees:', err);
      }
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Send employee data to the embedded iframe
  const sendWorkerToIframe = (worker: any) => {
    if (!iframeRef.current?.contentWindow) return;

    const payload = {
      name: worker.name || '',
      designation: worker.designation || '',
      section: worker.section?.name || worker.department?.name || '',
      id: worker.workerId || '',
      joinDate: formatDate(worker.joinDate),
      blood: worker.bloodGroup || '',
      phone: worker.phone || '',
      nid: worker.nationalId || '',
      photoUrl: worker.photoUrl || '',
      signatureUrl: worker.signatureUrl || ''
    };

    const post = () => {
      try {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'LOAD_EMPLOYEE',
          payload
        }, '*');
      } catch (e) {
        console.error('postMessage error:', e);
      }
    };

    post();
    // Re-send after slight delay to ensure iframe canvas fully rendered
    setTimeout(post, 350);
  };

  const handleSelectWorker = async (worker: any) => {
    let target = worker;
    if ((!target.photoUrl || !target.signatureUrl) && target.id) {
      try {
        const res = await fetch(`/api/workers/search?id=${target.id}`);
        const data = await res.json();
        if (data.worker) target = data.worker;
      } catch (e) {
        console.error('Error fetching full worker details:', e);
      }
    }
    setSelectedWorker(target);
    setQuery('');
    setResults([]);
    sendWorkerToIframe(target);
  };

  const handleClearSelected = () => {
    setSelectedWorker(null);
  };

  // If iframe reloaded, send active worker
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    if (selectedWorker) {
      setTimeout(() => {
        sendWorkerToIframe(selectedWorker);
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Worker Auto-Fill Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Box with Suggestions */}
          <div className="relative flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Employee by Name or Card Number to Auto-Fill..."
                className="w-full pl-10 pr-10 py-3 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
              />
              {isSearching && (
                <div className="absolute right-3.5 top-3.5 text-xs text-gray-400 animate-spin">
                  <RefreshCw size={14} />
                </div>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {results.length > 0 && query.length >= 2 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-72 overflow-y-auto">
                <div className="p-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggestions ({results.length})
                </div>
                {results.map((w: any) => (
                  <div
                    key={w.id}
                    onClick={() => handleSelectWorker(w)}
                    className="p-3.5 hover:bg-blue-50/60 cursor-pointer border-b border-gray-50 last:border-0 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      {w.photoUrl ? (
                        <img src={w.photoUrl} alt={w.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {w.name?.charAt(0) || <User size={16} />}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition text-sm">
                          {w.name}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-gray-700">ID: {w.workerId}</span>
                          {w.designation && <span>• {w.designation}</span>}
                          {w.department?.name && <span className="text-gray-400">• {w.department.name}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full group-hover:bg-blue-600 group-hover:text-white transition">
                      Load Info
                    </span>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && query.length >= 2 && !isSearching && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-center text-sm text-gray-500 z-50">
                No employees found matching &quot;{query}&quot;
              </div>
            )}
          </div>

          {/* Active Loaded Employee Badge */}
          {selectedWorker ? (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl text-blue-800 text-sm">
              <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
              <div>
                <span className="font-bold">{selectedWorker.name}</span>{' '}
                <span className="text-blue-600 font-semibold">({selectedWorker.workerId})</span>
              </div>
              <button
                onClick={handleClearSelected}
                className="ml-2 text-blue-400 hover:text-red-500 transition p-1 hover:bg-blue-100/50 rounded-lg"
                title="Clear selected employee"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="text-xs text-gray-400 hidden lg:block text-right">
              Search & click any employee above to fill all fields automatically
            </div>
          )}
        </div>
      </div>

      {/* Embedded High-Performance ID Card Generator */}
      <div className="bg-transparent rounded-2xl overflow-hidden">
        <iframe
          ref={iframeRef}
          onLoad={handleIframeLoad}
          src={iframeSrc}
          title="MEP Employee ID Card Generator"
          className="w-full min-h-[1000px] h-[1050px] border-0 rounded-2xl bg-transparent"
        />
      </div>
    </div>
  );
}
