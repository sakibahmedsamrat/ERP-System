'use client';

import React, { useState, useMemo, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Printer, 
  RotateCcw, 
  AlertCircle,
  Calendar,
  Check, 
  X, 
  Sparkles, 
  User, 
  ShieldCheck, 
  FileCheck, 
  ArrowLeft,
  Download,
  FileSpreadsheet,
  CheckCheck,
  ChevronDown
} from 'lucide-react';
import { 
  formatDate, 
  formatDateTime, 
  formatDateToInput, 
  calculateServiceAge, 
  parseFlexibleDate 
} from '@/lib/formatDate';
import { 
  markConfirmationDone, 
  undoConfirmation, 
  bulkMarkConfirmationDone, 
  bulkUndoConfirmation 
} from './actions';

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
  canAccessWorkers?: boolean;
}

export default function ConfirmationsClient({
  initialWorkers,
  companies,
  departments,
  userRole,
  canAccessWorkers = true,
}: ConfirmationsClientProps) {
  const [workers, setWorkers] = useState<WorkerItem[]>(initialWorkers);
  const [activeTab, setActiveTab] = useState<'6m' | '3y'>('6m');
  const [viewStatus, setViewStatus] = useState<'pending' | 'confirmed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action modal / confirm states
  const [selectedWorkerForDone, setSelectedWorkerForDone] = useState<WorkerItem | null>(null);
  const [remarks, setRemarks] = useState('');

  // Bulk action modal states
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [showBulkUndoModal, setShowBulkUndoModal] = useState(false);

  // Export dropdown & master checkbox refs
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  const [isPendingAction, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const now = useMemo(() => new Date(), []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset bulk selection on tab or view switch
  const handleTabChange = (tab: '6m' | '3y') => {
    setActiveTab(tab);
    setSelectedIds(new Set());
  };

  const handleStatusChange = (status: 'pending' | 'confirmed') => {
    setViewStatus(status);
    setSelectedIds(new Set());
  };

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

  // Confirmation Due Date calculation helper
  const getConfirmationDueDate = React.useCallback((joinDateStr: string | null | undefined, type: '6m' | '3y'): string => {
    if (!joinDateStr) return 'N/A';
    const d = parseFlexibleDate(joinDateStr);
    if (!d) return 'N/A';
    const due = new Date(d);
    if (type === '6m') {
      due.setMonth(due.getMonth() + 6);
    } else {
      due.setFullYear(due.getFullYear() + 3);
    }
    return formatDate(due);
  }, []);

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
        const matchSubSec = (w.subSection?.name || '').toLowerCase().includes(q);
        const matchPhone = (w.phone || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchDes && !matchDept && !matchSec && !matchSubSec && !matchPhone) {
          return false;
        }
      }

      return true;
    });
  }, [workers, activeTab, viewStatus, selectedCompany, selectedDepartment, searchQuery, isEligibleFor6M, isEligibleFor3Y]);

  // Master selection state helpers
  const isAllDisplayedSelected = useMemo(() => {
    return displayedWorkers.length > 0 && displayedWorkers.every((w) => selectedIds.has(w.id));
  }, [displayedWorkers, selectedIds]);

  const isSomeDisplayedSelected = useMemo(() => {
    return displayedWorkers.some((w) => selectedIds.has(w.id)) && !isAllDisplayedSelected;
  }, [displayedWorkers, selectedIds, isAllDisplayedSelected]);

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomeDisplayedSelected;
    }
  }, [isSomeDisplayedSelected]);

  const toggleSelectAll = () => {
    if (isAllDisplayedSelected) {
      const next = new Set(selectedIds);
      displayedWorkers.forEach((w) => next.delete(w.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      displayedWorkers.forEach((w) => next.add(w.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectWorker = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // CSV / Excel Export Handler
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCsv = (items: WorkerItem[], labelSuffix: string) => {
    if (items.length === 0) {
      showToast('No employee records available to export', 'error');
      return;
    }

    const headers = [
      'SL',
      'Worker ID',
      'Name',
      'Designation',
      'Department',
      'Section',
      'Sub Section',
      'Company',
      'Joining Date',
      'Service Age',
      'Confirmation Category',
      'Confirmation Due Date',
      'Confirmation Status',
      'Confirmed Date',
      'Gross Salary',
      'Grade',
      'Phone',
      'Remarks'
    ];

    const csvRows = [headers.map(escapeCsv).join(',')];

    items.forEach((w, index) => {
      const isConfirmed = activeTab === '6m' ? !!w.confirmed6mAt : !!w.confirmed3yAt;
      const confirmedDate = activeTab === '6m' ? w.confirmed6mAt : w.confirmed3yAt;
      const remarksStr = activeTab === '6m' ? w.confirmed6mRemarks : w.confirmed3yRemarks;
      const dueDate = getConfirmationDueDate(w.joinDate, activeTab);
      const age = calculateServiceAge(w.joinDate, now).text;
      const category = activeTab === '6m' ? '6 Months Confirmation' : '3 Years Confirmation';

      const row = [
        index + 1,
        w.workerId,
        w.name,
        w.designation || 'N/A',
        w.department?.name || 'N/A',
        w.section?.name || 'N/A',
        w.subSection?.name || 'N/A',
        w.company?.name || 'N/A',
        formatDate(w.joinDate),
        age || 'N/A',
        category,
        dueDate,
        isConfirmed ? 'Confirmed' : 'Pending',
        confirmedDate ? formatDateTime(confirmedDate) : '-',
        w.grossSalary ?? 0,
        w.grade || 'N/A',
        w.phone || 'N/A',
        remarksStr || ''
      ];
      csvRows.push(row.map(escapeCsv).join(','));
    });

    // UTF-8 BOM (\uFEFF) ensures Excel properly opens character sets without encoding corruption
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = formatDateToInput(new Date());
    link.href = url;
    link.download = `employee_confirmations_${activeTab}_${labelSuffix}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Successfully exported ${items.length} employee record(s) to Excel CSV.`);
  };

  const handleExportAll = () => {
    exportToCsv(displayedWorkers, `${viewStatus}_all`);
    setShowExportMenu(false);
  };

  const handleExportSelected = () => {
    if (selectedIds.size === 0) return;
    const selectedList = workers.filter((w) => selectedIds.has(w.id));
    exportToCsv(selectedList, `${viewStatus}_selected`);
    setShowExportMenu(false);
  };

  // Handle Mark Done (Single)
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
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(workerId);
          return next;
        });
        showToast(
          `${workerName} (${activeTab === '6m' ? '6 Months' : '3 Years'}) confirmation marked as Done!`
        );
      } else {
        showToast(res.error || 'Failed to complete confirmation', 'error');
      }
    });
  };

  // Handle Undo (Single)
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
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(worker.id);
          return next;
        });
        showToast(`Confirmation reverted for ${worker.name}. Back to pending.`);
      } else {
        showToast(res.error || 'Failed to undo confirmation', 'error');
      }
    });
  };

  // Handle Bulk Confirm
  const handleBulkConfirmSubmit = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const idSet = new Set(ids);
    const type = activeTab;
    const remarksVal = bulkRemarks.trim();

    startTransition(async () => {
      const res = await bulkMarkConfirmationDone(ids, type, remarksVal || undefined);
      if (res.success) {
        const nowIso = new Date().toISOString();
        setWorkers((prev) =>
          prev.map((w) => {
            if (idSet.has(w.id)) {
              return type === '6m'
                ? { ...w, confirmed6mAt: nowIso, confirmed6mRemarks: remarksVal || null }
                : { ...w, confirmed3yAt: nowIso, confirmed3yRemarks: remarksVal || null };
            }
            return w;
          })
        );
        setShowBulkConfirmModal(false);
        setBulkRemarks('');
        setSelectedIds(new Set());
        showToast(`Successfully confirmed ${res.count ?? ids.length} employee(s) for ${type === '6m' ? '6 Months' : '3 Years'}!`);
      } else {
        showToast(res.error || 'Failed to bulk confirm employees', 'error');
      }
    });
  };

  // Handle Bulk Undo
  const handleBulkUndoSubmit = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const idSet = new Set(ids);
    const type = activeTab;

    startTransition(async () => {
      const res = await bulkUndoConfirmation(ids, type);
      if (res.success) {
        setWorkers((prev) =>
          prev.map((w) => {
            if (idSet.has(w.id)) {
              return type === '6m'
                ? { ...w, confirmed6mAt: null, confirmed6mRemarks: null }
                : { ...w, confirmed3yAt: null, confirmed3yRemarks: null };
            }
            return w;
          })
        );
        setShowBulkUndoModal(false);
        setSelectedIds(new Set());
        showToast(`Reverted confirmation for ${res.count ?? ids.length} employee(s).`);
      } else {
        showToast(res.error || 'Failed to undo confirmations', 'error');
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 pb-24">
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
          <Link
            href={canAccessWorkers ? "/workers" : "/"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition mb-2 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> {canAccessWorkers ? "Back to Employees" : "Back to Dashboard"}
          </Link>
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
          {/* Export Excel / CSV Report Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-emerald-600/20"
              title="Export confirmation records to Excel / CSV"
            >
              <FileSpreadsheet size={16} />
              <span>Export Excel / CSV Report</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 glass-modal bg-white/95 backdrop-blur-2xl rounded-xl border border-slate-200/80 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={handleExportAll}
                  className="w-full px-4 py-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-blue-50/80 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Download size={14} className="text-emerald-600" />
                    <span>Export Full Filtered List</span>
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                    {displayedWorkers.length}
                  </span>
                </button>

                <button
                  onClick={handleExportSelected}
                  disabled={selectedIds.size === 0}
                  className={`w-full px-4 py-2 text-left text-xs sm:text-sm flex items-center justify-between transition ${
                    selectedIds.size > 0
                      ? 'text-gray-700 hover:bg-blue-50/80'
                      : 'text-gray-400 cursor-not-allowed bg-gray-50/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCheck size={14} className={selectedIds.size > 0 ? 'text-blue-600' : 'text-gray-300'} />
                    <span>Export Selected</span>
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    selectedIds.size > 0 ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {selectedIds.size}
                  </span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition shadow-sm"
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
          Status: {viewStatus === 'pending' ? 'Pending for Approval' : 'Confirmed Records'} | Printed on: <span suppressHydrationWarning>{formatDateTime(new Date())}</span>
        </p>
      </div>

      {/* Module Navigation Tabs */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card bg-white/70 backdrop-blur-xl p-2 rounded-2xl border border-white/60 shadow-glass">
        {/* Main Category Tabs: 6m vs 3y */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('6m')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === '6m'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
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
            onClick={() => handleTabChange('3y')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === '3y'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
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
        <div className="flex items-center bg-slate-100/80 backdrop-blur-sm p-1 rounded-xl self-start sm:self-auto border border-white/60">
          <button
            onClick={() => handleStatusChange('pending')}
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
            onClick={() => handleStatusChange('confirmed')}
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
      <div className="print:hidden glass-panel bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-200/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-blue-900 shadow-glass">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/15 backdrop-blur-sm rounded-lg text-blue-700 shrink-0 border border-blue-200/40">
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
                  Employees with service tenure of <strong>5 months 15 days</strong> or more will appear in this list. Select employees using checkboxes to confirm them individually or in bulk.
                </span>
              ) : (
                <span>
                  Only employees with designation <strong>Quality Checker</strong> or <strong>Helper</strong> in the <strong>Production</strong> department, and service tenure of <strong>2 years 11 months</strong> or more will appear in this list.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs font-medium px-3 py-1 bg-white/80 rounded-lg border border-blue-200/60 text-blue-800 shrink-0 shadow-xs flex items-center gap-2">
          <span>Total in view: <strong className="text-blue-950 font-bold">{displayedWorkers.length}</strong></span>
          {selectedIds.size > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {selectedIds.size} selected
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar (Hidden during print) */}
      <div className="print:hidden glass-card bg-white/70 backdrop-blur-xl p-4 rounded-2xl border border-white/60 shadow-glass grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Employee ID, Name, Designation, Department..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 focus:bg-white transition"
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
            className="w-full px-3 py-2 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/60 focus:bg-white transition text-gray-700"
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
            className="w-full px-3 py-2 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/60 focus:bg-white transition text-gray-700"
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
      <div className="glass-table-container bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 w-12 text-center print:hidden">
                  <input
                    type="checkbox"
                    checked={isAllDisplayedSelected}
                    ref={masterCheckboxRef}
                    disabled={displayedWorkers.length === 0}
                    onChange={toggleSelectAll}
                    aria-label="Select all employees in list"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 accent-blue-600"
                  />
                </th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Designation & Grade</th>
                <th className="py-3.5 px-4">Department & Section</th>
                <th className="py-3.5 px-4">Join Date & Due Date</th>
                <th className="py-3.5 px-4">Service Age</th>
                {viewStatus === 'confirmed' && <th className="py-3.5 px-4">Confirmed At</th>}
                <th className="py-3.5 px-4 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {displayedWorkers.length === 0 ? (
                <tr>
                  <td
                    colSpan={viewStatus === 'confirmed' ? 8 : 7}
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
                  const confirmedDateStr = activeTab === '6m' ? worker.confirmed6mAt : worker.confirmed3yAt;
                  const remarksStr = activeTab === '6m' ? worker.confirmed6mRemarks : worker.confirmed3yRemarks;
                  const isSelected = selectedIds.has(worker.id);
                  const dueDateStr = getConfirmationDueDate(worker.joinDate, activeTab);

                  return (
                    <tr
                      key={worker.id}
                      className={`transition-colors duration-150 group ${
                        isSelected ? 'bg-blue-50/80 hover:bg-blue-100/70' : 'hover:bg-blue-50/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 w-12 text-center print:hidden cursor-pointer"
                        onClick={() => toggleSelectWorker(worker.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectWorker(worker.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${worker.name}`}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer accent-blue-600"
                        />
                      </td>

                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center relative">
                            {worker.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
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
                          {worker.subSection?.name && ` • ${worker.subSection.name}`}
                          {worker.company && ` • ${worker.company.name}`}
                        </div>
                      </td>

                      {/* Join Date & Due Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">
                          {formatDate(worker.joinDate)}
                        </div>
                        <div className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                          <Calendar size={11} className="text-blue-500" />
                          <span>Due: {dueDateStr}</span>
                        </div>
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

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="print:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl glass-modal bg-slate-900/95 text-white backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 ring-1 ring-blue-500/30 shadow-[0_10px_40px_rgba(30,58,138,0.3)]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="w-8 h-8 rounded-full bg-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-400/40 shrink-0">
              {selectedIds.size}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{selectedIds.size} {selectedIds.size === 1 ? 'employee' : 'employees'} selected</span>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  (of {displayedWorkers.length} displayed)
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate">
                Confirm status or export to Excel report
              </div>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-300 hover:text-white underline ml-2 transition shrink-0"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end w-full sm:w-auto">
            <button
              onClick={handleExportSelected}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs"
              title="Download Excel / CSV report for selected employees"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span>Export Selected</span>
            </button>

            {viewStatus === 'pending' ? (
              <button
                onClick={() => {
                  setBulkRemarks('');
                  setShowBulkConfirmModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition active:scale-95"
              >
                <CheckCheck size={16} />
                <span>Confirm Selected ({selectedIds.size})</span>
              </button>
            ) : (
              <button
                onClick={() => setShowBulkUndoModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-600/30 transition active:scale-95"
              >
                <RotateCcw size={15} />
                <span>Revert Selected ({selectedIds.size})</span>
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* Single Confirmation Done Modal */}
      {selectedWorkerForDone && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/15 backdrop-blur-sm text-emerald-700 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 size={22} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Confirm {activeTab === '6m' ? '6 Months' : '3 Years'} Status
                </h3>
              </div>
              <button
                onClick={() => setSelectedWorkerForDone(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-gray-600">
                Are you sure you want to mark confirmation as <strong>Done</strong> for this employee?
              </p>

              <div className="bg-slate-50/80 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/60 text-sm space-y-1">
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
                  <span className="text-gray-500">Confirmation Due:</span>
                  <span className="font-semibold text-blue-700">
                    {getConfirmationDueDate(selectedWorkerForDone.joinDate, activeTab)}
                  </span>
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
                  className="w-full px-3 py-2 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/70 focus:bg-white transition"
                />
              </div>

              <p className="text-xs text-gray-500 italic">
                Once marked as Done, this employee will be automatically removed from the pending list and saved in the confirmation history.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60">
              <button
                onClick={() => setSelectedWorkerForDone(null)}
                className="px-4 py-2 border border-slate-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-slate-100/70 transition"
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

      {/* Bulk Confirm Modal */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/15 backdrop-blur-sm text-emerald-700 rounded-xl border border-emerald-500/20">
                  <CheckCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Confirm Selected Employees
                  </h3>
                  <p className="text-xs text-gray-500">
                    {activeTab === '6m' ? '6 Months Confirmation' : '3 Years Confirmation'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-sm text-gray-600">
                You are about to confirm tenure status for{' '}
                <strong className="text-emerald-700 font-bold">{selectedIds.size}</strong> selected employee(s).
              </p>

              {/* Selected Workers preview list */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 rounded-xl border border-slate-200/80 p-2.5 bg-slate-50/70">
                {workers
                  .filter((w) => selectedIds.has(w.id))
                  .map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2 bg-white rounded-lg border border-slate-200/50 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold text-blue-700 shrink-0">{w.workerId}</span>
                        <span className="font-semibold text-gray-800 truncate">{w.name}</span>
                      </div>
                      <div className="text-gray-500 shrink-0 text-right">
                        {w.designation || 'N/A'} • {w.department?.name || 'N/A'}
                      </div>
                    </div>
                  ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Optional Bulk Remarks / Notes:
                </label>
                <input
                  type="text"
                  value={bulkRemarks}
                  onChange={(e) => setBulkRemarks(e.target.value)}
                  placeholder="e.g. Regularized upon review, Satisfactory performance..."
                  className="w-full px-3 py-2 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/70 focus:bg-white transition"
                />
              </div>

              <p className="text-xs text-gray-500 italic">
                Once confirmed, all selected employees will be updated with today&apos;s confirmation timestamp and recorded in the audit logs.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60">
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-slate-100/70 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkConfirmSubmit}
                disabled={isPendingAction}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
              >
                {isPendingAction ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCheck size={16} /> Confirm {selectedIds.size} Employees
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Undo Modal */}
      {showBulkUndoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/15 backdrop-blur-sm text-amber-700 rounded-xl border border-amber-500/20">
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Revert Confirmation
                  </h3>
                  <p className="text-xs text-gray-500">
                    {activeTab === '6m' ? '6 Months Confirmation' : '3 Years Confirmation'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkUndoModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-gray-600">
                Are you sure you want to revert confirmation status for{' '}
                <strong className="text-amber-700 font-bold">{selectedIds.size}</strong> employee(s)?
              </p>
              <p className="text-xs text-gray-500">
                They will be returned to the pending confirmation list.
              </p>

              {/* Selected Workers preview list */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 rounded-xl border border-slate-200/80 p-2.5 bg-slate-50/70">
                {workers
                  .filter((w) => selectedIds.has(w.id))
                  .map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2 bg-white rounded-lg border border-slate-200/50 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold text-amber-700 shrink-0">{w.workerId}</span>
                        <span className="font-semibold text-gray-800 truncate">{w.name}</span>
                      </div>
                      <div className="text-gray-500 shrink-0 text-right">
                        {w.designation || 'N/A'} • {w.department?.name || 'N/A'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/60">
              <button
                onClick={() => setShowBulkUndoModal(false)}
                className="px-4 py-2 border border-slate-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-slate-100/70 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUndoSubmit}
                disabled={isPendingAction}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
              >
                {isPendingAction ? (
                  <>Processing...</>
                ) : (
                  <>
                    <RotateCcw size={15} /> Revert {selectedIds.size} Employees
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
