'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardCheck, 
  Calendar, 
  CalendarCheck,
  Filter, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CalendarDays, 
  Palmtree, 
  AlertCircle,
  FileText,
  User,
  Building2,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { applyLeaveRequest, updateLeaveStatus, addHoliday, deleteHoliday } from './actions';

interface AttendanceRecord {
  id: string;
  status: string;
  date: string;
  worker?: {
    id: string;
    workerId: string;
    name: string;
    company?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface LeaveRequestItem {
  id: string;
  workerId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  rejectionReason: string | null;
  approvedBy: string | null;
  createdAt: string;
  worker?: {
    id: string;
    workerId: string;
    name: string;
    company?: { id: string; name: string } | null;
    department?: { id: string; name: string } | null;
  } | null;
}

interface HolidayItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: string;
  companyId: string | null;
  company?: { id: string; name: string } | null;
  description: string | null;
}

interface WorkerSimple {
  id: string;
  workerId: string;
  name: string;
  company?: { id: string; name: string } | null;
}

interface Props {
  initialDate: string;
  attendances: AttendanceRecord[];
  leaveRequests: LeaveRequestItem[];
  holidays: HolidayItem[];
  workers: WorkerSimple[];
  companies: { id: string; name: string }[];
  statutoryLedger: {
    workerId: string;
    empId: string;
    name: string;
    companyName: string;
    casualTaken: number;
    sickTaken: number;
    earnedTaken: number;
  }[];
}

export default function AttendanceClient({
  initialDate,
  attendances,
  leaveRequests,
  holidays,
  workers,
  companies,
  statutoryLedger,
}: Props) {
  const [activeTab, setActiveTab] = useState<'daily' | 'leaves' | 'holidays'>('daily');
  const [filterDate, setFilterDate] = useState(initialDate);

  // Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveWorkerSearch, setLeaveWorkerSearch] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  // Holiday Modal
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);

  // Status Action Loading
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);

  // Filtered workers for leave modal search
  const filteredWorkersForLeave = workers.filter(w => 
    w.name.toLowerCase().includes(leaveWorkerSearch.toLowerCase()) ||
    w.workerId.toLowerCase().includes(leaveWorkerSearch.toLowerCase())
  );

  const selectedWorkerObj = workers.find(w => w.id === selectedWorkerId);

  // Counts
  const pendingLeavesCount = leaveRequests.filter(l => l.status === 'PENDING').length;
  const approvedLeavesCount = leaveRequests.filter(l => l.status === 'APPROVED').length;

  const handleApplyLeave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLeaveLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('workerId', selectedWorkerId);

    const res = await applyLeaveRequest(formData);
    setLeaveLoading(false);
    if (res.success) {
      setIsLeaveModalOpen(false);
      setSelectedWorkerId('');
      setLeaveWorkerSearch('');
      window.location.reload();
    } else {
      alert(res.error || 'Failed to submit leave request');
    }
  };

  const handleLeaveDecision = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    let reason = '';
    if (status === 'REJECTED') {
      const input = prompt('Please enter rejection remarks (optional):');
      if (input === null) return;
      reason = input;
    }

    setProcessingLeaveId(leaveId);
    const res = await updateLeaveStatus(leaveId, status, reason);
    setProcessingLeaveId(null);

    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || 'Failed to update leave request');
    }
  };

  const handleAddHoliday = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHolidayLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addHoliday(formData);
    setHolidayLoading(false);

    if (res.success) {
      setIsHolidayModalOpen(false);
      window.location.reload();
    } else {
      alert(res.error || 'Failed to add holiday');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to remove this factory holiday?')) return;
    const res = await deleteHoliday(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || 'Failed to delete holiday');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Time &amp; Attendance Module</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance &amp; Leave System</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage daily employee attendance, statutory leaves (CL/SL/EL), and factory holiday calendar
          </p>
        </div>

        {/* Tab-specific actions */}
        <div className="flex items-center gap-3">
          {activeTab === 'daily' && (
            <Link 
              href="/attendance/mark" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20"
            >
              <ClipboardCheck size={18} /> Mark Attendance
            </Link>
          )}
          {activeTab === 'leaves' && (
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20"
            >
              <Plus size={18} /> Apply for Leave
            </button>
          )}
          {activeTab === 'holidays' && (
            <button
              onClick={() => setIsHolidayModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20"
            >
              <Plus size={18} /> Add Factory Holiday
            </button>
          )}
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 glass-card bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-glass w-fit">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeTab === 'daily'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <CalendarCheck size={16} />
          <span>Daily Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeTab === 'leaves'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Palmtree size={16} />
          <span>Leave Requests &amp; Entitlement</span>
          {pendingLeavesCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full">
              {pendingLeavesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeTab === 'holidays'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 translate-y-[-1px]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <CalendarDays size={16} />
          <span>Factory Holiday Calendar</span>
        </button>
      </div>

      {/* TAB 1: DAILY ATTENDANCE */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Filter */}
          <div className="glass-card rounded-2xl shadow-sm border border-white/70 p-4 sm:p-5 flex flex-wrap gap-4 items-end">
            <form className="flex flex-wrap gap-4 items-end w-full" method="GET">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-600" />
                  <span>Select Date</span>
                </label>
                <input 
                  type="date" 
                  name="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-xs"
                />
              </div>
              <button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Filter size={14} /> Filter Date
              </button>
            </form>
          </div>

          {/* Attendance Table */}
          <div className="glass-table-container rounded-2xl shadow-sm border border-white/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Company</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 bg-white/40">
                  {attendances.map((record) => {
                    let statusBadge = "bg-slate-100 text-slate-800 border-slate-200";
                    if (record.status === "PRESENT") statusBadge = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
                    if (record.status === "ABSENT") statusBadge = "bg-rose-50 text-rose-800 border-rose-200/80";
                    if (record.status === "LATE") statusBadge = "bg-amber-50 text-amber-800 border-amber-200/80";
                    if (record.status === "LEAVE") statusBadge = "bg-blue-50 text-blue-800 border-blue-200/80";

                    return (
                      <tr key={record.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">{record.worker?.workerId || '-'}</td>
                        <td className="p-4 font-semibold text-slate-800">{record.worker?.name || '-'}</td>
                        <td className="p-4 text-slate-600">{record.worker?.company?.name || '-'}</td>
                        <td className="p-4">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border shadow-xs ${statusBadge}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {attendances.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-500 font-medium">
                        No attendance records logged for {filterDate}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE REQUESTS & ENTITLEMENT LEDGER */}
      {activeTab === 'leaves' && (
        <div className="space-y-8">
          {/* Statutory Quota Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Pending Approval</span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{pendingLeavesCount}</div>
              <div className="text-xs text-slate-400 mt-1">Awaiting management action</div>
            </div>

            <div className="glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Approved Leaves</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{approvedLeavesCount}</div>
              <div className="text-xs text-slate-400 mt-1">Synced to daily attendance</div>
            </div>

            <div className="glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Statutory Casual (CL)</span>
                <Palmtree size={16} className="text-blue-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">10 Days / Yr</div>
              <div className="text-xs text-slate-400 mt-1">Labor Act statutory quota</div>
            </div>

            <div className="glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Statutory Sick (SL)</span>
                <FileText size={16} className="text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">14 Days / Yr</div>
              <div className="text-xs text-slate-400 mt-1">Labor Act medical quota</div>
            </div>
          </div>

          {/* Pending & Recent Leave Requests Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Leave Requests &amp; Status</h2>
              <span className="text-xs text-slate-500">Auto-marks Attendance upon Approval</span>
            </div>

            <div className="glass-table-container rounded-2xl shadow-sm border border-white/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Leave Type</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Days</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 bg-white/40">
                    {leaveRequests.map((leave) => {
                      let statusBadge = "bg-amber-50 text-amber-800 border-amber-200";
                      if (leave.status === 'APPROVED') statusBadge = "bg-emerald-50 text-emerald-800 border-emerald-200";
                      if (leave.status === 'REJECTED') statusBadge = "bg-rose-50 text-rose-800 border-rose-200";

                      return (
                        <tr key={leave.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{leave.worker?.name || '-'}</div>
                            <div className="text-[11px] text-slate-500 font-mono">ID: {leave.worker?.workerId} • {leave.worker?.company?.name}</div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 text-[11px]">
                              {leave.leaveType}
                            </span>
                          </td>
                          <td className="p-4 text-slate-700 font-medium">
                            {formatDate(leave.startDate)} &rarr; {formatDate(leave.endDate)}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-900">{leave.days} d</td>
                          <td className="p-4 text-slate-600 max-w-xs truncate" title={leave.reason || ''}>
                            {leave.reason || 'No reason specified'}
                          </td>
                          <td className="p-4">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border shadow-xs ${statusBadge}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {leave.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleLeaveDecision(leave.id, 'APPROVED')}
                                  disabled={processingLeaveId === leave.id}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                                >
                                  <CheckCircle2 size={13} /> Approve
                                </button>
                                <button
                                  onClick={() => handleLeaveDecision(leave.id, 'REJECTED')}
                                  disabled={processingLeaveId === leave.id}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                {leave.status === 'APPROVED' ? `By ${leave.approvedBy || 'Admin'}` : (leave.rejectionReason || 'Rejected')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {leaveRequests.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-500 font-medium">
                          No leave requests found. Click &quot;Apply for Leave&quot; above to submit one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Statutory Entitlement Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Statutory Entitlement Ledger</h2>
                <p className="text-xs text-slate-500">Bangladesh Labor Act 2006 statutory quotas: Casual (10), Sick (14), Earned (18)</p>
              </div>
            </div>

            <div className="glass-table-container rounded-2xl shadow-sm border border-white/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200/70 text-slate-600 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Company</th>
                      <th className="p-4 text-center">Casual Leave (CL) [10d]</th>
                      <th className="p-4 text-center">Sick Leave (SL) [14d]</th>
                      <th className="p-4 text-center">Earned Leave (EL) [18d]</th>
                      <th className="p-4 text-center">Total Balance Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 bg-white/40">
                    {statutoryLedger.map((row) => {
                      const clRemain = Math.max(0, 10 - row.casualTaken);
                      const slRemain = Math.max(0, 14 - row.sickTaken);
                      const elRemain = Math.max(0, 18 - row.earnedTaken);
                      const totalRemain = clRemain + slRemain + elRemain;

                      return (
                        <tr key={row.workerId} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{row.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">ID: {row.empId}</div>
                          </td>
                          <td className="p-4 text-slate-600">{row.companyName}</td>
                          <td className="p-4 text-center">
                            <span className="font-semibold text-slate-800">{row.casualTaken} taken</span>
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="text-emerald-700 font-bold">{clRemain} left</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-semibold text-slate-800">{row.sickTaken} taken</span>
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="text-emerald-700 font-bold">{slRemain} left</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-semibold text-slate-800">{row.earnedTaken} taken</span>
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="text-emerald-700 font-bold">{elRemain} left</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-extrabold text-xs">
                              {totalRemain} Days
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {statutoryLedger.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500 font-medium">
                          No workers available in the statutory ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FACTORY HOLIDAY CALENDAR */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Official Factory Holidays &amp; Rest Days</h2>
              <p className="text-xs text-slate-500">Government gazette holidays and factory-wide rest days</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {holidays.map((hol) => (
              <div
                key={hol.id}
                className="glass-card bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-glass flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-slate-900 text-base">{hol.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                      {hol.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                    {hol.description || 'Gazetted holiday observed across factory.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-600" />
                    <span>{formatDate(hol.startDate)} &rarr; {formatDate(hol.endDate)}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(hol.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Holiday"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {holidays.length === 0 && (
              <div className="col-span-full glass-card p-12 text-center rounded-3xl border border-white/70">
                <CalendarDays size={40} className="text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">No Holidays Configured</h3>
                <p className="text-xs text-slate-400 mb-4">Click &quot;Add Factory Holiday&quot; above to add upcoming public or factory holidays.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: APPLY FOR LEAVE */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Palmtree size={18} className="text-blue-600" /> Apply for Statutory Leave
              </h3>
              <button 
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 mt-4">
              {/* Select Employee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Employee *</label>
                {!selectedWorkerId ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search employee by name or ID..."
                      value={leaveWorkerSearch}
                      onChange={(e) => setLeaveWorkerSearch(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                      {filteredWorkersForLeave.slice(0, 10).map((w) => (
                        <div
                          key={w.id}
                          onClick={() => setSelectedWorkerId(w.id)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center"
                        >
                          <span className="font-semibold text-slate-800">{w.name} ({w.workerId})</span>
                          <span className="text-[11px] text-slate-500">{w.company?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-xs font-bold text-blue-900">
                      {selectedWorkerObj?.name} <span className="text-blue-600 font-mono">({selectedWorkerObj?.workerId})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedWorkerId('')}
                      className="text-xs text-blue-700 hover:text-rose-600 font-semibold"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Leave Type *</label>
                <select
                  name="leaveType"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-medium"
                >
                  <option value="CASUAL">Casual Leave (CL - 10 Days Statutory)</option>
                  <option value="SICK">Sick Leave (SL - 14 Days Statutory)</option>
                  <option value="EARNED">Earned Leave (EL - 18 Days Statutory)</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="OTHER">Special / Other Leave</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Reason / Remarks</label>
                <textarea
                  name="reason"
                  rows={2}
                  placeholder="State reason for leave..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedWorkerId || leaveLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {leaveLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FACTORY HOLIDAY */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-modal bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-600" /> Add Factory Holiday
              </h3>
              <button 
                onClick={() => setIsHolidayModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Holiday Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Eid-ul-Fitr, May Day, Rest Day"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Holiday Type *</label>
                  <select
                    name="type"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="PUBLIC">Public Holiday</option>
                    <option value="FESTIVAL">Festival Holiday</option>
                    <option value="REST_DAY">Weekly Rest Day</option>
                    <option value="SPECIAL">Special Factory Holiday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Factory / Company</label>
                  <select
                    name="companyId"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="">All Companies / Factory-wide</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Optional details or gazette reference..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={holidayLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {holidayLoading ? 'Saving...' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
