'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { Search, User, X, CheckCircle2, RefreshCw, QrCode, ExternalLink, ShieldCheck, Copy, Check } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

export default function EmployeeIdCardSection({ 
  searchParams 
}: { 
  searchParams?: Record<string, string | undefined>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking or tapping outside
  useEffect(() => {
    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);
    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, []);

  // Close suggestions when window loses focus (e.g. clicking into embedded iframe)
  useEffect(() => {
    const handleBlur = () => {
      setIsOpen(false);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const queryParams = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) queryParams.set(k, v);
    });
  }
  const initialParams = queryParams.toString();
  const iframeSrc = `/id-card/index.html?embedded=true${initialParams ? '&' + initialParams : ''}`;

  // Generate QR code and barcode when selected worker changes
  useEffect(() => {
    if (!selectedWorker) {
      setQrCodeDataUrl('');
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const verifyUrl = `${origin}/verify/badge/${selectedWorker.workerId || selectedWorker.id}`;

    // Generate dynamic QR code
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 140,
      color: { dark: '#0f172a', light: '#ffffff' }
    }).then(url => {
      setQrCodeDataUrl(url);
    }).catch(err => {
      console.error('Error generating QR code:', err);
    });

    // Generate barcode if canvas available
    if (barcodeCanvasRef.current) {
      import('jsbarcode').then(JsBarcode => {
        try {
          JsBarcode.default(barcodeCanvasRef.current, selectedWorker.workerId || '000000', {
            format: 'CODE128',
            width: 1.8,
            height: 40,
            displayValue: true,
            fontSize: 12,
            font: 'monospace',
            textMargin: 2
          });
        } catch (e) {
          console.error('Barcode error:', e);
        }
      });
    }
  }, [selectedWorker]);

  // Send employee data to the embedded iframe
  const sendWorkerToIframe = useCallback((worker: any) => {
    if (!iframeRef.current?.contentWindow) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const verifyUrl = `${origin}/verify/badge/${worker.workerId || worker.id}`;

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
      signatureUrl: worker.signatureUrl || '',
      verifyUrl
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
  }, []);

  const handleSelectWorker = useCallback(async (worker: any) => {
    // 1. Immediately close dropdown, clear search query, and update UI
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedWorker(worker);
    sendWorkerToIframe(worker);

    // 2. Fetch full photo and signature in background if not already present
    if ((!worker.photoUrl || !worker.signatureUrl) && worker.id) {
      try {
        const res = await fetch(`/api/workers/search?id=${worker.id}`);
        const data = await res.json();
        if (data?.worker) {
          setSelectedWorker(data.worker);
          sendWorkerToIframe(data.worker);
        }
      } catch (e) {
        console.error('Error fetching full worker details:', e);
      }
    }
  }, [sendWorkerToIframe]);

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
  }, [searchParams?.workerDbId, searchParams?.id, handleSelectWorker]);

  // Live Employee Search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/workers/search?q=${encodeURIComponent(query)}&withPhoto=true`);
        const data = await res.json();
        setResults(data.workers || []);
      } catch (err) {
        console.error('Error searching employees:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset keyboard highlight whenever search results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  // Auto-scroll highlighted suggestion into view during keyboard navigation
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelectWorker(results[highlightedIndex]);
      } else if (results.length > 0) {
        handleSelectWorker(results[0]);
      }
    }
  };

  const handleClearQuery = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClearSelected = () => {
    setSelectedWorker(null);
    setQrCodeDataUrl('');
  };

  const handleCopyLink = () => {
    if (!selectedWorker) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/verify/badge/${selectedWorker.workerId || selectedWorker.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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
      <div className="relative z-50 glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Box with Suggestions */}
          <div ref={searchContainerRef} className="relative flex-1 z-50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim().length >= 2) {
                    setIsOpen(true);
                  }
                }}
                onFocus={() => {
                  if (query.trim().length >= 2) {
                    setIsOpen(true);
                  }
                }}
                onClick={() => {
                  if (query.trim().length >= 2) {
                    setIsOpen(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search Employee by Name or Card Number to Auto-Fill..."
                className="w-full pl-10 pr-20 py-3 bg-white/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition shadow-xs text-slate-800 placeholder:text-slate-400"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                {isSearching && (
                  <RefreshCw size={14} className="text-blue-500 animate-spin" />
                )}
                {query && (
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown Suggestions */}
            {isOpen && query.trim().length >= 2 && (
              <div 
                ref={dropdownRef}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-[60] max-h-72 overflow-y-auto divide-y divide-slate-100 ring-1 ring-black/5"
              >
                {results.length > 0 ? (
                  <>
                    <div className="px-3.5 py-2.5 bg-slate-50/90 backdrop-blur-xs border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10 flex items-center justify-between">
                      <span>Suggestions ({results.length})</span>
                      <span className="text-[11px] font-normal normal-case text-slate-400 hidden sm:inline">Use ↑↓ to navigate, Enter to select</span>
                    </div>
                    {results.map((w: any, index: number) => {
                      const isHighlighted = index === highlightedIndex;
                      return (
                        <div
                          key={w.id}
                          data-index={index}
                          onClick={() => handleSelectWorker(w)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`p-3.5 cursor-pointer transition flex items-center justify-between gap-3 group ${
                            isHighlighted ? 'bg-blue-50/90' : 'hover:bg-blue-50/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {w.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={w.photoUrl} 
                                alt={w.name} 
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" 
                                style={{
                                  filter: 'brightness(1.06) contrast(1.04) saturate(1.05)',
                                  WebkitFilter: 'brightness(1.06) contrast(1.04) saturate(1.05)'
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {w.name?.charAt(0) || <User size={16} />}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className={`font-semibold text-sm truncate transition ${
                                isHighlighted ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'
                              }`}>
                                {w.name}
                              </div>
                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                <span className="font-semibold text-slate-700">ID: {w.workerId}</span>
                                {w.designation && <span className="truncate text-slate-500">• {w.designation}</span>}
                                {w.department?.name && <span className="text-slate-400 truncate">• {w.department.name}</span>}
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full transition shrink-0 ${
                            isHighlighted 
                              ? 'bg-blue-600 text-white' 
                              : 'text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white'
                          }`}>
                            Load Info
                          </span>
                        </div>
                      );
                    })}
                  </>
                ) : isSearching ? (
                  <div className="p-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-blue-600" />
                    <span>Searching employees...</span>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No employees found matching &quot;{query}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Loaded Employee Badge */}
          {selectedWorker ? (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl text-blue-800 text-sm shrink-0">
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
            <div className="text-xs text-gray-400 hidden lg:block text-right shrink-0">
              Search &amp; click any employee above to fill all fields automatically
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Security Verification Card (Dynamic Signed QR + Code-128 Barcode) */}
      {selectedWorker && (
        <div className="relative z-10 backdrop-blur-xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-blue-500/30 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* Dynamic QR */}
              {qrCodeDataUrl && (
                <div className="w-24 h-24 bg-white p-1 rounded-xl shrink-0 shadow-md flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeDataUrl} alt="Gate Verification QR" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  <span>Dynamic Signed Security Badge &amp; QR</span>
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {selectedWorker.name} • <span className="font-mono text-blue-300">ID: {selectedWorker.workerId}</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Scannable at factory gates by security guards using mobile phones. Points to live anti-tamper ledger.
                </p>
              </div>
            </div>

            {/* Code-128 Barcode + Actions */}
            <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
              <div className="bg-white p-1 rounded-xl shadow-xs">
                <canvas ref={barcodeCanvasRef} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedLink ? 'Copied Link' : 'Copy Verification Link'}</span>
                </button>

                <a
                  href={`/verify/badge/${selectedWorker.workerId || selectedWorker.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink size={13} /> Test Gate Route
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded High-Performance ID Card Generator */}
      <div className="relative z-0 bg-transparent rounded-2xl overflow-hidden">
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
