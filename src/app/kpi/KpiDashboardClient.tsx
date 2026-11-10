'use client';

import React, { useState, useMemo, useTransition } from 'react';
import {
  Target,
  Award,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  Check,
  X,
  Printer,
  Download,
  KeyRound,
  UserCheck,
  Sliders,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import {
  assignSupervisor,
  bulkAssignSupervisor,
  createKpiTarget,
  updateKpiTarget,
  deleteKpiTarget,
  submitEmployeeAchievement,
  evaluateKpiTarget,
  changeKpiPassword,
  resetKpiPasswordToDefault,
} from './actions';

interface KpiDashboardClientProps {
  user: any;
  currentWorker: any;
  initialWorkers: any[];
  initialSubordinates: any[];
  initialTargets: any[];
  departments: any[];
}

export default function KpiDashboardClient({
  user,
  currentWorker,
  initialWorkers,
  initialSubordinates,
  initialTargets,
  departments,
}: KpiDashboardClientProps) {
  const [isPending, startTransition] = useTransition();

  const realRole = user.role;
  const isAdmin = realRole === 'SUPER_ADMIN' || realRole === 'ADMIN';

  // Role switcher for Admin preview
  const [previewRole, setPreviewRole] = useState<'ADMIN' | 'KPI_SUPERVISOR' | 'KPI_WORKER'>(
    isAdmin ? 'ADMIN' : (realRole as 'KPI_SUPERVISOR' | 'KPI_WORKER')
  );

  const activeRole = isAdmin ? previewRole : realRole;

  // Active Tab state
  // Supervisor tabs: 'MY_KPI' | 'TEAM_TARGETS' | 'EVALUATION' | 'MATRIX'
  // Admin tabs: 'OVERVIEW' | 'ALL_TARGETS' | 'SUPERVISORS' | 'NEW_TARGET'
  const [activeTab, setActiveTab] = useState<string>(
    activeRole === 'ADMIN'
      ? 'OVERVIEW'
      : activeRole === 'KPI_SUPERVISOR'
      ? 'TEAM_TARGETS'
      : 'MY_KPI'
  );

  // Period Filter
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedSubordinateId, setSelectedSubordinateId] = useState('ALL');

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [targetToSubmit, setTargetToSubmit] = useState<any>(null);
  const [actualValueInput, setActualValueInput] = useState<number | string>('');
  const [progressPercentInput, setProgressPercentInput] = useState<number>(0);
  const [employeeNotesInput, setEmployeeNotesInput] = useState<string>('');

  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [targetToEvaluate, setTargetToEvaluate] = useState<any>(null);
  const [evalScoreInput, setEvalScoreInput] = useState<number>(85);
  const [evalRatingInput, setEvalRatingInput] = useState<string>('GOOD');
  const [evalFeedbackInput, setEvalFeedbackInput] = useState<string>('');
  const [evalStatusInput, setEvalStatusInput] = useState<string>('APPROVED');

  const [isCreateTargetModalOpen, setIsCreateTargetModalOpen] = useState(false);
  const [newTargetWorkerId, setNewTargetWorkerId] = useState<string>('');
  const [newTargetPeriod, setNewTargetPeriod] = useState<string>('November 2026');
  const [newTargetTitle, setNewTargetTitle] = useState<string>('');
  const [newTargetCategory, setNewTargetCategory] = useState<string>('OPERATIONAL');
  const [newTargetValue, setNewTargetValue] = useState<string>('');
  const [newTargetUnit, setNewTargetUnit] = useState<string>('%');
  const [newTargetWeightage, setNewTargetWeightage] = useState<number>(20);
  const [newTargetDeadline, setNewTargetDeadline] = useState<string>('');
  const [newTargetDescription, setNewTargetDescription] = useState<string>('');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [selectedWorkerIdsForBulk, setSelectedWorkerIdsForBulk] = useState<string[]>([]);
  const [bulkSupervisorId, setBulkSupervisorId] = useState<string>('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Distinct Periods
  const distinctPeriods = useMemo(() => {
    const set = new Set<string>();
    initialTargets.forEach((t) => {
      if (t.period) set.add(t.period);
    });
    set.add('November 2026');
    set.add('Q4 2026');
    return Array.from(set);
  }, [initialTargets]);

  // Employee KPI targets (where target.workerId === user.id)
  const myTargets = useMemo(() => {
    return initialTargets.filter((t) => t.workerId === (currentWorker?.id || user.id));
  }, [initialTargets, currentWorker, user.id]);

  // Filtered employee targets by period
  const filteredMyTargets = useMemo(() => {
    return myTargets.filter((t) => {
      if (selectedPeriod !== 'ALL' && t.period !== selectedPeriod) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [myTargets, selectedPeriod, statusFilter, categoryFilter]);

  // Metrics for Employee
  const employeeMetrics = useMemo(() => {
    const list = filteredMyTargets;
    const total = list.length;
    const completed = list.filter((t) => t.status === 'APPROVED' || t.status === 'REVIEWED').length;
    const submitted = list.filter((t) => t.status === 'SUBMITTED').length;
    const inProgress = list.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING').length;

    let totalWeightedScore = 0;
    let totalWeight = 0;
    list.forEach((t) => {
      const weight = t.weightage || 0;
      totalWeight += weight;
      if (t.supervisorScore !== null && t.supervisorScore !== undefined) {
        totalWeightedScore += (t.supervisorScore * weight) / 100;
      } else {
        totalWeightedScore += ((t.progressPercent || 0) * weight) / 100;
      }
    });

    const averageScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

    let grade = 'N/A';
    if (total > 0) {
      if (averageScore >= 90) grade = 'A+ (Outstanding)';
      else if (averageScore >= 80) grade = 'A (Excellent)';
      else if (averageScore >= 70) grade = 'B (Good)';
      else if (averageScore >= 50) grade = 'C (Average)';
      else grade = 'Needs Improvement';
    }

    return { total, completed, submitted, inProgress, averageScore: Math.round(averageScore), grade };
  }, [filteredMyTargets]);

  // Supervisor subordinates targets
  const subordinatesTargets = useMemo(() => {
    if (isAdmin && activeRole === 'ADMIN') return initialTargets;
    const subIds = new Set(initialSubordinates.map((s) => s.id));
    return initialTargets.filter((t) => subIds.has(t.workerId) || t.supervisorId === user.id);
  }, [initialTargets, initialSubordinates, isAdmin, activeRole, user.id]);

  // Submissions awaiting review
  const pendingReviews = useMemo(() => {
    return subordinatesTargets.filter((t) => t.status === 'SUBMITTED');
  }, [subordinatesTargets]);

  // Filtered Subordinates Targets
  const filteredSubTargets = useMemo(() => {
    return subordinatesTargets.filter((t) => {
      if (selectedPeriod !== 'ALL' && t.period !== selectedPeriod) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (selectedSubordinateId !== 'ALL' && t.workerId !== selectedSubordinateId) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const workerName = t.worker?.name?.toLowerCase() || '';
        const workerId = t.worker?.workerId?.toLowerCase() || '';
        const title = t.title?.toLowerCase() || '';
        if (!workerName.includes(query) && !workerId.includes(query) && !title.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [subordinatesTargets, selectedPeriod, statusFilter, categoryFilter, selectedSubordinateId, searchQuery]);

  // Supervisor Team Performance Matrix
  const teamMatrix = useMemo(() => {
    const map = new Map<string, { worker: any; targets: any[]; totalWeight: number; weightedScore: number }>();

    const targetList = activeRole === 'ADMIN' ? initialTargets : subordinatesTargets;

    targetList.forEach((t) => {
      if (!t.worker) return;
      const wid = t.workerId;
      if (!map.has(wid)) {
        map.set(wid, {
          worker: t.worker,
          targets: [],
          totalWeight: 0,
          weightedScore: 0,
        });
      }
      const entry = map.get(wid)!;
      entry.targets.push(t);
      const w = t.weightage || 0;
      entry.totalWeight += w;
      if (t.supervisorScore !== null && t.supervisorScore !== undefined) {
        entry.weightedScore += (t.supervisorScore * w) / 100;
      } else {
        entry.weightedScore += ((t.progressPercent || 0) * w) / 100;
      }
    });

    return Array.from(map.values()).map((item) => {
      const avg = item.totalWeight > 0 ? (item.weightedScore / item.totalWeight) * 100 : 0;
      const completedCount = item.targets.filter((t) => t.status === 'APPROVED' || t.status === 'REVIEWED').length;
      return {
        worker: item.worker,
        targetCount: item.targets.length,
        completedCount,
        completionRate: item.targets.length > 0 ? Math.round((completedCount / item.targets.length) * 100) : 0,
        averageScore: Math.round(avg),
      };
    }).sort((a, b) => b.averageScore - a.averageScore);
  }, [activeRole, initialTargets, subordinatesTargets]);

  // Handlers
  const handleOpenSubmitModal = (target: any) => {
    setTargetToSubmit(target);
    setActualValueInput(target.actualValue ?? '');
    setProgressPercentInput(target.progressPercent ?? 0);
    setEmployeeNotesInput(target.employeeNotes ?? '');
    setIsSubmitModalOpen(true);
  };

  const handleOpenEvalModal = (target: any) => {
    setTargetToEvaluate(target);
    setEvalScoreInput(target.supervisorScore ?? 85);
    setEvalRatingInput(target.supervisorRating ?? 'GOOD');
    setEvalFeedbackInput(target.supervisorFeedback ?? '');
    setEvalStatusInput(target.status === 'SUBMITTED' ? 'APPROVED' : target.status);
    setIsEvalModalOpen(true);
  };

  const handleSubmitAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetToSubmit) return;

    startTransition(async () => {
      const res = await submitEmployeeAchievement(targetToSubmit.id, {
        actualValue: actualValueInput !== '' ? Number(actualValueInput) : null,
        progressPercent: Number(progressPercentInput),
        employeeNotes: employeeNotesInput,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Self-assessment submitted successfully for review!' });
        setIsSubmitModalOpen(false);
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to submit self-assessment.' });
      }
    });
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetToEvaluate) return;

    startTransition(async () => {
      const res = await evaluateKpiTarget(targetToEvaluate.id, {
        supervisorScore: Number(evalScoreInput),
        supervisorRating: evalRatingInput,
        supervisorFeedback: evalFeedbackInput,
        status: evalStatusInput,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Evaluation finalized and saved successfully!' });
        setIsEvalModalOpen(false);
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to evaluate target.' });
      }
    });
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetTitle || !newTargetWorkerId) {
      setMessage({ type: 'error', text: 'Target Title and Employee are required.' });
      return;
    }

    startTransition(async () => {
      const res = await createKpiTarget({
        workerId: newTargetWorkerId,
        period: newTargetPeriod,
        title: newTargetTitle,
        category: newTargetCategory,
        targetValue: newTargetValue !== '' ? Number(newTargetValue) : null,
        unit: newTargetUnit,
        weightage: Number(newTargetWeightage),
        deadline: newTargetDeadline || null,
        description: newTargetDescription,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'KPI target created and assigned successfully!' });
        setIsCreateTargetModalOpen(false);
        setNewTargetTitle('');
        setNewTargetDescription('');
        setNewTargetValue('');
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to create target.' });
      }
    });
  };

  const handleDeleteTarget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this KPI target?')) return;
    startTransition(async () => {
      const res = await deleteKpiTarget(id);
      if (res.success) {
        setMessage({ type: 'success', text: 'KPI target deleted.' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to delete target.' });
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    startTransition(async () => {
      const res = await changeKpiPassword(oldPassword, newPassword);
      if (res.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordMessage(null);
        }, 1500);
      } else {
        setPasswordMessage({ type: 'error', text: res.error || 'Failed to change password.' });
      }
    });
  };

  const handleSingleAssignSupervisor = async (workerId: string, supervisorId: string | null) => {
    startTransition(async () => {
      const res = await assignSupervisor(workerId, supervisorId);
      if (res.success) {
        setMessage({ type: 'success', text: 'Supervisor assigned successfully!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to assign supervisor.' });
      }
    });
  };

  const handleBulkAssign = async () => {
    if (selectedWorkerIdsForBulk.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one employee.' });
      return;
    }

    startTransition(async () => {
      const res = await bulkAssignSupervisor(selectedWorkerIdsForBulk, bulkSupervisorId || null);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Supervisor successfully assigned to ${res.count} employees!`,
        });
        setIsBulkAssignModalOpen(false);
        setSelectedWorkerIdsForBulk([]);
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to bulk assign supervisor.' });
      }
    });
  };

  const handleResetPassword = async (workerId: string, workerName: string) => {
    if (!confirm(`Reset password for ${workerName} back to their Employee ID?`)) return;
    startTransition(async () => {
      const res = await resetKpiPasswordToDefault(workerId);
      if (res.success) {
        setMessage({ type: 'success', text: `Password for ${workerName} has been reset to their Employee ID.` });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to reset password.' });
      }
    });
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Worker ID',
      'Worker Name',
      'Department',
      'Designation',
      'Supervisor',
      'Period',
      'Category',
      'Title',
      'Target Value',
      'Unit',
      'Weightage %',
      'Status',
      'Actual Value',
      'Progress %',
      'Supervisor Score',
      'Rating',
    ];

    const rows = (activeRole === 'ADMIN' ? initialTargets : filteredSubTargets).map((t) => [
      `"${t.worker?.workerId || ''}"`,
      `"${t.worker?.name || ''}"`,
      `"${t.worker?.department?.name || ''}"`,
      `"${t.worker?.designation || ''}"`,
      `"${t.supervisor?.name || 'Unassigned'}"`,
      `"${t.period || ''}"`,
      `"${t.category || ''}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      t.targetValue ?? '',
      `"${t.unit || ''}"`,
      t.weightage ?? 20,
      `"${t.status}"`,
      t.actualValue ?? '',
      t.progressPercent ?? 0,
      t.supervisorScore ?? '',
      `"${t.supervisorRating || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KPI_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto safe-pb">
      {/* Toast Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl border backdrop-blur-md shadow-lg flex items-center justify-between transition-all ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-800 border-emerald-300'
              : 'bg-rose-500/10 text-rose-800 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            {message.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold tracking-wide uppercase">
              <Sparkles size={13} />
              <span>KPI Performance Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeRole === 'ADMIN'
                ? 'Enterprise KPI Administration'
                : activeRole === 'KPI_SUPERVISOR'
                ? 'Supervisor KPI Management & Team Portal'
                : 'My Performance & KPI Targets'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {activeRole === 'ADMIN'
                ? 'Manage enterprise-wide KPI goals, supervisor assignments, review matrix and organizational performance metrics.'
                : activeRole === 'KPI_SUPERVISOR'
                ? 'Set targets for your direct subordinates, review submitted self-assessments, score achievements, and manage your own performance.'
                : 'Track your assigned targets, enter actual achievements, submit self-evaluations, and view your supervisor ratings.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Admin Role Preview Switcher */}
            {isAdmin && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-2xl flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider pl-2 pr-1">
                  Preview:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRole('ADMIN');
                    setActiveTab('OVERVIEW');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeRole === 'ADMIN'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRole('KPI_SUPERVISOR');
                    setActiveTab('TEAM_TARGETS');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeRole === 'KPI_SUPERVISOR'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRole('KPI_WORKER');
                    setActiveTab('MY_KPI');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeRole === 'KPI_WORKER'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Employee
                </button>
              </div>
            )}

            {/* Change Password for Worker/Supervisor */}
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold backdrop-blur-md transition flex items-center gap-2"
              >
                <KeyRound size={15} />
                <span>Change Password</span>
              </button>
            )}

            {/* Print / Scorecard */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold backdrop-blur-md transition flex items-center gap-2 print:hidden"
            >
              <Printer size={15} />
              <span>Print Scorecard</span>
            </button>
          </div>
        </div>

        {/* Worker/Supervisor Profile strip if logged in as employee */}
        {currentWorker && activeRole !== 'ADMIN' && (
          <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Employee Name &amp; ID</div>
              <div className="text-white font-bold text-sm">
                {currentWorker.name} ({currentWorker.workerId})
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Designation &amp; Dept</div>
              <div className="text-white font-semibold">
                {currentWorker.designation || 'N/A'} - {currentWorker.department?.name || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Direct Supervisor</div>
              <div className="text-amber-300 font-semibold">
                {currentWorker.supervisor ? (
                  `${currentWorker.supervisor.name} (${currentWorker.supervisor.workerId})`
                ) : (
                  <span className="text-slate-400 italic">Not Assigned</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Portal Access Level</div>
              <div className="text-emerald-400 font-bold uppercase tracking-wider">
                {activeRole === 'KPI_SUPERVISOR' ? 'Supervisor Portal' : 'Employee Portal'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {/* Employee Tabs */}
          {activeRole === 'KPI_WORKER' && (
            <button
              type="button"
              onClick={() => setActiveTab('MY_KPI')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'MY_KPI'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
              }`}
            >
              <Target size={16} />
              <span>My KPI Goals &amp; Scorecard</span>
            </button>
          )}

          {/* Supervisor Tabs */}
          {activeRole === 'KPI_SUPERVISOR' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('TEAM_TARGETS')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'TEAM_TARGETS'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                <Users size={16} />
                <span>Team Targets ({subordinatesTargets.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('EVALUATION')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'EVALUATION'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                <Award size={16} />
                <span>Pending Reviews ({pendingReviews.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MY_KPI')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'MY_KPI'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                <Target size={16} />
                <span>My Self KPI ({myTargets.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MATRIX')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'MATRIX'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                <BarChart3 size={16} />
                <span>Performance Matrix</span>
              </button>
            </>
          )}

          {/* Admin Tabs */}
          {activeRole === 'ADMIN' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                <BarChart3 size={16} />
                <span>Enterprise Overview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ALL_TARGETS')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'ALL_TARGETS'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                <Target size={16} />
                <span>All Targets ({initialTargets.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SUPERVISORS')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'SUPERVISORS'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                <UserCheck size={16} />
                <span>Supervisor Assignment ({initialWorkers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MATRIX')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'MATRIX'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200'
                }`}
              >
                <TrendingUp size={16} />
                <span>Performance Ranking</span>
              </button>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {(activeRole === 'ADMIN' || activeRole === 'KPI_SUPERVISOR') && (
            <button
              type="button"
              onClick={() => {
                setNewTargetWorkerId(
                  activeRole === 'KPI_SUPERVISOR' && initialSubordinates.length > 0
                    ? initialSubordinates[0].id
                    : ''
                );
                setIsCreateTargetModalOpen(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <Plus size={16} />
              <span>Set New KPI Target</span>
            </button>
          )}

          {(activeRole === 'ADMIN' || activeRole === 'KPI_SUPERVISOR') && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 transition"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: EMPLOYEE / MY SELF KPI VIEW                  */}
      {/* ======================================================== */}
      {activeTab === 'MY_KPI' && (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="glass-card p-4 rounded-2xl border border-white/60 shadow-xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Total Assigned</div>
              <div className="text-2xl font-extrabold text-slate-900">{employeeMetrics.total}</div>
              <div className="text-[11px] text-slate-500 mt-1">Weighted Goals</div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/60 shadow-xs">
              <div className="text-amber-500 text-xs font-semibold mb-1">In Progress</div>
              <div className="text-2xl font-extrabold text-amber-600">{employeeMetrics.inProgress}</div>
              <div className="text-[11px] text-slate-500 mt-1">Pending submission</div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/60 shadow-xs">
              <div className="text-blue-500 text-xs font-semibold mb-1">Submitted</div>
              <div className="text-2xl font-extrabold text-blue-600">{employeeMetrics.submitted}</div>
              <div className="text-[11px] text-slate-500 mt-1">Under supervisor review</div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/60 shadow-xs">
              <div className="text-emerald-500 text-xs font-semibold mb-1">Approved / Evaluated</div>
              <div className="text-2xl font-extrabold text-emerald-600">{employeeMetrics.completed}</div>
              <div className="text-[11px] text-slate-500 mt-1">Finalized scores</div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/60 shadow-xs">
              <div className="text-indigo-500 text-xs font-semibold mb-1">Weighted Score</div>
              <div className="text-2xl font-extrabold text-indigo-600">{employeeMetrics.averageScore}%</div>
              <div className="text-[11px] text-slate-500 mt-1">Overall completion</div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/60 shadow-xs bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="text-amber-700 text-xs font-semibold mb-1">Performance Grade</div>
              <div className="text-xl font-extrabold text-amber-800">{employeeMetrics.grade}</div>
              <div className="text-[10px] text-amber-600 mt-1 font-medium">Standard MEP Scale</div>
            </div>
          </div>

          {/* Period selector & filter bar */}
          <div className="glass-card p-3.5 rounded-2xl border border-white/70 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400 ml-1" />
              <span className="text-xs font-bold text-slate-700">Period:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white/90 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="ALL">All Periods</option>
                {distinctPeriods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/90 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved / Finalized</option>
                <option value="REVISION_REQUESTED">Revision Requested</option>
              </select>
            </div>
          </div>

          {/* Targets Table / Cards */}
          {filteredMyTargets.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-3xl border border-white/80 space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Target size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No KPI Targets Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are no KPI targets assigned for the selected criteria. Your supervisor will assign targets soon.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMyTargets.map((target) => {
                const isFinalized = target.status === 'APPROVED' || target.status === 'REVIEWED';
                const isSubmitted = target.status === 'SUBMITTED';

                return (
                  <div
                    key={target.id}
                    className="glass-card p-5 sm:p-6 rounded-3xl border border-white/80 shadow-md hover:shadow-lg transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {target.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Period: {target.period}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Weight: {target.weightage}%
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{target.title}</h3>
                        {target.description && (
                          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                            {target.description}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 ${
                            target.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : target.status === 'SUBMITTED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : target.status === 'REVISION_REQUESTED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {target.status === 'APPROVED' ? (
                            <CheckCircle2 size={13} />
                          ) : target.status === 'SUBMITTED' ? (
                            <Clock size={13} />
                          ) : (
                            <Sliders size={13} />
                          )}
                          <span>{target.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Target & Achievement Progress Bar */}
                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-slate-400 font-medium">Target Benchmark</div>
                          <div className="font-bold text-slate-800 text-sm">
                            {target.targetValue !== null ? `${target.targetValue} ${target.unit || ''}` : 'Qualitative'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">My Actual Value</div>
                          <div className="font-bold text-slate-900 text-sm">
                            {target.actualValue !== null ? `${target.actualValue} ${target.unit || ''}` : '--'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Progress Achieved</div>
                          <div className="font-bold text-amber-600 text-sm">{target.progressPercent}%</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Supervisor Score</div>
                          <div className="font-bold text-indigo-700 text-sm">
                            {target.supervisorScore !== null ? `${target.supervisorScore} / 100` : 'Pending'}
                          </div>
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              target.progressPercent >= 100
                                ? 'bg-emerald-500'
                                : target.progressPercent >= 75
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, target.progressPercent))}%` }}
                          />
                        </div>
                      </div>

                      {/* Employee Self Notes */}
                      {target.employeeNotes && (
                        <div className="text-xs bg-white p-3 rounded-xl border border-slate-200/70">
                          <span className="font-bold text-slate-700">My Self Notes: </span>
                          <span className="text-slate-600">{target.employeeNotes}</span>
                        </div>
                      )}

                      {/* Supervisor Feedback if evaluated */}
                      {target.supervisorFeedback && (
                        <div className="text-xs bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-0.5">
                            <Award size={13} className="text-indigo-600" />
                            <span>
                              Supervisor Feedback ({target.supervisorRating || 'Evaluated'} - {target.supervisorScore} pts):
                            </span>
                          </div>
                          <div className="text-indigo-800">{target.supervisorFeedback}</div>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-slate-400">
                        {target.deadline ? `Deadline: ${new Date(target.deadline).toLocaleDateString()}` : 'No deadline'}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSubmitModal(target)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
                        >
                          <Send size={14} />
                          <span>{target.status === 'SUBMITTED' ? 'Update Submission' : 'Submit Achievement'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: SUPERVISOR TEAM TARGETS VIEW                  */}
      {/* ======================================================== */}
      {activeTab === 'TEAM_TARGETS' && (
        <div className="space-y-6">
          {/* Subordinate Selector & Search Filter */}
          <div className="glass-card p-4 rounded-3xl border border-white/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search subordinate or target..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 w-60"
                />
              </div>

              {/* Subordinate filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Subordinate:</span>
                <select
                  value={selectedSubordinateId}
                  onChange={(e) => setSelectedSubordinateId(e.target.value)}
                  className="bg-white/90 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 max-w-xs"
                >
                  <option value="ALL">All Subordinates ({initialSubordinates.length})</option>
                  {initialSubordinates.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.workerId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Period filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Period:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-white/90 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="ALL">All Periods</option>
                  {distinctPeriods.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewTargetWorkerId(
                  selectedSubordinateId !== 'ALL'
                    ? selectedSubordinateId
                    : initialSubordinates[0]?.id || ''
                );
                setIsCreateTargetModalOpen(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <Plus size={16} />
              <span>Set Target for Subordinate</span>
            </button>
          </div>

          {/* Subordinates Quick List Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {initialSubordinates.map((sub) => {
              const subTargetCount = subordinatesTargets.filter((t) => t.workerId === sub.id).length;
              const subPendingReviewCount = subordinatesTargets.filter(
                (t) => t.workerId === sub.id && t.status === 'SUBMITTED'
              ).length;

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubordinateId(sub.id)}
                  className={`glass-card p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedSubordinateId === sub.id
                      ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40'
                      : 'border-white/70 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-slate-900 truncate">{sub.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      ID: {sub.workerId}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mb-2">
                    {sub.designation || 'Staff'} • {sub.department?.name || 'Operations'}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                    <span className="text-slate-600 font-medium">Targets: {subTargetCount}</span>
                    {subPendingReviewCount > 0 && (
                      <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                        {subPendingReviewCount} to review
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subordinates Targets List */}
          <div className="glass-card rounded-3xl border border-white/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200/80 bg-white/40 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Subordinate KPI Targets ({filteredSubTargets.length})
              </h3>
            </div>

            {filteredSubTargets.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No targets found for the selected subordinate or filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3.5">Employee</th>
                      <th className="p-3.5">Title &amp; Category</th>
                      <th className="p-3.5">Benchmark</th>
                      <th className="p-3.5">Weight</th>
                      <th className="p-3.5">Progress</th>
                      <th className="p-3.5">Score</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredSubTargets.map((target) => (
                      <tr key={target.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{target.worker?.name}</div>
                          <div className="text-[11px] text-slate-400">ID: {target.worker?.workerId}</div>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">{target.title}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {target.category} • {target.period}
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {target.targetValue !== null ? `${target.targetValue} ${target.unit || ''}` : '--'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-bold text-indigo-600">
                          {target.weightage}%
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{ width: `${target.progressPercent}%` }}
                              />
                            </div>
                            <span className="font-bold">{target.progressPercent}%</span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-extrabold text-slate-900">
                          {target.supervisorScore !== null ? `${target.supervisorScore}/100` : '--'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              target.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : target.status === 'SUBMITTED'
                                ? 'bg-blue-100 text-blue-800'
                                : target.status === 'REVISION_REQUESTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {target.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-right space-x-1">
                          {target.status === 'SUBMITTED' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEvalModal(target)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition"
                            >
                              Evaluate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEvalModal(target)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                            >
                              Score / Review
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTarget(target.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                            title="Delete Target"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: SUPERVISOR EVALUATION & REVIEW VIEW           */}
      {/* ======================================================== */}
      {activeTab === 'EVALUATION' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl border border-white/80 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Pending Subordinate Submissions</h2>
              <p className="text-xs text-slate-500">
                Review employee self-assessments, inspect proof &amp; notes, award scores (0-100) and provide feedback.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {pendingReviews.length} Submissions Waiting
            </span>
          </div>

          {pendingReviews.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-3xl border border-white/80 space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">All Caught Up!</h3>
              <p className="text-xs text-slate-500">There are no pending submissions awaiting your review right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingReviews.map((target) => (
                <div
                  key={target.id}
                  className="glass-card p-5 rounded-3xl border border-white/80 shadow-md space-y-4 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                        {target.worker?.name} ({target.worker?.workerId})
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{target.title}</h4>
                      <div className="text-[11px] text-slate-400">
                        {target.category} • Period: {target.period}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800">
                      Submitted
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Target Benchmark:</span>
                      <span className="font-bold text-slate-900">
                        {target.targetValue} {target.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Employee Claimed:</span>
                      <span className="font-bold text-amber-700">
                        {target.actualValue} {target.unit} ({target.progressPercent}%)
                      </span>
                    </div>
                    {target.employeeNotes && (
                      <div className="pt-2 border-t border-slate-200 text-slate-700">
                        <span className="font-bold">Self Assessment: </span>
                        {target.employeeNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEvalModal(target)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                    >
                      <Award size={14} />
                      <span>Review &amp; Grade Submission</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: TEAM PERFORMANCE MATRIX VIEW                  */}
      {/* ======================================================== */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl border border-white/80 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Team Performance &amp; Completion Ranking</h2>
              <p className="text-xs text-slate-500">
                Comparative ranking of subordinates based on weighted KPI achievement scores.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Export Matrix</span>
            </button>
          </div>

          <div className="glass-card rounded-3xl border border-white/80 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Employee Name &amp; ID</th>
                  <th className="p-3.5">Designation &amp; Dept</th>
                  <th className="p-3.5">Assigned Goals</th>
                  <th className="p-3.5">Finalized Goals</th>
                  <th className="p-3.5">Completion Rate</th>
                  <th className="p-3.5">Average Score</th>
                  <th className="p-3.5">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {teamMatrix.map((item, idx) => {
                  let gradeBadge = 'text-slate-600 bg-slate-100';
                  if (item.averageScore >= 90) gradeBadge = 'text-emerald-800 bg-emerald-100 font-extrabold';
                  else if (item.averageScore >= 80) gradeBadge = 'text-blue-800 bg-blue-100 font-bold';
                  else if (item.averageScore >= 70) gradeBadge = 'text-amber-800 bg-amber-100 font-bold';
                  else gradeBadge = 'text-rose-800 bg-rose-100 font-bold';

                  return (
                    <tr key={item.worker.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{item.worker.name}</div>
                        <div className="text-[11px] text-slate-400">ID: {item.worker.workerId}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {item.worker.designation || 'Staff'} • {item.worker.department?.name || 'Operations'}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{item.targetCount}</td>
                      <td className="p-3.5 font-bold text-emerald-600">{item.completedCount}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${item.completionRate}%` }}
                            />
                          </div>
                          <span className="font-bold">{item.completionRate}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-900 text-sm">{item.averageScore}%</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase ${gradeBadge}`}>
                          {item.averageScore >= 90
                            ? 'A+ (Top)'
                            : item.averageScore >= 80
                            ? 'A'
                            : item.averageScore >= 70
                            ? 'B'
                            : 'C'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 5: ADMIN ENTERPRISE OVERVIEW & ALL TARGETS       */}
      {/* ======================================================== */}
      {activeRole === 'ADMIN' && (activeTab === 'OVERVIEW' || activeTab === 'ALL_TARGETS') && (
        <div className="space-y-6">
          {/* Admin KPI Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-3xl border border-white/80 shadow-xs">
              <div className="text-slate-400 text-xs font-bold uppercase mb-1">Total Active Employees</div>
              <div className="text-3xl font-extrabold text-slate-900">{initialWorkers.length}</div>
              <div className="text-xs text-slate-500 mt-1">Across all departments</div>
            </div>
            <div className="glass-card p-5 rounded-3xl border border-white/80 shadow-xs">
              <div className="text-slate-400 text-xs font-bold uppercase mb-1">Assigned KPI Goals</div>
              <div className="text-3xl font-extrabold text-amber-600">{initialTargets.length}</div>
              <div className="text-xs text-slate-500 mt-1">Total company targets</div>
            </div>
            <div className="glass-card p-5 rounded-3xl border border-white/80 shadow-xs">
              <div className="text-slate-400 text-xs font-bold uppercase mb-1">Approved &amp; Evaluated</div>
              <div className="text-3xl font-extrabold text-emerald-600">
                {initialTargets.filter((t) => t.status === 'APPROVED' || t.status === 'REVIEWED').length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Scored achievements</div>
            </div>
            <div className="glass-card p-5 rounded-3xl border border-white/80 shadow-xs">
              <div className="text-slate-400 text-xs font-bold uppercase mb-1">Pending Reviews</div>
              <div className="text-3xl font-extrabold text-blue-600">
                {initialTargets.filter((t) => t.status === 'SUBMITTED').length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Awaiting supervisor</div>
            </div>
          </div>

          {/* Target Filters & Search */}
          <div className="glass-card p-4 rounded-3xl border border-white/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search worker or target..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Period:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-white/90 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Periods</option>
                  {distinctPeriods.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/90 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REVISION_REQUESTED">Revision Requested</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white/90 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Categories</option>
                  <option value="OPERATIONAL">Operational</option>
                  <option value="QUALITY">Quality</option>
                  <option value="PRODUCTIVITY">Productivity</option>
                  <option value="ATTENDANCE">Attendance</option>
                  <option value="SAFETY">Safety</option>
                  <option value="BEHAVIORAL">Behavioral</option>
                  <option value="PROJECT">Project</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateTargetModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition"
            >
              <Plus size={16} />
              <span>Create Target</span>
            </button>
          </div>

          {/* All Targets Table */}
          <div className="glass-card rounded-3xl border border-white/80 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Supervisor</th>
                    <th className="p-3.5">Target Title &amp; Category</th>
                    <th className="p-3.5">Period</th>
                    <th className="p-3.5">Benchmark</th>
                    <th className="p-3.5">Weight</th>
                    <th className="p-3.5">Progress</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {initialTargets
                    .filter((t) => {
                      if (selectedPeriod !== 'ALL' && t.period !== selectedPeriod) return false;
                      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
                      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
                      if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        const wn = t.worker?.name?.toLowerCase() || '';
                        const wid = t.worker?.workerId?.toLowerCase() || '';
                        const title = t.title?.toLowerCase() || '';
                        if (!wn.includes(q) && !wid.includes(q) && !title.includes(q)) return false;
                      }
                      return true;
                    })
                    .map((target) => (
                      <tr key={target.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{target.worker?.name}</div>
                          <div className="text-[11px] text-slate-400">ID: {target.worker?.workerId}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {target.supervisor ? (
                            <div className="text-slate-800 font-medium">{target.supervisor.name}</div>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">{target.title}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{target.category}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-600">{target.period}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          {target.targetValue !== null ? `${target.targetValue} ${target.unit || ''}` : '--'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-bold text-blue-600">
                          {target.weightage}%
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-bold">{target.progressPercent}%</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-extrabold text-slate-900">
                          {target.supervisorScore !== null ? `${target.supervisorScore}/100` : '--'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              target.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : target.status === 'SUBMITTED'
                                ? 'bg-blue-100 text-blue-800'
                                : target.status === 'REVISION_REQUESTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {target.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEvalModal(target)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                          >
                            Grade
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTarget(target.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 6: ADMIN SUPERVISOR ASSIGNMENT MANAGER           */}
      {/* ======================================================== */}
      {activeRole === 'ADMIN' && activeTab === 'SUPERVISORS' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl border border-white/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Supervisor Hierarchy &amp; Assignment Manager</h2>
              <p className="text-xs text-slate-500 max-w-xl">
                Assign supervisors to workers individually or in bulk. Once assigned, the supervisor will be able to set
                KPI targets, review subordinate submissions, and grade achievements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedWorkerIdsForBulk.length === 0) {
                    setMessage({ type: 'error', text: 'Select employees first to use bulk assignment.' });
                    return;
                  }
                  setIsBulkAssignModalOpen(true);
                }}
                disabled={selectedWorkerIdsForBulk.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <Users size={15} />
                <span>Bulk Assign Supervisor ({selectedWorkerIdsForBulk.length})</span>
              </button>
            </div>
          </div>

          {/* Department Filter & Search Bar */}
          <div className="glass-card p-4 rounded-3xl border border-white/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search worker name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Department:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white/90 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Showing{' '}
              {
                initialWorkers.filter((w) => {
                  if (selectedDept !== 'ALL' && w.department?.id !== selectedDept) return false;
                  if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const wn = w.name.toLowerCase();
                    const wid = w.workerId.toLowerCase();
                    if (!wn.includes(q) && !wid.includes(q)) return false;
                  }
                  return true;
                }).length
              }{' '}
              employees
            </div>
          </div>

          {/* Workers Hierarchy Table */}
          <div className="glass-card rounded-3xl border border-white/80 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedWorkerIdsForBulk.length > 0 &&
                          selectedWorkerIdsForBulk.length === initialWorkers.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkerIdsForBulk(initialWorkers.map((w) => w.id));
                          } else {
                            setSelectedWorkerIdsForBulk([]);
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-3.5">Employee ID &amp; Name</th>
                    <th className="p-3.5">Designation &amp; Dept</th>
                    <th className="p-3.5">Current Supervisor</th>
                    <th className="p-3.5">KPI Account Status</th>
                    <th className="p-3.5 text-right">Supervisor Assignment</th>
                    <th className="p-3.5 text-right">Reset Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {initialWorkers
                    .filter((w) => {
                      if (selectedDept !== 'ALL' && w.department?.id !== selectedDept) return false;
                      if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        const wn = w.name.toLowerCase();
                        const wid = w.workerId.toLowerCase();
                        if (!wn.includes(q) && !wid.includes(q)) return false;
                      }
                      return true;
                    })
                    .map((worker) => {
                      const isSelected = selectedWorkerIdsForBulk.includes(worker.id);

                      return (
                        <tr
                          key={worker.id}
                          className={`hover:bg-slate-50/60 transition ${
                            isSelected ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <td className="p-3.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedWorkerIdsForBulk((prev) => [...prev, worker.id]);
                                } else {
                                  setSelectedWorkerIdsForBulk((prev) => prev.filter((id) => id !== worker.id));
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{worker.name}</div>
                            <div className="text-[11px] text-slate-400 font-semibold">ID: {worker.workerId}</div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div>{worker.designation || 'Staff'}</div>
                            <div className="text-[11px] text-slate-400">{worker.department?.name || 'Operations'}</div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {worker.supervisor ? (
                              <div className="font-bold text-amber-700">
                                {worker.supervisor.name} ({worker.supervisor.workerId})
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No supervisor assigned</span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {worker.kpiAccount ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Initialized (
                                {worker.kpiAccount.isSupervisor ? 'Supervisor' : 'Worker'})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                Default (ID #{worker.workerId})
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-right">
                            <select
                              value={worker.supervisorId || ''}
                              onChange={(e) => handleSingleAssignSupervisor(worker.id, e.target.value || null)}
                              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[200px]"
                            >
                              <option value="">-- No Supervisor --</option>
                              {initialWorkers
                                .filter((s) => s.id !== worker.id)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.workerId})
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={() => handleResetPassword(worker.id, worker.name)}
                              className="text-[11px] font-bold text-slate-500 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition"
                              title="Reset Password to Employee ID Number"
                            >
                              Reset
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SUBMIT EMPLOYEE ACHIEVEMENT & NOTES            */}
      {/* ======================================================== */}
      {isSubmitModalOpen && targetToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white/95 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-white space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">
                  Self-Assessment Submission
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">{targetToSubmit.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAchievement} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Target Benchmark:</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {targetToSubmit.targetValue ?? '--'} {targetToSubmit.unit ?? ''}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Category / Period:</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {targetToSubmit.category} • {targetToSubmit.period}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Actual Value Achieved ({targetToSubmit.unit || 'Units'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={actualValueInput}
                  onChange={(e) => setActualValueInput(e.target.value)}
                  placeholder="e.g. 500, 98.5"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-4 focus:ring-amber-500/15 outline-none font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Progress Percentage
                  </label>
                  <span className="text-sm font-extrabold text-amber-600">{progressPercentInput}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercentInput}
                  onChange={(e) => setProgressPercentInput(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Self-Reflection &amp; Achievement Notes
                </label>
                <textarea
                  rows={3}
                  value={employeeNotesInput}
                  onChange={(e) => setEmployeeNotesInput(e.target.value)}
                  placeholder="Describe your work, challenges tackled, output achieved, or references..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:ring-4 focus:ring-amber-500/15 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SUPERVISOR EVALUATION & GRADING                */}
      {/* ======================================================== */}
      {isEvalModalOpen && targetToEvaluate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white/95 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-white space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider">
                  Supervisor Evaluation &amp; Grading
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">{targetToEvaluate.title}</h3>
                <div className="text-xs text-slate-500">
                  Subordinate: {targetToEvaluate.worker?.name} ({targetToEvaluate.worker?.workerId})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEvaluate} className="space-y-4">
              {/* Employee claim details */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Benchmark:</span>
                  <span className="font-bold text-slate-800">
                    {targetToEvaluate.targetValue ?? '--'} {targetToEvaluate.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee Claimed:</span>
                  <span className="font-bold text-amber-700">
                    {targetToEvaluate.actualValue ?? '--'} {targetToEvaluate.unit} ({targetToEvaluate.progressPercent}%)
                  </span>
                </div>
                {targetToEvaluate.employeeNotes && (
                  <div className="pt-1.5 border-t border-slate-200 text-slate-600">
                    <span className="font-bold text-slate-800">Self Notes: </span>
                    {targetToEvaluate.employeeNotes}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Supervisor Score (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalScoreInput}
                    onChange={(e) => setEvalScoreInput(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-4 focus:ring-emerald-500/15 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Rating Grade
                  </label>
                  <select
                    value={evalRatingInput}
                    onChange={(e) => setEvalRatingInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/15"
                  >
                    <option value="EXCELLENT">Excellent (90-100)</option>
                    <option value="GOOD">Good (75-89)</option>
                    <option value="AVERAGE">Average (50-74)</option>
                    <option value="NEEDS_IMPROVEMENT">Needs Improvement (&lt;50)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Final Decision
                </label>
                <select
                  value={evalStatusInput}
                  onChange={(e) => setEvalStatusInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/15"
                >
                  <option value="APPROVED">Approve &amp; Finalize Score</option>
                  <option value="REVISION_REQUESTED">Request Revision / Re-submission</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Supervisor Feedback &amp; Recommendations
                </label>
                <textarea
                  rows={3}
                  value={evalFeedbackInput}
                  onChange={(e) => setEvalFeedbackInput(e.target.value)}
                  placeholder="Provide constructive feedback, praise high performance, or clarify needed adjustments..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:ring-4 focus:ring-emerald-500/15 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEvalModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>Save Evaluation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SET NEW KPI TARGET                             */}
      {/* ======================================================== */}
      {isCreateTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white/95 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-white space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">
                  Goal Setting
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">Set New KPI Target</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTargetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTarget} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assign To Subordinate / Worker
                </label>
                <select
                  value={newTargetWorkerId}
                  onChange={(e) => setNewTargetWorkerId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-4 focus:ring-amber-500/15"
                >
                  <option value="">-- Select Worker --</option>
                  {(activeRole === 'ADMIN' ? initialWorkers : initialSubordinates).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.workerId}) - {w.designation || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  KPI Title
                </label>
                <input
                  type="text"
                  value={newTargetTitle}
                  onChange={(e) => setNewTargetTitle(e.target.value)}
                  placeholder="e.g. Monthly Production Target, Zero Safety Incidents..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:ring-4 focus:ring-amber-500/15 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newTargetCategory}
                    onChange={(e) => setNewTargetCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-4 focus:ring-amber-500/15"
                  >
                    <option value="OPERATIONAL">Operational</option>
                    <option value="QUALITY">Quality</option>
                    <option value="PRODUCTIVITY">Productivity</option>
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="SAFETY">Safety</option>
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="PROJECT">Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Period
                  </label>
                  <input
                    type="text"
                    value={newTargetPeriod}
                    onChange={(e) => setNewTargetPeriod(e.target.value)}
                    placeholder="e.g. November 2026, Q4 2026"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-4 focus:ring-amber-500/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newTargetValue}
                    onChange={(e) => setNewTargetValue(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newTargetUnit}
                    onChange={(e) => setNewTargetUnit(e.target.value)}
                    placeholder="%, Units, Days"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Weight %
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTargetWeightage}
                    onChange={(e) => setNewTargetWeightage(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={newTargetDeadline}
                  onChange={(e) => setNewTargetDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={newTargetDescription}
                  onChange={(e) => setNewTargetDescription(e.target.value)}
                  placeholder="Additional guidance for the employee..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateTargetModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={15} />}
                  <span>Set KPI Target</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: BULK SUPERVISOR ASSIGNMENT                      */}
      {/* ======================================================== */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white/95 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
                  Bulk Assignment
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Assign Supervisor to {selectedWorkerIdsForBulk.length} Workers
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Choose the designated supervisor. All selected workers will be assigned under this supervisor for KPI
                setting and evaluation.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Designated Supervisor
                </label>
                <select
                  value={bulkSupervisorId}
                  onChange={(e) => setBulkSupervisorId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold outline-none focus:ring-4 focus:ring-indigo-500/15"
                >
                  <option value="">-- Clear / Remove Supervisor --</option>
                  {initialWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.workerId}) - {w.designation || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkAssignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkAssign}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={15} />}
                  <span>Confirm Bulk Assignment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CHANGE KPI PASSWORD                             */}
      {/* ======================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white/95 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">
                  Security Settings
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">Change KPI Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {passwordMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Your current password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-4 focus:ring-amber-500/15 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-4 focus:ring-amber-500/15 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-4 focus:ring-amber-500/15 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={15} />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
