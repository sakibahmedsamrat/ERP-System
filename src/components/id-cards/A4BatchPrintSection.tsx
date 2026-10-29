'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  Filter, 
  CheckSquare, 
  Square, 
  Layers, 
  Building2, 
  Sparkles, 
  Download,
  Eye,
  Check
} from 'lucide-react';

interface WorkerItem {
  id: string;
  workerId: string;
  name: string;
  designation: string | null;
  bloodGroup: string | null;
  phone: string | null;
  photoUrl: string | null;
  company?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  section?: { id: string; name: string } | null;
  joinDate: string;
}

interface Props {
  workers: WorkerItem[];
  companies: { id: string; name: string }[];
}

export default function A4BatchPrintSection({ workers, companies }: Props) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  // Filter workers
  const filteredWorkers = workers.filter(w => {
    if (selectedCompanyId && w.company?.id !== selectedCompanyId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!w.name.toLowerCase().includes(q) && !w.workerId.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedWorkerIds.length === filteredWorkers.length) {
      setSelectedWorkerIds([]);
    } else {
      setSelectedWorkerIds(filteredWorkers.map(w => w.id));
    }
  };

  const toggleSelectWorker = (id: string) => {
    setSelectedWorkerIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedWorkers = workers.filter(w => selectedWorkerIds.includes(w.id));

  // Generate QR codes for selected workers
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    selectedWorkers.forEach(async (w) => {
      if (!qrCodes[w.id]) {
        try {
          const verifyUrl = `${origin}/verify/badge/${w.workerId || w.id}`;
          const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
            margin: 1,
            width: 120,
            color: { dark: '#0f172a', light: '#ffffff' }
          });
          setQrCodes(prev => ({ ...prev, [w.id]: qrDataUrl }));
        } catch (e) {
          console.error('Error generating QR code:', e);
        }
      }
    });
  }, [selectedWorkers, qrCodes]);

  const handlePrint = () => {
    window.print();
  };

  // Divide into chunks of 8 (8 cards per A4 page)
  const pages: WorkerItem[][] = [];
  for (let i = 0; i < selectedWorkers.length; i += 8) {
    pages.push(selectedWorkers.slice(i, i + 8));
  }

  return (
    <div className="space-y-6">
      {/* Print Controls Header - Hidden during print */}
      <div className="print:hidden glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers size={20} className="text-blue-600" /> A4 PVC Batch Print Sheet
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard 8 PVC cards per A4 sheet (85.6mm x 54mm ID-1 format) with 3mm bleed and cut guides
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              {selectedWorkerIds.length} cards selected ({pages.length} A4 page{pages.length === 1 ? '' : 's'})
            </span>

            <button
              onClick={handlePrint}
              disabled={selectedWorkers.length === 0}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-slate-900/20"
            >
              <Printer size={16} /> Print A4 Batch Sheet
            </button>
          </div>
        </div>

        {/* Filter & Select Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="w-48">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold text-slate-800"
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search employee by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 bg-white/80 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={toggleSelectAll}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            {selectedWorkerIds.length === filteredWorkers.length && filteredWorkers.length > 0 ? (
              <CheckSquare size={14} className="text-blue-600" />
            ) : (
              <Square size={14} />
            )}
            <span>Select All Filtered ({filteredWorkers.length})</span>
          </button>
        </div>

        {/* Quick Selection Chips */}
        <div className="max-h-36 overflow-y-auto p-2 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-wrap gap-2">
          {filteredWorkers.map(w => {
            const isSelected = selectedWorkerIds.includes(w.id);
            return (
              <button
                key={w.id}
                onClick={() => toggleSelectWorker(w.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isSelected && <Check size={12} />}
                <span>{w.name} ({w.workerId})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* A4 Batch Pages Preview & Print View */}
      {selectedWorkers.length === 0 ? (
        <div className="print:hidden glass-card p-12 text-center rounded-3xl border border-white/70">
          <Layers size={40} className="text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base">No Employees Selected</h3>
          <p className="text-xs text-slate-400 mt-1">Select employees from the list above to arrange on A4 PVC print sheets (8 per page).</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pages.map((pageWorkers, pageIdx) => (
            <div
              key={pageIdx}
              className="a4-page bg-white shadow-2xl mx-auto p-[10mm] border border-slate-300 rounded-2xl print:rounded-none print:shadow-none print:border-0 print:p-0 print:m-0"
              style={{
                width: '210mm',
                minHeight: '297mm',
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
              }}
            >
              {/* Header on page */}
              <div className="print:hidden mb-4 pb-2 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500 font-bold">
                <span>A4 PVC Sheet {pageIdx + 1} of {pages.length}</span>
                <span>8 Cards per Sheet (85.6mm x 54mm)</span>
              </div>

              {/* 2 columns x 4 rows grid = 8 cards */}
              <div 
                className="grid grid-cols-2 gap-[5mm] justify-items-center"
                style={{ gridTemplateColumns: 'repeat(2, 85.6mm)', justifyContent: 'center' }}
              >
                {pageWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="relative bg-white border border-dashed border-slate-300 print:border-slate-400 overflow-hidden flex flex-col justify-between"
                    style={{
                      width: '85.6mm',
                      height: '54mm',
                      padding: '3mm',
                      boxSizing: 'border-box',
                      borderRadius: '3mm',
                    }}
                  >
                    {/* Header Strip */}
                    <div className="flex items-center justify-between pb-1 border-b border-blue-600/30">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-sm bg-blue-700 flex items-center justify-center text-[8px] font-black text-white">
                          M
                        </div>
                        <span className="font-black text-[9px] tracking-tight text-slate-900 uppercase">
                          {worker.company?.name || 'MEP GROUP'}
                        </span>
                      </div>
                      <span className="text-[8px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-800 rounded font-mono">
                        {worker.workerId}
                      </span>
                    </div>

                    {/* Body: Photo + Info + QR */}
                    <div className="flex items-center gap-2.5 my-auto">
                      {/* Photo */}
                      <div className="w-[18mm] h-[22mm] rounded border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {worker.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={worker.photoUrl} alt={worker.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[12px] font-bold text-slate-400">
                            {worker.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="font-black text-[10px] text-slate-900 leading-tight truncate">
                          {worker.name}
                        </div>
                        <div className="text-[8px] font-bold text-blue-700 leading-tight truncate">
                          {worker.designation || 'Staff'}
                        </div>
                        <div className="text-[7.5px] text-slate-600 truncate">
                          Dept: <span className="font-semibold text-slate-800">{worker.department?.name || '-'}</span>
                        </div>
                        <div className="text-[7.5px] text-slate-600">
                          Blood: <span className="font-bold text-rose-600">{worker.bloodGroup || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Dynamic QR */}
                      <div className="w-[18mm] h-[18mm] shrink-0 border border-slate-200 rounded p-0.5 bg-white flex items-center justify-center">
                        {qrCodes[worker.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={qrCodes[worker.id]} alt="Verify QR" className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-[6px] text-slate-300">QR</div>
                        )}
                      </div>
                    </div>

                    {/* Footer barcode line & security seal */}
                    <div className="pt-0.5 border-t border-slate-200 flex justify-between items-center text-[7px] text-slate-500 font-mono">
                      <span>SECURE VERIFICATION TAG</span>
                      <span className="font-bold text-slate-800">MEP IDENTITY SYSTEM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
