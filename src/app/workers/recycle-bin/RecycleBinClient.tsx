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
}

export default function RecycleBinClient({ initialWorkers }: { initialWorkers: DeletedWorker[] }) {
  const [workers, setWorkers] = useState<DeletedWorker[]>(initialWorkers);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredWorkers = workers.filter((w) => {
    const term = searchTerm.toLowerCase();
    return (
      w.workerId.toLowerCase().includes(term) ||
      w.name.toLowerCase().includes(term) ||
      (w.designation && w.designation.toLowerCase().includes(term)) ||
      (w.company?.name && w.company.name.toLowerCase().includes(term)) ||
      (w.department?.name && w.department.name.toLowerCase().includes(term))
    );
  });

  const handleRestore = async (worker: DeletedWorker) => {
    if (!confirm(`Are you sure you want to restore employee ${worker.name} (${worker.workerId}) to the active employee directory?`)) {
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <Link
            href="/workers"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition mb-2"
          >
            <ArrowLeft size={16} /> Back to Employees
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <Trash2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                Employee Recycle Bin
                <span className="text-xs font-semibold bg-rose-100 text-rose-800 px-3 py-0.5 rounded-full border border-rose-200">
                  {workers.length} Deleted
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Restricted to Super Admin. Restore deleted employee profiles or permanently remove records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium">
            <ShieldAlert size={15} className="text-amber-600" />
            <span>Super Admin Protected Area</span>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search deleted employees by ID, name, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="text-xs text-gray-500 w-full sm:w-auto text-right">
          Showing <span className="font-semibold text-gray-800">{filteredWorkers.length}</span> of{' '}
          <span className="font-semibold text-gray-800">{workers.length}</span> deleted records
        </div>
      </div>

      {/* Deleted Workers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredWorkers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <UserX size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {workers.length === 0 ? 'Recycle Bin is Empty' : 'No Matching Deleted Employees Found'}
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {workers.length === 0
                ? 'All employee records are active. Deleted employees will appear here safely until permanently purged.'
                : 'Try adjusting your search terms to find the deleted employee record.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Department & Company</th>
                  <th className="py-3.5 px-4">Deleted On</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredWorkers.map((worker) => {
                  const isLoading = actionLoadingId === worker.id;
                  return (
                    <tr key={worker.id} className="hover:bg-rose-50/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {worker.workerId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {worker.name}
                        {worker.phone && (
                          <span className="block text-xs text-gray-500 font-normal">{worker.phone}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {worker.designation || <span className="text-gray-400 italic">None</span>}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 size={14} className="text-gray-400" />
                          <span>{worker.company?.name || 'Unassigned'}</span>
                        </div>
                        {worker.department?.name && (
                          <div className="text-xs text-gray-500">{worker.department.name}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {worker.deletedAt ? (
                          <div>
                            <span className="font-medium text-gray-700">{formatDate(worker.deletedAt)}</span>
                            <span className="block text-gray-400">
                              {new Date(worker.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unknown</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(worker)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition disabled:opacity-50"
                            title="Restore employee to active directory"
                          >
                            <RotateCcw size={14} />
                            {isLoading ? 'Processing...' : 'Restore'}
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(worker)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition disabled:opacity-50"
                            title="Permanently erase record"
                          >
                            <Trash2 size={14} />
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
