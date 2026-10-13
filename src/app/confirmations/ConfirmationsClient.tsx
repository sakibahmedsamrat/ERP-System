'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Printer, 
  RotateCcw, 
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Check,
  X,
  Sparkles,
  ChevronRight,
  User,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { formatDate, formatDateTime, calculateServiceAge } from '@/lib/formatDate';
import { markConfirmationDone, undoConfirmation } from './actions';

interface WorkerItem {
  id: string;
  workerId: string;
  name: string;
  designation: string | null;
  gender: string | null;
  bloodGroup: string | null;
  phone: string | null;
  photoUrl: string | null;
  grade: string | null;
  grossSalary: number | null;
  joinDate: string | null;
  confirmed6mAt: string | null;
  confirmed3yAt: string | null;
  confirmed6mRemarks: string | null;
  confirmed3yRemarks: string | null;
  company: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  subSection: { id: string; name: string } | null;
}

interface ConfirmationsClientProps {
  initialWorkers: WorkerItem[];
  companies: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  userRole?: string;
}

export default function ConfirmationsClient({
  initialWorkers,
  companies,
  departments,
  userRole,
}: ConfirmationsClientProps) {
  const [workers, setWorkers] = useState<WorkerItem[]>(initialWorkers);
  const [activeTab, setActiveTab] = useState<'6m' | '3y'>('6m');
  const [viewStatus, setViewStatus] = useState<'pending' | 'confirmed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // Action modal / confirm state
  const [selectedWorkerForDone, setSelectedWorkerForDone] = useState<WorkerItem | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isPendingAction, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const now = useMemo(() => new Date(), []);

  // Filter criteria helper
  const isEligibleFor6M = React.useCallback((worker: WorkerItem): boolean => {
    if (!worker.joinDate) return false;
    const age = calculateServiceAge(worker.joinDate, now);
    if (!age.isValid || age.isInverted) return false;
    // Condition: At least 5 months and 15 days
    if (age.years > 0) return true;
    if (age.months > 5) return true;
    if (age.months === 5 && age.days >= 15) return true;
    return false;
  }, [now]);

  const isEligibleFor3Y = React.useCallback((worker: WorkerItem): boolean => {
    if (!worker.joinDate) return false;
    const des = (worker.designation || '').toLowerCase().trim();
    const dept = (worker.department?.name || '').toLowerCase().trim();

    const isHelper = des.includes('helper');
    const isQualityChecker = des.includes('quality checker');

    // Rule: Helper must be from Production department; Quality Checker is eligible
    const isTargetDesignation = (isHelper && dept.includes('production')) || isQualityChecker;
    if (!isTargetDesignation) return false;

    const age = calculateServiceAge(worker.joinDate, now);
    if (!age.isValid || age.isInverted) return false;
    // Condition: At least 2 years and 11 months
    if (age.years >= 3) return true;
    if (age.years === 2 && age.months >= 11) return true;
    return false;
  }, [now]);

  // Precomputed counts for badges
  const pending6mCount = useMemo(() => {
    return workers.filter((w) => !w.confirmed6mAt && isEligibleFor6M(w)).length;
  }, [workers, isEligibleFor6M]);

  const confirmed6mCount = useMemo(() => {
    return workers.filter((w) => !!w.confirmed6mAt).length;
  }, [workers]);

  const pending3yCount = useMemo(() => {
    return workers.filter((w) => !w.confirmed3yAt && isEligibleFor3Y(w)).length;
  }, [workers, isEligibleFor3Y]);

  const confirmed3yCount = useMemo(() => {
    return workers.filter((w) => !!w.confirmed3yAt).length;
  }, [workers]);

  // Filtered workers based on current view
  const displayedWorkers = useMemo(() => {
    return workers.filter((w) => {
      // Tab filter
      if (activeTab === '6m') {
        if (viewStatus === 'pending') {
          if (w.confirmed6mAt) return false;
          if (!isEligibleFor6M(w)) return false;
        } else {
          if (!w.confirmed6mAt) return false;
        }
      } else {
        if (viewStatus === 'pending') {
          if (w.confirmed3yAt) return false;
          if (!isEligibleFor3Y(w)) return false;
        } else {
          if (!w.confirmed3yAt) return false;
        }
      }

      // Company filter
      if (selectedCompany && w.company?.id !== selectedCompany) {
        return false;
      }

      // Department filter
      if (selectedDepartment && w.department?.id !== selectedDepartment) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = w.workerId.toLowerCase().includes(q);
        const matchName = w.name.toLowerCase().includes(q);
        const matchDes = (w.designation || '').toLowerCase().includes(q);
        const matchDept = (w.department?.name || '').toLowerCase().includes(q);
        const matchSec = (w.section?.name || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchDes && !matchDept && !matchSec) {
          return false;
        }
      }

      return true;
    });
  }, [workers, activeTab, viewStatus, selectedCompany, selectedDepartment, searchQuery, isEligibleFor6M, isEligibleFor3Y]);

  // Handle Mark Done
  const handleDoneSubmit = async () => {
    if (!selectedWorkerForDone) return;
    const workerId = selectedWorkerForDone.id;
    const workerName = selectedWorkerForDone.name;
    const type = activeTab;

    startTransition(async () => {
      const res = await markConfirmationDone(workerId, type, remarks.trim() || undefined);
      if (res.success) {
        setWorkers((prev) =>
          prev.map((w) => {
            if (w.id === workerId) {
              const nowIso = new Date().toISOString();
              return type === '6m'
                ? { ...w, confirmed6mAt: nowIso, confirmed6mRemarks: remarks.trim() || null }
                : { ...w, confirmed3yAt: nowIso, confirmed3yRemarks: remarks.trim() || null };
            }
            return w;
          })
        );
        setSelectedWorkerForDone(null);
        setRemarks('');
        showToast(
          `${workerName} (${activeTab === '6m' ? '6 Months' : '3 Years'}) confirmation marked as Done!`
        );
      } else {
        showToast(res.error || 'Failed to complete confirmation', 'error');
      }
    });
  };

  // Handle Undo
  const handleUndo = async (worker: WorkerItem) => {
    if (!confirm(`Are you sure you want to revert confirmation for ${worker.name}?`)) {
      return;
    }
    const type = activeTab;
    startTransition(async () => {
      const res = await undoConfirmation(worker.id, type);
      if (res.success) {
        setWorkers((prev) =>
          prev.map((w) => {
            if (w.id === worker.id) {
              return type === '6m'
                ? { ...w, confirmed6mAt: null, confirmed6mRemarks: null }
                : { ...w, confirmed3yAt: null, confirmed3yRemarks: null };
            }
            return w;
          })
        );
        showToast(`Confirmation reverted for ${worker.name}. Back to pending.`);
      } else {
        showToast(res.error || 'Failed to undo confirmation', 'error');
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-white transition-all transform animate-bounce ${
            toastMessage.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-medium text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Header section (Hidden during print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <UserCheck size={26} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Employee Confirmation
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage 6-Months & 3-Years tenure confirmations with automated eligibility
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 transition shadow-sm"
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900">
          Employee Confirmation Report
        </h2>
        <p className="text-sm font-semibold text-gray-700 mt-1">
          {activeTab === '6m' ? '6 Months Confirmation (Eligibility: ≥ 5 Months 15 Days)' : '3 Years Confirmation (Production Helper & Quality Checker, Eligibility: ≥ 2 Years 11 Months)'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Status: {viewStatus === 'pending' ? 'Pending for Approval' : 'Confirmed Records'} | Printed on: {formatDateTime(new Date())}
        </p>
      </div>

      {/* Module Navigation Tabs */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-gray-200/80 shadow-sm">
        {/* Main Category Tabs: 6m vs 3y */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('6m')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === '6m'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileCheck size={18} />
            <span>6 Months Confirmation</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === '6m' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {pending6mCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('3y')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === '3y'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck size={18} />
            <span>3 Years Confirmation</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === '3y' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {pending3yCount}
            </span>
          </button>
        </div>

        {/* Sub Toggle: Pending vs Confirmed */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewStatus('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewStatus === 'pending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock size={14} className={viewStatus === 'pending' ? 'text-amber-500' : ''} />
            Pending ({activeTab === '6m' ? pending6mCount : pending3yCount})
          </button>
          <button
            onClick={() => setViewStatus('confirmed')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewStatus === 'confirmed'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <CheckCircle2 size={14} className={viewStatus === 'confirmed' ? 'text-emerald-500' : ''} />
            Confirmed History ({activeTab === '6m' ? confirmed6mCount : confirmed3yCount})
          </button>
        </div>
      </div>

      {/* Criteria Info Banner */}
      <div className="print:hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-blue-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {activeTab === '6m' ? (
                <span>6 Months Confirmation Rules</span>
              ) : (
                <span>3 Years Confirmation Rules (Production Helper & Quality Checker)</span>
              )}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              {activeTab === '6m' ? (
                <span>
                  Employees with service tenure of <strong>5 months 15 days</strong> or more will appear in this list. Click <strong>Done</strong> to complete confirmation.
                </span>
              ) : (
                <span>
                  Only employees with designation <strong>Quality Checker</strong> or <strong>Helper</strong> in the <strong>Production</strong> department, and service tenure of <strong>2 years 11 months</strong> or more will appear in this list.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs font-medium px-3 py-1 bg-white/80 rounded-lg border border-blue-200 text-blue-800 shrink-0">
          Total in view: <strong className="text-blue-950 font-bold">{displayedWorkers.length}</strong>
        </div>
      </div>

      {/* Filter and Search Bar (Hidden during print) */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Employee ID, Name, Designation, Department..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition text-gray-700"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition text-gray-700"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Designation & Grade</th>
                <th className="py-3.5 px-4">Department & Section</th>
                <th className="py-3.5 px-4">Join Date</th>
                <th className="py-3.5 px-4">Service Age</th>
                {viewStatus === 'confirmed' && <th className="py-3.5 px-4">Confirmed At</th>}
                <th className="py-3.5 px-4 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {displayedWorkers.length === 0 ? (
                <tr>
                  <td
                    colSpan={viewStatus === 'confirmed' ? 7 : 6}
                    className="py-12 px-4 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-gray-50 rounded-full text-gray-300">
                        <UserCheck size={32} />
                      </div>
                      <p className="font-semibold text-gray-600">No employees found</p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        {viewStatus === 'pending'
                          ? `Currently there are no employees meeting the ${
                              activeTab === '6m' ? '5 months 15 days' : '2 years 11 months (Production Helper / Quality Checker)'
                            } pending confirmation criteria.`
                          : 'No confirmation history recorded yet in this category.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedWorkers.map((worker) => {
                  const age = calculateServiceAge(worker.joinDate, now);
                  const isDone = activeTab === '6m' ? !!worker.confirmed6mAt : !!worker.confirmed3yAt;
                  const confirmedDateStr = activeTab === '6m' ? worker.confirmed6mAt : worker.confirmed3yAt;
                  const remarksStr = activeTab === '6m' ? worker.confirmed6mRemarks : worker.confirmed3yRemarks;

                  return (
                    <tr
                      key={worker.id}
                      className="hover:bg-blue-50/40 transition-colors duration-150 group"
                    >
                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center relative">
                            {worker.photoUrl ? (
                              <img
                                src={worker.photoUrl}
                                alt={worker.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/workers/${worker.id}`}
                              className="font-bold text-gray-900 hover:text-blue-600 transition flex items-center gap-1 group-hover:underline"
                            >
                              {worker.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
                                {worker.workerId}
                              </span>
                              {worker.phone && (
                                <span className="text-xs text-gray-400">{worker.phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation & Grade */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">
                          {worker.designation || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Grade: {worker.grade || 'N/A'}
                        </div>
                      </td>

                      {/* Department & Section */}
                      <td className="py-3.5 px-4">
                        <div className="text-gray-800 font-medium">
                          {worker.department?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {worker.section?.name || 'General Section'}
                          {worker.company && ` • ${worker.company.name}`}
                        </div>
                      </td>

                      {/* Join Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">
                          {formatDate(worker.joinDate)}
                        </div>
                        <div className="text-xs text-gray-400">Join Date</div>
                      </td>

                      {/* Service Age */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            activeTab === '6m'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          <Clock size={12} />
                          {age.text || 'N/A'}
                        </span>
                      </td>

                      {/* Confirmed At (History View) */}
                      {viewStatus === 'confirmed' && (
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-emerald-700 text-xs">
                            {formatDateTime(confirmedDateStr)}
                          </div>
                          {remarksStr && (
                            <div className="text-xs text-gray-500 italic mt-0.5 truncate max-w-xs">
                              Note: {remarksStr}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right print:hidden">
                        {viewStatus === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedWorkerForDone(worker);
                              setRemarks('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition transform active:scale-95"
                            title="Mark Confirmation as Done"
                          >
                            <Check size={14} />
                            Done
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUndo(worker)}
                            disabled={isPendingAction}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-amber-50 text-gray-600 hover:text-amber-700 border border-gray-200 hover:border-amber-300 rounded-lg text-xs font-medium transition"
                            title="Revert back to Pending"
                          >
                            <RotateCcw size={12} />
                            Undo
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Signature Section */}
      <div className="hidden print:grid grid-cols-4 gap-8 pt-16 text-center text-xs text-gray-700">
        <div>
          <div className="border-t border-gray-500 pt-2 font-bold">Prepared By (HR)</div>
        </div>
        <div>
          <div className="border-t border-gray-500 pt-2 font-bold">Checked By</div>
        </div>
        <div>
          <div className="border-t border-gray-500 pt-2 font-bold">Manager (HR & Admin)</div>
        </div>
        <div>
          <div className="border-t border-gray-500 pt-2 font-bold">Approved By (GM / MD)</div>
        </div>
      </div>

      {/* Done Confirmation Modal */}
      {selectedWorkerForDone && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 size={22} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Confirm {activeTab === '6m' ? '6 Months' : '3 Years'} Status
                </h3>
              </div>
              <button
                onClick={() => setSelectedWorkerForDone(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-gray-600">
                Are you sure you want to mark confirmation as <strong>Done</strong> for this employee?
              </p>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Employee ID:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {selectedWorkerForDone.workerId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-semibold text-gray-900">{selectedWorkerForDone.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Designation:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedWorkerForDone.designation || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Join Date:</span>
                  <span className="text-gray-900">{formatDate(selectedWorkerForDone.joinDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Age:</span>
                  <span className="font-bold text-emerald-700">
                    {calculateServiceAge(selectedWorkerForDone.joinDate, now).text}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Optional Remarks / Note:
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Regularized, Good performance, Grade incremented..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <p className="text-xs text-gray-500 italic">
                Once marked as Done, this employee will be automatically removed from the pending list and saved in the confirmation history.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedWorkerForDone(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDoneSubmit}
                disabled={isPendingAction}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
              >
                {isPendingAction ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Check size={16} /> Mark as Done
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
