'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Calendar, UserMinus, AlertCircle, CheckCircle2, 
  ArrowRight, FileText, Printer, Trash2, X, RefreshCw, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react';
import { formatDate, calculateServiceAge, parseFlexibleDate, getPayrollCycleDays, formatDateToInput } from '@/lib/formatDate';
import { recordEmployeeResignation, deleteSettlement, updateSettlementStatus } from './actions';
import DeleteSettlementButton from '@/components/DeleteSettlementButton';

interface SettlementItem {
  id: string;
  workerId: string;
  resignApplyDate: Date | string | null;
  lastWorkingDay: Date | string | null;
  serviceAge: string | null;
  totalPayAmount: number | null;
  status: string;
  createdAt: Date | string;
  worker: {
    id: string;
    name: string;
    workerId: string;
    designation?: string | null;
    department?: { name: string } | null;
    company?: { name: string } | null;
    isDeleted?: boolean;
    deletedAt?: Date | string | null;
  };
}

interface SettlementManagerClientProps {
  initialSettlements: SettlementItem[];
}

export default function SettlementManagerClient({ initialSettlements }: SettlementManagerClientProps) {
  const router = useRouter();

  // Search & Record Resignation Panel State (open by default for quick employee selection)
  const [isResignPanelOpen, setIsResignPanelOpen] = useState(true);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [employeeResults, setEmployeeResults] = useState<any[]>([]);
  const [isSearchingEmployee, setIsSearchingEmployee] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);

  // Resignation Form Fields
  const [resignApplyDate, setResignApplyDate] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmittingResign, setIsSubmittingResign] = useState(false);
  const [resignationSuccess, setResignationSuccess] = useState<{
    message: string;
    settlementId: string;
    workerName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Table Filtering State
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID'>('ALL');
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Local settlement items to allow instant UI updates
  const [settlements, setSettlements] = useState<SettlementItem[]>(initialSettlements);
  const [, setRenderNonce] = useState(0);

  useEffect(() => {
    setSettlements(initialSettlements);
  }, [initialSettlements]);

  // Live Employee Search Debounce
  useEffect(() => {
    if (!employeeQuery || employeeQuery.trim().length < 2) {
      setEmployeeResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingEmployee(true);
      try {
        const res = await fetch(`/api/workers/search?q=${encodeURIComponent(employeeQuery.trim())}`);
        const data = await res.json();
        setEmployeeResults(data.workers || []);
      } catch (err) {
        console.error('Failed to search workers:', err);
      } finally {
        setIsSearchingEmployee(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeQuery]);

  // Handle employee selection
  const handleSelectWorker = (worker: any) => {
    setSelectedWorker(worker);
    setEmployeeResults([]);
    setEmployeeQuery('');
    setErrorMessage('');
    setResignationSuccess(null);

    // Check if worker already has a pending settlement to prefill dates
    const existing = settlements.find(
      s => s.workerId === worker.id && s.status === 'PENDING'
    );
    if (existing) {
      if (existing.resignApplyDate) {
        setResignApplyDate(formatDateToInput(existing.resignApplyDate));
      }
      if (existing.lastWorkingDay) {
        setLastWorkingDay(formatDateToInput(existing.lastWorkingDay));
      }
    } else {
      setResignApplyDate('');
      setLastWorkingDay('');
    }
  };

  const handleResetResignForm = () => {
    setSelectedWorker(null);
    setEmployeeQuery('');
    setEmployeeResults([]);
    setResignApplyDate('');
    setLastWorkingDay('');
    setRemarks('');
    setErrorMessage('');
  };

  // Real-time calculation previews for resignation panel
  const calculatedServiceAge = useMemo(() => {
    if (!selectedWorker?.joinDate || !lastWorkingDay) return null;
    return calculateServiceAge(selectedWorker.joinDate, lastWorkingDay);
  }, [selectedWorker?.joinDate, lastWorkingDay]);

  const calculatedPayrollCycle = useMemo(() => {
    if (!lastWorkingDay) return null;
    return getPayrollCycleDays(lastWorkingDay);
  }, [lastWorkingDay]);

  const calculatedNoticePeriod = useMemo(() => {
    if (!resignApplyDate || !lastWorkingDay) return null;
    const rDate = parseFlexibleDate(resignApplyDate);
    const lDate = parseFlexibleDate(lastWorkingDay);
    if (!rDate || !lDate) return null;

    const diffDays = Math.floor((lDate.getTime() - rDate.getTime()) / (1000 * 60 * 60 * 24));
    const shortfall = Math.min(60, Math.max(0, 60 - diffDays));
    return {
      servedDays: diffDays,
      shortfallDays: shortfall,
      isSatisfied: diffDays >= 60,
    };
  }, [resignApplyDate, lastWorkingDay]);

  const estimatedDeduction2006 = useMemo(() => {
    if (!calculatedNoticePeriod || !selectedWorker?.basicSalary) return 0;
    if (calculatedNoticePeriod.shortfallDays > 0) {
      return Math.round(calculatedNoticePeriod.shortfallDays * (selectedWorker.basicSalary / 30));
    }
    return 0;
  }, [calculatedNoticePeriod, selectedWorker?.basicSalary]);

  const estimatedServiceBenefit = useMemo(() => {
    if (!selectedWorker?.basicSalary || !calculatedServiceAge?.isValid || calculatedServiceAge.isInverted) {
      return 0;
    }
    const perDayBasic = selectedWorker.basicSalary / 30;
    const years = calculatedServiceAge.years;
    const isOver10 = years > 10 || (years === 10 && (calculatedServiceAge.months > 0 || calculatedServiceAge.days > 0));
    const isOver3 = years > 3 || (years === 3 && (calculatedServiceAge.months > 0 || calculatedServiceAge.days > 0));

    if (isOver10) {
      return Math.round(perDayBasic * (30 * years));
    } else if (isOver3) {
      return Math.round(perDayBasic * (15 * years));
    } else if (years === 3) {
      return Math.round(perDayBasic * (7 * years));
    }
    return 0;
  }, [selectedWorker?.basicSalary, calculatedServiceAge]);

  // Submit resignation information
  const handleSaveResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) {
      setErrorMessage('Please search and select an employee first.');
      return;
    }
    if (!resignApplyDate) {
      setErrorMessage('Please select Resign Apply Date.');
      return;
    }
    if (!lastWorkingDay) {
      setErrorMessage('Please select Last Working Day.');
      return;
    }

    setIsSubmittingResign(true);
    setErrorMessage('');

    try {
      const res = await recordEmployeeResignation({
        workerId: selectedWorker.id,
        resignApplyDate,
        lastWorkingDay,
        remarks: remarks.trim() || undefined,
      });

      if (!res.success || !res.settlementId) {
        setErrorMessage(res.error || 'Failed to save resignation details.');
      } else {
        if (res.settlement) {
          setSettlements(prev => {
            const withoutCurrent = prev.filter(s => s.id !== res.settlementId);
            return [res.settlement, ...withoutCurrent];
          });
        }
        if (statusFilter === 'APPROVED' || statusFilter === 'PAID') {
          setStatusFilter('ALL');
        }
        setResignationSuccess({
          message: 'Resignation details recorded successfully! Settlement is now PENDING.',
          settlementId: res.settlementId,
          workerName: selectedWorker.name,
        });
        handleResetResignForm();
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while saving.');
    } finally {
      setIsSubmittingResign(false);
    }
  };

  // Quick status update for table rows
  const handleStatusChange = async (settlementId: string, newStatus: 'PENDING' | 'APPROVED' | 'PAID') => {
    const target = settlements.find(s => s.id === settlementId);
    if (!target || target.status === newStatus) return;

    if (newStatus === 'PAID') {
      const confirmMsg = target?.worker?.name
        ? `Marking this settlement as PAID will automatically exit employee ${target.worker.name} (${target.worker.workerId}) and move them to the Employee Recycle Bin.\n\nDo you want to proceed?`
        : 'Marking this settlement as PAID will automatically exit this employee and move them to the Employee Recycle Bin.\n\nDo you want to proceed?';
      if (!window.confirm(confirmMsg)) {
        setRenderNonce(n => n + 1);
        return;
      }
    } else if (target?.status === 'PAID') {
      const confirmMsg = target?.worker?.name
        ? `Reverting this settlement from PAID to ${newStatus} will restore employee ${target.worker.name} back to the active employee directory.\n\nDo you want to proceed?`
        : `Reverting this settlement from PAID to ${newStatus} will restore this employee back to the active employee directory.\n\nDo you want to proceed?`;
      if (!window.confirm(confirmMsg)) {
        setRenderNonce(n => n + 1);
        return;
      }
    }

    try {
      const res = await updateSettlementStatus(settlementId, newStatus);
      if (res.success) {
        setSettlements(prev =>
          prev.map(s => {
            if (s.id !== settlementId) return s;
            return {
              ...s,
              status: newStatus,
              worker: {
                ...s.worker,
                isDeleted: newStatus === 'PAID',
              }
            };
          })
        );
        router.refresh();
      } else {
        alert(res.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDeleteSettlement = async (settlementId: string) => {
    const res = await deleteSettlement(settlementId);
    if (res?.success) {
      setSettlements(prev => prev.filter(s => s.id !== settlementId));
      router.refresh();
    }
    return res;
  };

  // Filtered settlements list
  const filteredSettlements = useMemo(() => {
    return settlements.filter(s => {
      // Status filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }
      // Text search filter
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.trim().toLowerCase();
        const workerName = s.worker?.name?.toLowerCase() || '';
        const workerId = s.worker?.workerId?.toLowerCase() || '';
        const dept = s.worker?.department?.name?.toLowerCase() || '';
        const designation = s.worker?.designation?.toLowerCase() || '';
        const exitStatus = s.worker?.isDeleted ? 'auto exited' : (s.status === 'PAID' ? 'restored' : '');
        return (
          workerName.includes(q) ||
          workerId.includes(q) ||
          dept.includes(q) ||
          designation.includes(q) ||
          exitStatus.includes(q)
        );
      }
      return true;
    });
  }, [settlements, statusFilter, tableSearchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: settlements.length,
      pending: settlements.filter(s => s.status === 'PENDING').length,
      approved: settlements.filter(s => s.status === 'APPROVED').length,
      paid: settlements.filter(s => s.status === 'PAID').length,
    };
  }, [settlements]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settlements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search employees to update resignation dates, track pending settlements, and calculate final benefits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsResignPanelOpen(!isResignPanelOpen);
              if (resignationSuccess) setResignationSuccess(null);
            }}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm transition shadow-sm ${
              isResignPanelOpen
                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <UserMinus size={18} />
            {isResignPanelOpen ? 'Close Resignation Panel' : 'Record Resignation'}
          </button>
          <Link
            href="/settlements/new"
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} /> New Settlement
          </Link>
        </div>
      </div>

      {/* Success Banner (when resignation is recorded) */}
      {resignationSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={22} />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Resignation Recorded for {resignationSuccess.workerName}
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                {resignationSuccess.message} You can now finalize the settlement form with full calculation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/settlements/${resignationSuccess.settlementId}/edit`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <FileText size={16} /> Open Settlement Form <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={() => setResignationSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-md hover:bg-emerald-100 transition"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Record Employee Resignation Section (Collapsible / Prominent Card) */}
      <div className={`transition-all duration-200 ${isResignPanelOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 md:p-8 relative">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <UserMinus size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Record Employee Resignation</h2>
                <p className="text-xs text-gray-500">
                  Search an employee to update Resign Apply Date and Last Working Day. This creates or updates a PENDING settlement.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsResignPanelOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Employee Search (if no employee selected yet) */}
          {!selectedWorker && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Search Employee by Name, Worker ID, or Phone
              </label>
              <div className="relative max-w-2xl">
                <input
                  type="text"
                  placeholder="Type employee name or ID (e.g., EMP-1001)..."
                  value={employeeQuery}
                  onChange={e => setEmployeeQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
                <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                {isSearchingEmployee && (
                  <span className="absolute right-4 top-3.5 text-xs text-gray-400 flex items-center gap-1 font-medium">
                    <RefreshCw className="animate-spin" size={14} /> Searching...
                  </span>
                )}
              </div>

              {employeeResults.length > 0 && (
                <div className="border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto divide-y divide-gray-100 bg-white max-w-2xl z-20 relative">
                  {employeeResults.map(w => (
                    <div
                      key={w.id}
                      onClick={() => handleSelectWorker(w)}
                      className="p-3.5 hover:bg-indigo-50/60 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          {w.name}
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                            ID: {w.workerId}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {w.company?.name || 'MEP'} &bull; {w.department?.name || 'Department'} &bull; {w.designation || 'Staff'}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                        Select &rarr;
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {employeeQuery.trim().length >= 2 && !isSearchingEmployee && employeeResults.length === 0 && (
                <p className="text-xs text-gray-500">No active employees found matching &quot;{employeeQuery}&quot;.</p>
              )}
            </div>
          )}

          {/* Step 2: Selected Employee & Resignation Form */}
          {selectedWorker && (
            <form onSubmit={handleSaveResignation} className="space-y-6">
              {/* Selected Worker Info Card */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                    {selectedWorker.name ? selectedWorker.name.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">{selectedWorker.name}</h3>
                      <span className="bg-indigo-200 text-indigo-900 font-mono text-xs px-2 py-0.5 rounded font-bold">
                        ID: {selectedWorker.workerId}
                      </span>
                      {selectedWorker.grade && (
                        <span className="bg-gray-200 text-gray-800 text-xs px-1.5 py-0.5 rounded font-semibold">
                          Grade: {selectedWorker.grade}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-3">
                      <span><strong>Dept:</strong> {selectedWorker.department?.name || 'N/A'}</span>
                      <span><strong>Desig:</strong> {selectedWorker.designation || 'N/A'}</span>
                      <span><strong>Join Date:</strong> {formatDate(selectedWorker.joinDate)}</span>
                      <span><strong>Basic:</strong> {selectedWorker.basicSalary || 0} BDT</span>
                      <span><strong>Gross:</strong> {selectedWorker.grossSalary || 0} BDT</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetResignForm}
                  className="text-xs text-indigo-700 hover:text-indigo-900 font-bold bg-white px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition self-start md:self-center"
                >
                  Change Employee
                </button>
              </div>

              {/* Resignation Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Resign Apply Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={resignApplyDate}
                    onChange={e => setResignApplyDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    The official date the resignation letter was submitted.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Last Working Day <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={lastWorkingDay}
                    onChange={e => setLastWorkingDay(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    The final working date for employment release.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Resignation Remarks / Reason <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Higher studies, Personal reasons, Relocation..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              {/* Dynamic Calculations Live Preview */}
              {(calculatedServiceAge || calculatedPayrollCycle || calculatedNoticePeriod) && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Live Calculation Preview
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Service Age */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-500 block font-medium">Service Age</span>
                      <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                        {calculatedServiceAge?.isValid ? calculatedServiceAge.text : 'Pending dates...'}
                      </span>
                      {calculatedServiceAge?.isInverted && (
                        <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">
                          ⚠️ Last working day precedes join date
                        </span>
                      )}
                    </div>

                    {/* Payroll Cycle */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-500 block font-medium">Salary Month Cycle (26th - 25th)</span>
                      <span className="text-sm font-bold text-indigo-700 mt-0.5 block">
                        {calculatedPayrollCycle ? (
                          <>
                            🗓️ {calculatedPayrollCycle.monthName} ({calculatedPayrollCycle.daysInCycle} Days)
                          </>
                        ) : (
                          'Pending Last Working Day...'
                        )}
                      </span>
                      {calculatedPayrollCycle && (
                        <span className="text-[11px] text-gray-500 block mt-0.5">
                          {formatDate(calculatedPayrollCycle.cycleStart)} to {formatDate(calculatedPayrollCycle.cycleEnd)}
                        </span>
                      )}
                    </div>

                    {/* Notice Period Status */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-500 block font-medium">Notice Period (60d standard)</span>
                      {calculatedNoticePeriod ? (
                        calculatedNoticePeriod.isSatisfied ? (
                          <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                            ✅ Full Notice Served ({calculatedNoticePeriod.servedDays}d)
                          </span>
                        ) : (
                          <div>
                            <span className="text-sm font-bold text-red-600 mt-0.5 block">
                              ⚠️ Shortfall: {calculatedNoticePeriod.shortfallDays} Days
                            </span>
                            <span className="text-[11px] text-red-500 block mt-0.5">
                              Act 2006 Est: ~{estimatedDeduction2006.toLocaleString()} BDT
                            </span>
                          </div>
                        )
                      ) : (
                        <span className="text-sm font-bold text-gray-400 mt-0.5 block">Pending dates...</span>
                      )}
                    </div>
                  </div>

                  {/* Summary estimated pay & status */}
                  <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-gray-600 border-t border-gray-200">
                    <div>
                      <span>Estimated Service Benefit: <strong>{estimatedServiceBenefit.toLocaleString()} BDT</strong></span>
                      <span className="mx-2">&bull;</span>
                      <span>Notice Shortfall Deduction: <strong className="text-red-600">-{estimatedDeduction2006.toLocaleString()} BDT</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>Initial Status:</span>
                      <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded-full text-[11px]">
                        PENDING
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleResetResignForm}
                  className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResign}
                  className={`px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm flex items-center gap-2 ${
                    isSubmittingResign ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmittingResign ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Saving Resignation...
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} /> Save Resignation & Mark Pending
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Settlements Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Controls: Filter Tabs & Search */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Settlements
              <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {counts.all}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-yellow-800 shadow-sm'
                  : 'text-gray-600 hover:text-yellow-700'
              }`}
            >
              Pending
              <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {counts.pending}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'APPROVED'
                  ? 'bg-white text-green-800 shadow-sm'
                  : 'text-gray-600 hover:text-green-700'
              }`}
            >
              Approved
              <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {counts.approved}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAID')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'PAID'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-gray-600 hover:text-blue-700'
              }`}
            >
              Paid
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {counts.paid}
              </span>
            </button>
          </div>

          {/* Search within table */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Filter by name, ID, or dept..."
              value={tableSearchQuery}
              onChange={e => setTableSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-xl pl-9 pr-8 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            {tableSearchQuery && (
              <button
                type="button"
                onClick={() => setTableSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Resignation Dates</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Salary Month</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSettlements.map(settlement => {
                const cycle = settlement.lastWorkingDay ? getPayrollCycleDays(settlement.lastWorkingDay) : null;
                const isPending = settlement.status === 'PENDING';

                return (
                  <tr
                    key={settlement.id}
                    onClick={() => router.push(`/settlements/${settlement.id}/edit`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition group"
                  >
                    {/* Employee Info */}
                    <td className="p-4">
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition flex items-center gap-1.5 flex-wrap">
                        {settlement.worker.name}
                        {isPending && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                            Action Needed
                          </span>
                        )}
                        {settlement.worker?.isDeleted ? (
                          <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold" title="Employee exited and moved to Recycle Bin">
                            Auto Exited
                          </span>
                        ) : settlement.status === 'PAID' ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold" title="Employee restored to active directory">
                            Restored (Active)
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        ID: {settlement.worker.workerId}
                        {settlement.worker.department?.name && (
                          <span className="font-sans text-gray-400"> &bull; {settlement.worker.department.name}</span>
                        )}
                      </div>
                    </td>

                    {/* Resignation Dates */}
                    <td className="p-4">
                      {settlement.resignApplyDate || settlement.lastWorkingDay ? (
                        <div className="text-xs space-y-0.5">
                          {settlement.resignApplyDate && (
                            <div className="text-gray-600">
                              <span className="text-gray-400 font-medium">Resign:</span> {formatDate(settlement.resignApplyDate)}
                            </div>
                          )}
                          {settlement.lastWorkingDay && (
                            <div className="text-gray-800 font-medium">
                              <span className="text-gray-400 font-normal">Last Day:</span> {formatDate(settlement.lastWorkingDay)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* Salary Month */}
                    <td className="p-4">
                      {cycle ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-800"
                          title={`${formatDate(cycle.cycleStart)} to ${formatDate(cycle.cycleEnd)}`}
                        >
                          🗓️ {cycle.monthName} ({cycle.daysInCycle}d)
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="p-4 font-bold text-gray-900 text-sm">
                      {(settlement.totalPayAmount ?? 0).toFixed(2)} BDT
                    </td>

                    {/* Status Badge */}
                    <td className="p-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settlement.status}
                          onChange={e => handleStatusChange(settlement.id, e.target.value as any)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            settlement.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : settlement.status === 'PAID'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="PAID">PAID</option>
                        </select>
                      </div>
                    </td>

                    {/* Date Created */}
                    <td className="p-4 text-xs text-gray-500 font-medium">
                      {formatDate(settlement.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2.5">
                        {isPending ? (
                          <Link
                            href={`/settlements/${settlement.id}/edit`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                            title="Open settlement form to finalize calculation"
                          >
                            <FileText size={13} /> Complete Form
                          </Link>
                        ) : (
                          <Link
                            href={`/settlements/${settlement.id}/edit`}
                            className="text-xs font-bold text-gray-700 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition"
                          >
                            Edit
                          </Link>
                        )}

                        <Link
                          href={`/settlements/${settlement.id}`}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                        >
                          <Printer size={13} /> Print
                        </Link>

                        <DeleteSettlementButton id={settlement.id} onDelete={handleDeleteSettlement} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSettlements.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <FileText size={24} />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No settlements found.</p>
                      <p className="text-xs text-gray-400">
                        {tableSearchQuery
                          ? 'Try adjusting your search query.'
                          : 'Use "Record Resignation" or "New Settlement" above to get started.'}
                      </p>
                      {!isResignPanelOpen && (
                        <button
                          type="button"
                          onClick={() => setIsResignPanelOpen(true)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg transition mt-2"
                        >
                          Record Employee Resignation
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
