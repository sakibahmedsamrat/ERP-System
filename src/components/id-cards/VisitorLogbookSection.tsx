'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';
import { 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Luggage, 
  Printer, 
  CheckCircle2, 
  Trash2, 
  Phone, 
  Building2, 
  User, 
  Search,
  ExternalLink,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { checkInVisitor, checkOutVisitor, deleteVisitorLog } from '@/app/id-cards/actions';
import VisitorIdCardSection from './VisitorIdCardSection';

interface VisitorItem {
  id: string;
  passNumber: string;
  visitorName: string;
  visitorPhone: string;
  visitorCompany: string | null;
  visitorNid: string | null;
  hostWorkerId: string | null;
  hostName: string | null;
  purpose: string;
  belongings: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  expectedDuration: number | null;
  status: string;
  hostWorker?: {
    id: string;
    workerId: string;
    name: string;
    department?: { name: string } | null;
  } | null;
}

interface WorkerSimple {
  id: string;
  workerId: string;
  name: string;
  department?: { name: string } | null;
}

interface Props {
  visitorLogs: VisitorItem[];
  workers: WorkerSimple[];
}

export default function VisitorLogbookSection({ visitorLogs, workers }: Props) {
  const [viewMode, setViewMode] = useState<'logbook' | 'designer'>('logbook');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PREMISES' | 'CHECKED_OUT' | 'OVERSTAYED'>('ALL');

  // Print Pass Modal
  const [printingPass, setPrintingPass] = useState<VisitorItem | null>(null);
  const [passQrCode, setPassQrCode] = useState<string>('');

  const now = new Date().getTime();

  // Metrics
  let inPremisesCount = 0;
  let overstayCount = 0;
  let checkedOutCount = 0;

  visitorLogs.forEach(v => {
    if (v.status === 'CHECKED_OUT') {
      checkedOutCount++;
    } else {
      inPremisesCount++;
      const elapsedMins = Math.floor((now - new Date(v.checkInTime).getTime()) / (1000 * 60));
      if (elapsedMins > (v.expectedDuration || 60)) {
        overstayCount++;
      }
    }
  });

  // Filtered
  const filteredLogs = visitorLogs.filter(v => {
    const elapsedMins = Math.floor((now - new Date(v.checkInTime).getTime()) / (1000 * 60));
    const isOverstay = v.status === 'IN_PREMISES' && elapsedMins > (v.expectedDuration || 60);

    if (statusFilter === 'IN_PREMISES' && v.status !== 'IN_PREMISES') return false;
    if (statusFilter === 'CHECKED_OUT' && v.status !== 'CHECKED_OUT') return false;
    if (statusFilter === 'OVERSTAYED' && !isOverstay) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        v.visitorName.toLowerCase().includes(q) ||
        v.passNumber.toLowerCase().includes(q) ||
        v.visitorPhone.toLowerCase().includes(q) ||
        (v.visitorCompany && v.visitorCompany.toLowerCase().includes(q)) ||
        (v.hostWorker && v.hostWorker.name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const reloadVisitorTab = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'visitor');
      window.location.href = url.toString();
    }
  };

  const handleCheckIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCheckInLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await checkInVisitor(formData);
    setCheckInLoading(false);

    if (res.success) {
      setIsCheckInModalOpen(false);
      reloadVisitorTab();
    } else {
      alert(res.error || 'Failed to check in visitor');
    }
  };

  const handleCheckOut = async (id: string) => {
    if (!confirm('Mark visitor as checked out and left premises?')) return;
    const res = await checkOutVisitor(id);
    if (res.success) {
      reloadVisitorTab();
    } else {
      alert(res.error || 'Failed to check out visitor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this visitor log record?')) return;
    const res = await deleteVisitorLog(id);
    if (res.success) {
      reloadVisitorTab();
    } else {
      alert(res.error || 'Failed to delete record');
    }
  };

  const openPrintModal = async (visitor: VisitorItem) => {
    setPrintingPass(visitor);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/verify/badge/${visitor.passNumber}`;
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 140 });
      setPassQrCode(qr);
    } catch (e) {
      console.error('Failed to generate pass QR:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-view toggle & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck size={20} className="text-indigo-600" /> Visitor Management System (VMS) &amp; Gate Logbook
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time factory gate check-in/out, belonging tracking, overstay alerts, and visitor badge issuance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('logbook')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'logbook' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gate Logbook
            </button>
            <button
              onClick={() => setViewMode('designer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'designer' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Card Canvas Designer
            </button>
          </div>

          {viewMode === 'logbook' && (
            <button
              onClick={() => setIsCheckInModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Plus size={16} /> Check In Visitor
            </button>
          )}
        </div>
      </div>

      {viewMode === 'designer' ? (
        <VisitorIdCardSection />
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <span>In Factory Premises</span>
                <UserCheck size={16} className="text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{inPremisesCount}</div>
              <div className="text-xs text-slate-400 mt-1">Currently active visitor badges</div>
            </div>

            <div className={`glass-card backdrop-blur-xl p-5 rounded-2xl border shadow-glass ${
              overstayCount > 0 
                ? 'bg-rose-50/80 border-rose-200' 
                : 'bg-white/70 border-white/60'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className={overstayCount > 0 ? 'text-rose-700' : 'text-slate-500'}>Overstay Alert</span>
                <AlertTriangle size={16} className={overstayCount > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'} />
              </div>
              <div className={`text-3xl font-extrabold ${overstayCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {overstayCount}
              </div>
              <div className="text-xs text-slate-400 mt-1">Exceeded allowed visit duration</div>
            </div>

            <div className="glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Checked Out</span>
                <CheckCircle2 size={16} className="text-blue-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{checkedOutCount}</div>
              <div className="text-xs text-slate-400 mt-1">Safely exited factory gates</div>
            </div>

            <div className="glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Total Visitor Logs</span>
                <Clock size={16} className="text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{visitorLogs.length}</div>
              <div className="text-xs text-slate-400 mt-1">All-time logged gate records</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="glass-card bg-white/70 backdrop-blur-xl p-4 rounded-2xl border border-white/60 shadow-glass flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(['ALL', 'IN_PREMISES', 'OVERSTAYED', 'CHECKED_OUT'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    statusFilter === tab
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'ALL' && 'All Visitors'}
                  {tab === 'IN_PREMISES' && 'In Premises'}
                  {tab === 'OVERSTAYED' && `Overstayed (${overstayCount})`}
                  {tab === 'CHECKED_OUT' && 'Checked Out'}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search visitor, phone, host, pass#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Visitor Log Table */}
          <div className="glass-table-container rounded-2xl shadow-sm border border-white/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Pass #</th>
                    <th className="p-4">Visitor Details</th>
                    <th className="p-4">Host Employee</th>
                    <th className="p-4">Purpose &amp; Belongings</th>
                    <th className="p-4">Check-In / Duration</th>
                    <th className="p-4">Gate Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 bg-white/40">
                  {filteredLogs.map(v => {
                    const elapsedMins = Math.floor((now - new Date(v.checkInTime).getTime()) / (1000 * 60));
                    const isOverstay = v.status === 'IN_PREMISES' && elapsedMins > (v.expectedDuration || 60);
                    const overstayPast = elapsedMins - (v.expectedDuration || 60);

                    return (
                      <tr key={v.id} className={`transition-colors ${isOverstay ? 'bg-rose-50/40 hover:bg-rose-50/60' : 'hover:bg-blue-50/40'}`}>
                        <td className="p-4 font-mono font-extrabold text-indigo-700">
                          {v.passNumber}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{v.visitorName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone size={11} /> {v.visitorPhone} {v.visitorCompany && `• ${v.visitorCompany}`}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{v.hostWorker?.name || v.hostName || 'MEP Reception'}</div>
                          <div className="text-[11px] text-slate-400">{v.hostWorker?.department?.name || 'Factory'}</div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="font-semibold text-slate-800 truncate">{v.purpose}</div>
                          <div className="text-[11px] text-amber-600 truncate flex items-center gap-1">
                            <Luggage size={11} /> {v.belongings || 'None declared'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-700">{formatDate(v.checkInTime)}</div>
                          <div className="text-[11px] text-slate-400">Allowed: {v.expectedDuration || 60}m</div>
                        </td>
                        <td className="p-4">
                          {isOverstay ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-600 text-white border border-rose-700 animate-pulse flex items-center gap-1 w-fit">
                              <AlertTriangle size={11} /> OVERSTAYED (+{overstayPast}m)
                            </span>
                          ) : v.status === 'IN_PREMISES' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              IN PREMISES
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              CHECKED OUT
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => openPrintModal(v)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                            title="Print Gate Pass Badge"
                          >
                            <Printer size={13} /> Badge
                          </button>
                          {v.status === 'IN_PREMISES' && (
                            <button
                              onClick={() => handleCheckOut(v.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                            >
                              Check Out
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-500 font-medium">
                        No visitor records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHECK IN VISITOR */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <UserCheck size={18} className="text-indigo-600" /> Check In Factory Visitor
              </h3>
              <button onClick={() => setIsCheckInModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Visitor Full Name *</label>
                  <input
                    type="text"
                    name="visitorName"
                    required
                    placeholder="e.g. Tareq Hasan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="visitorPhone"
                    required
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Representing Company</label>
                  <input
                    type="text"
                    name="visitorCompany"
                    placeholder="e.g. Apex Logistics, Singer BD"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">NID / ID Number</label>
                  <input
                    type="text"
                    name="visitorNid"
                    placeholder="Optional NID"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Host Employee *</label>
                <select
                  name="hostWorkerId"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">General Reception / Security Office</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.workerId}) - {w.department?.name || 'Factory'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Purpose of Visit *</label>
                <input
                  type="text"
                  name="purpose"
                  required
                  placeholder="e.g. Machine maintenance inspection, Vendor supplier delivery"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Belongings Logged</label>
                  <input
                    type="text"
                    name="belongings"
                    placeholder="e.g. Laptop HP SN4829, Tool Kit"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Expected Duration</label>
                  <select
                    name="expectedDuration"
                    defaultValue="60"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour (Standard)</option>
                    <option value="120">2 Hours</option>
                    <option value="240">4 Hours (Half Day)</option>
                    <option value="480">8 Hours (Full Day)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkInLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {checkInLoading ? 'Checking In...' : 'Issue Pass & Check In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT VISITOR BADGE */}
      {printingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-extrabold text-sm text-slate-900">Official Visitor Gate Pass</h3>
              <button onClick={() => setPrintingPass(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">
                &times;
              </button>
            </div>

            {/* Printable Pass Badge */}
            <div 
              id="visitor-pass-badge"
              className="border-2 border-dashed border-indigo-300 rounded-2xl p-4 bg-gradient-to-b from-indigo-50/60 to-white text-center space-y-3"
            >
              <div className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                MEP GROUP • FACTORY GATE PASS
              </div>

              <div className="text-2xl font-black font-mono text-slate-900">
                {printingPass.passNumber}
              </div>

              {passQrCode && (
                <div className="w-24 h-24 mx-auto p-1 border border-slate-200 bg-white rounded-xl shadow-xs flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={passQrCode} alt="Pass QR" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="space-y-0.5">
                <div className="font-bold text-sm text-slate-900">{printingPass.visitorName}</div>
                <div className="text-xs text-slate-500">{printingPass.visitorCompany || 'Visitor'}</div>
              </div>

              <div className="text-[10px] text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-100 space-y-1 text-left">
                <div><span className="font-bold">Host:</span> {printingPass.hostWorker?.name || printingPass.hostName || 'MEP Reception'}</div>
                <div><span className="font-bold">Purpose:</span> {printingPass.purpose}</div>
                <div><span className="font-bold">Belongings:</span> {printingPass.belongings || 'None'}</div>
                <div><span className="font-bold">Check-In:</span> {formatDate(printingPass.checkInTime)}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPrintingPass(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
              >
                <Printer size={14} /> Print Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
