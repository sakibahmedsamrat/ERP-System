'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, RotateCcw, Search, ShieldAlert, Building2, UserX, AlertCircle, CheckCircle2 } from 'lucide-react';
import { restoreWorker, permanentDeleteWorker } from '../actions';
import { formatDate } from '@/lib/formatDate';

interface DeletedWorker {
  id: string;
  workerId: string;
  name: string;
  designation: string | null;
  phone: string | null;
  deletedAt: Date | string | null;
  company: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  settlements?: {
    id: string;
    status: string;
    lastWorkingDay: Date | string | null;
    resignApplyDate: Date | string | null;
    totalPayAmount: number | null;
  }[];
}

export default function RecycleBinClient({ initialWorkers }: { initialWorkers: DeletedWorker[] }) {
  const [workers, setWorkers] = useState<DeletedWorker[]>(initialWorkers);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getPrimarySettlement = (w: DeletedWorker) => {
    return w.settlements?.find((s) => s.status === 'PAID') || (w.settlements && w.settlements.length > 0 ? w.settlements[0] : null);
  };

  const filteredWorkers = workers.filter((w) => {
    const term = searchTerm.toLowerCase();
    const latestSettlement = getPrimarySettlement(w);
    const reasonText = latestSettlement?.status === 'PAID'
      ? 'settlement paid'
      : latestSettlement?.status === 'APPROVED'
      ? 'settlement approved'
      : latestSettlement
      ? 'resigned pending'
      : 'direct deletion';

    return (
      w.workerId.toLowerCase().includes(term) ||
      w.name.toLowerCase().includes(term) ||
      (w.designation && w.designation.toLowerCase().includes(term)) ||
      (w.company?.name && w.company.name.toLowerCase().includes(term)) ||
      (w.department?.name && w.department.name.toLowerCase().includes(term)) ||
      reasonText.includes(term)
    );
  });

  const handleRestore = async (worker: DeletedWorker) => {
    const isSettled = worker.settlements?.some((s) => s.status === 'PAID');
    const confirmPrompt = isSettled
      ? `Are you sure you want to restore employee ${worker.name} (${worker.workerId}) back to active employees?\n\nNote: This employee's settlement was recorded as PAID. Restoring will reactivate the record.`
      : `Are you sure you want to restore employee ${worker.name} (${worker.workerId}) to the active employee directory?`;

    if (!confirm(confirmPrompt)) {
      return;
    }

    setActionLoadingId(worker.id);
    setFeedback(null);

    try {
      const res = await restoreWorker(worker.id);
      if (res?.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setWorkers((prev) => prev.filter((item) => item.id !== worker.id));
        setFeedback({
          type: 'success',
          message: `Employee ${worker.name} (${worker.workerId}) has been successfully restored.`,
        });
      }
    } catch (err) {
      console.error('Failed to restore worker:', err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred while restoring employee.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePermanentDelete = async (worker: DeletedWorker) => {
    if (
      !confirm(
        `WARNING: Are you sure you want to PERMANENTLY delete employee ${worker.name} (${worker.workerId})?\n\nThis will permanently delete all related attendance, settlements, and training assignments. This action CANNOT be undone!`
      )
    ) {
      return;
    }

    setActionLoadingId(worker.id);
    setFeedback(null);

    try {
      const res = await permanentDeleteWorker(worker.id);
      if (res?.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setWorkers((prev) => prev.filter((item) => item.id !== worker.id));
        setFeedback({
          type: 'success',
          message: `Employee ${worker.name} (${worker.workerId}) was permanently deleted from the database.`,
        });
      }
    } catch (err) {
      console.error('Failed to permanently delete worker:', err);
      setFeedback({ type: 'error', message: 'An unexpected error occurred while purging employee record.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <Link
            href="/workers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition mb-2"
          >
            <ArrowLeft size={14} /> Back to Employees
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-2xl border border-rose-200/50 shadow-xs">
              <Trash2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                Employee Recycle Bin
                <span className="text-xs font-bold bg-rose-50 text-rose-700 px-3 py-0.5 rounded-full border border-rose-200/70">
                  {workers.length} Deleted
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Restricted to Super Admin. Restore deleted employee profiles or permanently purge records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold">
            <ShieldAlert size={15} className="text-amber-600" />
            <span>Super Admin Protected Area</span>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search Bar Glass Panel */}
      <div className="glass-card p-4 rounded-2xl shadow-sm border border-white/70 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search deleted by ID, name, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
          />
        </div>
        <div className="text-xs text-slate-500 w-full sm:w-auto text-right">
          Showing <span className="font-bold text-slate-800">{filteredWorkers.length}</span> of{' '}
          <span className="font-bold text-slate-800">{workers.length}</span> deleted records
        </div>
      </div>

      {/* Deleted Workers Table Glass Container */}
      <div className="glass-table-container rounded-2xl shadow-sm border border-white/70 overflow-hidden">
        {filteredWorkers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <UserX size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {workers.length === 0 ? 'Recycle Bin is Empty' : 'No Matching Deleted Employees Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {workers.length === 0
                ? 'All employee records are active. Deleted employees will appear here safely until permanently purged.'
                : 'Try adjusting your search terms to find the deleted employee record.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department & Company</th>
                  <th className="py-3 px-4">Exit Reason</th>
                  <th className="py-3 px-4">Deleted On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 bg-white/40">
                {filteredWorkers.map((worker) => {
                  const isLoading = actionLoadingId === worker.id;
                  return (
                    <tr key={worker.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {worker.workerId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {worker.name}
                        {worker.phone && (
                          <span className="block text-[11px] text-slate-500 font-normal">{worker.phone}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {worker.designation || <span className="text-slate-400 italic">None</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 size={13} className="text-slate-400" />
                          <span>{worker.company?.name || 'Unassigned'}</span>
                        </div>
                        {worker.department?.name && (
                          <div className="text-[11px] text-slate-500">{worker.department.name}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const s = getPrimarySettlement(worker);
                          if (s?.status === 'PAID') {
                            return (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Settlement Paid
                                </span>
                                <div className="text-[11px] text-slate-500">
                                  <Link
                                    href={`/settlements/${s.id}`}
                                    className="text-blue-600 hover:underline font-semibold"
                                    title="View settlement record"
                                  >
                                    View Settlement ({s.totalPayAmount != null ? `${s.totalPayAmount.toFixed(2)} BDT` : 'Recorded'})
                                  </Link>
                                </div>
                              </div>
                            );
                          }
                          if (s?.status === 'APPROVED') {
                            return (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  Settlement Approved
                                </span>
                                <div className="text-[11px] text-slate-500">
                                  <Link
                                    href={`/settlements/${s.id}`}
                                    className="text-blue-600 hover:underline font-semibold"
                                  >
                                    View Settlement
                                  </Link>
                                </div>
                              </div>
                            );
                          }
                          if (s) {
                            return (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Resigned (Pending)
                                </span>
                                <div className="text-[11px] text-slate-500">
                                  <Link
                                    href={`/settlements/${s.id}`}
                                    className="text-blue-600 hover:underline font-semibold"
                                  >
                                    View Settlement
                                  </Link>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Direct Deletion
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {worker.deletedAt ? (
                          <div>
                            <span className="font-semibold text-slate-700">{formatDate(worker.deletedAt)}</span>
                            <span className="block text-[11px] text-slate-400">
                              {new Date(worker.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unknown</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(worker)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-xs transition disabled:opacity-50 shadow-xs"
                            title="Restore employee to active directory"
                          >
                            <RotateCcw size={13} />
                            {isLoading ? 'Processing...' : 'Restore'}
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(worker)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 px-2.5 py-1 rounded-lg font-bold text-xs transition disabled:opacity-50 shadow-xs"
                            title="Permanently erase record"
                          >
                            <Trash2 size={13} />
                            {isLoading ? 'Purging...' : 'Delete Permanently'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
