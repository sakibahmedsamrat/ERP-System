'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Pencil, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronRight, 
  ChevronDown,
  Sliders, 
  ArrowUpRight,
  TrendingDown,
  Building2,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  FolderTree,
  Table as TableIcon,
  ChevronsUpDown,
  Check
} from 'lucide-react';
import { updateSubSectionManpower, getSubSectionWorkers } from './actions';
import { formatDate } from '@/lib/formatDate';
import ManpowerEntryClient from './manpower/ManpowerEntryClient';

export interface SubSectionManpowerItem {
  id: string;
  name: string;
  sectionId: string;
  sectionName: string;
  departmentId: string;
  departmentName: string;
  companyId: string;
  companyName: string;
  authorizedManpower: number;
  existingManpower: number;
  remaining: number; // authorized - existing
}

export interface JobItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  _count: { applicants: number };
}

export interface HierarchyCompany {
  id: string;
  name: string;
  departments: {
    id: string;
    name: string;
    sections: {
      id: string;
      name: string;
      _count?: { workers: number };
      subSections: {
        id: string;
        name: string;
        authorizedManpower: number;
        _count: { workers: number };
      }[];
    }[];
  }[];
}

interface Props {
  initialItems: SubSectionManpowerItem[];
  recruitments: JobItem[];
  companies: HierarchyCompany[];
  userRole?: string;
}

// Helper to determine status and label cleanly without contradictory or duplicate badges
export function getManpowerStatus(auth: number, exist: number) {
  const diff = auth - exist;
  if (auth === 0 && exist === 0) {
    return {
      type: 'NOT_SET' as const,
      label: '0 Not Set',
      badgeClass: 'bg-gray-100 text-gray-500 border border-gray-200',
      vacancy: 0,
      surplus: 0
    };
  }
  if (auth === 0 && exist > 0) {
    return {
      type: 'UNSET_ACTIVE' as const,
      label: `${exist} Active (Unset)`,
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
      vacancy: 0,
      surplus: exist
    };
  }
  if (auth > exist) {
    return {
      type: 'VACANCY' as const,
      label: `+${diff} Vacancy`,
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
      vacancy: diff,
      surplus: 0
    };
  }
  if (auth === exist) {
    return {
      type: 'FULFILLED' as const,
      label: '0 Fulfilled',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      vacancy: 0,
      surplus: 0
    };
  }
  // exist > auth
  const surplusCount = exist - auth;
  return {
    type: 'SURPLUS' as const,
    label: `${surplusCount} Surplus`,
    badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    vacancy: 0,
    surplus: surplusCount
  };
}

export default function RecruitmentClient({
  initialItems,
  recruitments,
  companies,
  userRole
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;

  // Primary state
  const [items, setItems] = useState<SubSectionManpowerItem[]>(initialItems);
  const [companiesState, setCompaniesState] = useState<HierarchyCompany[]>(companies);

  // Sync if props change
  useEffect(() => {
    setItems(initialItems);
    setCompaniesState(companies);
  }, [initialItems, companies]);

  // Main Tabs: overview | entry | jobs
  const [activeTab, setActiveTab] = useState<'overview' | 'entry' | 'jobs'>(() => {
    if (tabParam === 'jobs') return 'jobs';
    if (tabParam === 'entry') return 'entry';
    return 'overview';
  });

  // Sync active tab with URL query parameter changes
  useEffect(() => {
    if (tabParam === 'jobs') {
      setActiveTab('jobs');
    } else if (tabParam === 'entry') {
      setActiveTab('entry');
    } else if (tabParam === 'overview' || !tabParam) {
      setActiveTab('overview');
    }
  }, [tabParam]);

  const switchTab = (tab: 'overview' | 'entry' | 'jobs') => {
    setActiveTab(tab);
    const targetUrl = tab === 'overview' ? '/recruitment' : `/recruitment?tab=${tab}`;
    router.replace(targetUrl, { scroll: false });
  };

  // Sub View Mode in overview: 'hierarchy' (grouped tree) vs 'table' (flat table)
  const [viewMode, setViewMode] = useState<'hierarchy' | 'table'>('hierarchy');

  // Accordion expanded sets for Hierarchy view
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Auto-expand all companies by default
  useEffect(() => {
    const compMap: Record<string, boolean> = {};
    companiesState.forEach(c => {
      compMap[c.id] = true;
    });
    setExpandedCompanies(compMap);
  }, [companiesState]);

  const toggleAllAccordions = (expand: boolean) => {
    const compMap: Record<string, boolean> = {};
    const deptMap: Record<string, boolean> = {};
    const secMap: Record<string, boolean> = {};

    if (expand) {
      companiesState.forEach(c => {
        compMap[c.id] = true;
        c.departments.forEach(d => {
          deptMap[d.id] = true;
          d.sections.forEach(s => {
            secMap[s.id] = true;
          });
        });
      });
    }

    setExpandedCompanies(compMap);
    setExpandedDepts(deptMap);
    setExpandedSections(secMap);
  };

  // Table Filters
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VACANCY' | 'FULFILLED' | 'SURPLUS' | 'NOT_SET'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick Edit Modal
  const [editingItem, setEditingItem] = useState<SubSectionManpowerItem | null>(null);
  const [newAuthorized, setNewAuthorized] = useState<number | string>(0);
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Inspect Active Workers Modal
  const [inspectingItem, setInspectingItem] = useState<SubSectionManpowerItem | null>(null);
  const [workerList, setWorkerList] = useState<any[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cascading lists for filter dropdowns
  const availableDepts = useMemo(() => {
    if (!selectedCompanyId) return [];
    const comp = companiesState.find(c => c.id === selectedCompanyId);
    return comp ? comp.departments : [];
  }, [selectedCompanyId, companiesState]);

  const availableSections = useMemo(() => {
    if (!selectedDeptId) return [];
    const dept = availableDepts.find(d => d.id === selectedDeptId);
    return dept ? dept.sections : [];
  }, [selectedDeptId, availableDepts]);

  // Filtering table items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCompanyId && item.companyId !== selectedCompanyId) return false;
      if (selectedDeptId && item.departmentId !== selectedDeptId) return false;
      if (selectedSectionId && item.sectionId !== selectedSectionId) return false;

      if (statusFilter === 'VACANCY') {
        if (!(item.authorizedManpower > item.existingManpower)) return false;
      } else if (statusFilter === 'FULFILLED') {
        if (!(item.authorizedManpower > 0 && item.authorizedManpower === item.existingManpower)) return false;
      } else if (statusFilter === 'SURPLUS') {
        if (!(item.existingManpower > item.authorizedManpower)) return false;
      } else if (statusFilter === 'NOT_SET') {
        if (item.authorizedManpower !== 0) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const match = 
          item.name.toLowerCase().includes(query) ||
          item.sectionName.toLowerCase().includes(query) ||
          item.departmentName.toLowerCase().includes(query) ||
          item.companyName.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [items, selectedCompanyId, selectedDeptId, selectedSectionId, statusFilter, searchQuery]);

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalAuthorized = 0;
    let totalExisting = 0;
    let totalVacancy = 0;
    let totalSurplus = 0;
    let fulfilledCount = 0;

    filteredItems.forEach(item => {
      totalAuthorized += item.authorizedManpower;
      totalExisting += item.existingManpower;
      if (item.authorizedManpower > item.existingManpower) {
        totalVacancy += (item.authorizedManpower - item.existingManpower);
      } else if (item.existingManpower > item.authorizedManpower) {
        totalSurplus += (item.existingManpower - item.authorizedManpower);
      }
      if (item.authorizedManpower > 0 && item.existingManpower >= item.authorizedManpower) {
        fulfilledCount++;
      }
    });

    const fulfillmentRate = totalAuthorized > 0 
      ? Math.min(100, Math.round((totalExisting / totalAuthorized) * 100)) 
      : 0;

    const netRemaining = totalAuthorized - totalExisting;

    return {
      totalAuthorized,
      totalExisting,
      totalVacancy,
      totalSurplus,
      fulfilledCount,
      fulfillmentRate,
      netRemaining,
      subSectionCount: filteredItems.length
    };
  }, [filteredItems]);

  // Handle Quick Edit Save
  const handleSaveAuthorized = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (newAuthorized === '' || isNaN(Number(newAuthorized)) || Number(newAuthorized) < 0) {
      showToast('Please enter a valid number (0 or higher)', 'error');
      return;
    }

    const authVal = Math.max(0, Math.floor(Number(newAuthorized)));
    setIsSaving(true);

    try {
      const res = await updateSubSectionManpower(editingItem.id, authVal, editRemarks);
      if (res.success) {
        showToast(res.message || 'Authorized manpower updated successfully', 'success');

        // Update items state
        setItems(prev => prev.map(item => {
          if (item.id === editingItem.id) {
            return {
              ...item,
              authorizedManpower: authVal,
              remaining: authVal - item.existingManpower
            };
          }
          return item;
        }));

        // Update companiesState immutably
        setCompaniesState(prev => prev.map(c => ({
          ...c,
          departments: c.departments.map(d => ({
            ...d,
            sections: d.sections.map(s => ({
              ...s,
              subSections: s.subSections.map(sub => {
                if (sub.id === editingItem.id) {
                  return { ...sub, authorizedManpower: authVal };
                }
                return sub;
              })
            }))
          }))
        })));

        setEditingItem(null);
        setEditRemarks('');
        router.refresh();
      } else {
        showToast(res.error || 'Failed to update', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Inspect workers for a sub-section
  const handleInspectWorkers = async (item: SubSectionManpowerItem) => {
    setInspectingItem(item);
    setIsLoadingWorkers(true);
    setWorkerList([]);
    try {
      const res = await getSubSectionWorkers(item.id);
      if (res.success) {
        setWorkerList(res.workers || []);
      } else {
        showToast(res.error || 'Failed to load workers', 'error');
      }
    } catch (err: any) {
      showToast('Error loading workers', 'error');
    } finally {
      setIsLoadingWorkers(false);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      'SL',
      'Company',
      'Department',
      'Section',
      'Sub Section',
      'Authorized Manpower',
      'Existing Manpower',
      'Remaining Vacancy',
      'Surplus',
      'Status'
    ];

    const rows = filteredItems.map((item, idx) => {
      const st = getManpowerStatus(item.authorizedManpower, item.existingManpower);
      return [
        idx + 1,
        `"${item.companyName.replace(/"/g, '""')}"`,
        `"${item.departmentName.replace(/"/g, '""')}"`,
        `"${item.sectionName.replace(/"/g, '""')}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        item.authorizedManpower,
        item.existingManpower,
        st.vacancy,
        st.surplus,
        `"${st.label.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `manpower_details_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="glass-card p-6 rounded-3xl shadow-sm border border-white/70 print:shadow-none print:border-none print:p-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Briefcase size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Recruitment &amp; Manpower
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Detailed summary of authorized, existing, and remaining (vacancy) manpower by company, department, section, and sub-section
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={() => switchTab('entry')}
            className={`inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm ${
              activeTab === 'entry'
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-blue-500/20'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/20'
            }`}
          >
            <Sliders size={16} />
            <span>Set Authorized Manpower</span>
          </button>

          <Link
            href="/recruitment/new"
            prefetch={true}
            className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200/80 transition-all shadow-xs"
          >
            <Plus size={16} className="text-blue-600" />
            <span>Open Job Circular</span>
          </Link>

          <button
            onClick={exportToCSV}
            title="Export to CSV"
            className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200/80 transition-all shadow-xs"
          >
            <Download size={15} className="text-emerald-600" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => window.print()}
            title="Print Report"
            className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200/80 transition-all shadow-xs"
          >
            <Printer size={15} className="text-slate-600" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 print:hidden">
        <button
          onClick={() => switchTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Users size={16} />
          <span>Manpower Details &amp; Analysis</span>
          <span className="bg-blue-100/80 text-blue-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
            {items.length}
          </span>
        </button>

        <button
          onClick={() => switchTab('entry')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all ${
            activeTab === 'entry'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Sliders size={16} />
          <span>Cascading Manpower Entry</span>
          <span className="bg-emerald-100/80 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
            Step-by-Step
          </span>
        </button>

        <button
          onClick={() => switchTab('jobs')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all ${
            activeTab === 'jobs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Briefcase size={16} />
          <span>Job Circulars</span>
          <span className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-full font-bold">
            {recruitments.length}
          </span>
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:grid-cols-4">
            {/* Authorized Manpower */}
            <div className="glass-card glass-card-hover rounded-3xl p-5 border border-white/70 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Authorized Manpower
                  </p>
                  <p className="text-xs text-slate-400 font-medium mb-1">Total Authorized Manpower</p>
                  <p className="text-3xl font-extrabold text-slate-900">{metrics.totalAuthorized}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-200/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users size={22} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-blue-600">{metrics.subSectionCount}</span> sub-sections total
              </div>
            </div>

            {/* Existing Manpower */}
            <div className="glass-card glass-card-hover rounded-3xl p-5 border border-white/70 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Existing Manpower
                  </p>
                  <p className="text-xs text-slate-400 font-medium mb-1">Total Existing Manpower</p>
                  <p className="text-3xl font-extrabold text-emerald-600">{metrics.totalExisting}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck size={22} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-emerald-600">{metrics.fulfillmentRate}%</span> staffing fulfillment
              </div>
            </div>

            {/* Remaining / Vacancy (Deficit) */}
            <div className="glass-card glass-card-hover rounded-3xl p-5 border border-white/70 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                    Remaining / Vacancy
                  </p>
                  <p className="text-xs text-slate-400 font-medium mb-1">Remaining Shortfall</p>
                  <p className="text-3xl font-extrabold text-rose-600">
                    {metrics.totalVacancy > 0 ? `+${metrics.totalVacancy}` : 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-200/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus size={22} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 font-medium">
                {metrics.totalVacancy > 0 ? (
                  <span>Vacancies remaining to be filled</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">No open vacancies</span>
                )}
              </div>
            </div>

            {/* Fulfillment Status / Surplus */}
            <div className="glass-card glass-card-hover rounded-3xl p-5 border border-white/70 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Surplus / Fulfilled
                  </p>
                  <p className="text-xs text-slate-400 font-medium mb-1">Surplus &amp; Fulfilled Sections</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-extrabold text-indigo-600">
                      {metrics.totalSurplus > 0 ? `+${metrics.totalSurplus}` : 0}
                    </p>
                    <span className="text-xs text-slate-400 font-semibold">surplus</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-200/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={22} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-indigo-600">{metrics.fulfilledCount}</span> sub-sections 100% full
              </div>
            </div>
          </div>

          {/* View Mode Switcher and Table Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">View Mode:</span>
              <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200/60">
                <button
                  onClick={() => setViewMode('hierarchy')}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'hierarchy'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FolderTree size={15} />
                  <span>Hierarchy Breakdown</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <TableIcon size={15} />
                  <span>Flat Table View</span>
                </button>
              </div>
            </div>

            {viewMode === 'hierarchy' ? (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => toggleAllAccordions(true)}
                  className="px-3 py-1.5 rounded-lg font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition"
                >
                  Expand All
                </button>
                <button
                  onClick={() => toggleAllAccordions(false)}
                  className="px-3 py-1.5 rounded-lg font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition"
                >
                  Collapse All
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> items</span>
              </div>
            )}
          </div>

          {/* VIEW MODE 1: HIERARCHY TREE */}
          {viewMode === 'hierarchy' ? (
            <div className="space-y-4">
              {companiesState.map(company => {
                const isCompOpen = expandedCompanies[company.id] ?? false;

                // Roll-up company stats
                let compAuth = 0;
                let compExist = 0;
                let compVacancy = 0;
                let compSurplus = 0;

                company.departments.forEach(dept => {
                  dept.sections.forEach(sec => {
                    sec.subSections.forEach(sub => {
                      compAuth += sub.authorizedManpower;
                      compExist += sub._count.workers;
                      if (sub.authorizedManpower > sub._count.workers) {
                        compVacancy += (sub.authorizedManpower - sub._count.workers);
                      } else if (sub._count.workers > sub.authorizedManpower) {
                        compSurplus += (sub._count.workers - sub.authorizedManpower);
                      }
                    });
                  });
                });

                const compFulfillment = compAuth > 0 ? Math.min(100, Math.round((compExist / compAuth) * 100)) : 0;

                return (
                  <div key={company.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden transition-all">
                    {/* Company Header Row */}
                    <div 
                      onClick={() => setExpandedCompanies(prev => ({ ...prev, [company.id]: !prev[company.id] }))}
                      className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-opacity-95 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-white/10 text-white">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold tracking-tight">{company.name}</h2>
                            <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-medium">
                              Company
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            {company.departments.length} Departments | {company.departments.reduce((acc, d) => acc + d.sections.length, 0)} Sections
                          </p>
                        </div>
                      </div>

                      {/* Company KPI Badges */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center">
                          <span className="text-[10px] text-slate-300 uppercase block font-semibold">Authorized</span>
                          <span className="text-sm font-extrabold text-blue-200">{compAuth}</span>
                        </div>
                        <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center">
                          <span className="text-[10px] text-slate-300 uppercase block font-semibold">Existing</span>
                          <span className="text-sm font-extrabold text-emerald-300">{compExist}</span>
                        </div>
                        <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center">
                          <span className="text-[10px] text-slate-300 uppercase block font-semibold">Remaining</span>
                          <span className={`text-sm font-extrabold ${compVacancy > 0 ? 'text-rose-300' : 'text-slate-200'}`}>
                            {compVacancy > 0 ? `+${compVacancy} Vacancy` : '0 Fulfilled'}
                          </span>
                        </div>
                        <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center">
                          <span className="text-[10px] text-slate-300 uppercase block font-semibold">Fulfillment</span>
                          <span className="text-sm font-extrabold text-amber-300">{compFulfillment}%</span>
                        </div>
                        <div className="ml-2 text-slate-300">
                          {isCompOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* Departments in Company */}
                    {isCompOpen && (
                      <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50">
                        {company.departments.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">No departments defined in this company.</p>
                        ) : (
                          company.departments.map(dept => {
                            const isDeptOpen = expandedDepts[dept.id] ?? true;

                            // Roll-up department stats
                            let deptAuth = 0;
                            let deptExist = 0;
                            let deptVacancy = 0;
                            let deptSurplus = 0;

                            dept.sections.forEach(sec => {
                              sec.subSections.forEach(sub => {
                                deptAuth += sub.authorizedManpower;
                                deptExist += sub._count.workers;
                                if (sub.authorizedManpower > sub._count.workers) {
                                  deptVacancy += (sub.authorizedManpower - sub._count.workers);
                                } else if (sub._count.workers > sub.authorizedManpower) {
                                  deptSurplus += (sub._count.workers - sub.authorizedManpower);
                                }
                              });
                            });

                            return (
                              <div key={dept.id} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                                {/* Department Header */}
                                <div 
                                  onClick={() => setExpandedDepts(prev => ({ ...prev, [dept.id]: !prev[dept.id] }))}
                                  className="px-5 py-3.5 bg-blue-50/70 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-blue-100/60 transition"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Layers size={17} className="text-blue-700" />
                                    <div>
                                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                                        Department: {dept.name}
                                      </h3>
                                      <span className="text-xs text-gray-500">
                                        {dept.sections.length} Sections
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700">
                                      Auth: <strong className="text-blue-700">{deptAuth}</strong>
                                    </span>
                                    <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700">
                                      Existing: <strong className="text-emerald-700">{deptExist}</strong>
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                                      deptVacancy > 0 
                                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                      {deptVacancy > 0 ? `+${deptVacancy} Vacancy` : '0 Fulfilled'}
                                    </span>
                                    <div className="text-gray-400">
                                      {isDeptOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>
                                  </div>
                                </div>

                                {/* Sections in Department */}
                                {isDeptOpen && (
                                  <div className="p-4 space-y-4">
                                    {dept.sections.length === 0 ? (
                                      <p className="text-xs text-gray-500 py-2 text-center">No sections in this department.</p>
                                    ) : (
                                      dept.sections.map(section => {
                                        const isSecOpen = expandedSections[section.id] ?? true;

                                        // Roll-up section stats
                                        let secAuth = 0;
                                        let secExist = 0;
                                        let secVacancy = 0;

                                        section.subSections.forEach(sub => {
                                          secAuth += sub.authorizedManpower;
                                          secExist += sub._count.workers;
                                          if (sub.authorizedManpower > sub._count.workers) {
                                            secVacancy += (sub.authorizedManpower - sub._count.workers);
                                          }
                                        });

                                        return (
                                          <div key={section.id} className="rounded-xl border border-gray-150 overflow-hidden bg-white shadow-xs">
                                            {/* Section Header */}
                                            <div 
                                              onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                                              className="px-4 py-2.5 bg-gray-50 border-b border-gray-200/80 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                                <h4 className="font-bold text-gray-800 text-sm">
                                                  Section: {section.name}
                                                </h4>
                                                <span className="text-[11px] text-gray-400">
                                                  ({section.subSections.length} Sub-Sections)
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-2.5 text-xs">
                                                <span className="text-gray-600">
                                                  Auth: <strong className="text-blue-700">{secAuth}</strong>
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-gray-600">
                                                  Existing: <strong className="text-emerald-700">{secExist}</strong>
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                <span className={`font-bold ${secVacancy > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                  {secVacancy > 0 ? `+${secVacancy} Vacancy` : 'Fulfilled'}
                                                </span>
                                                <div className="text-gray-400 ml-1">
                                                  {isSecOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Sub Sections Table */}
                                            {isSecOpen && (
                                              <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs sm:text-sm">
                                                  <thead className="bg-gray-50/60 text-gray-600 font-semibold border-b border-gray-200">
                                                    <tr>
                                                      <th className="py-2.5 px-4 w-10 text-center">#</th>
                                                      <th className="py-2.5 px-4">Sub Section Name</th>
                                                      <th className="py-2.5 px-4 text-center w-36">Authorized</th>
                                                      <th className="py-2.5 px-4 text-center w-36">Existing</th>
                                                      <th className="py-2.5 px-4 text-center">Remaining Vacancy</th>
                                                      <th className="py-2.5 px-4 text-center print:hidden w-36">Action</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-gray-100">
                                                    {section.subSections.map((sub, sIdx) => {
                                                      const auth = sub.authorizedManpower;
                                                      const exist = sub._count.workers;
                                                      const st = getManpowerStatus(auth, exist);

                                                      const flatItem: SubSectionManpowerItem = {
                                                        id: sub.id,
                                                        name: sub.name,
                                                        sectionId: section.id,
                                                        sectionName: section.name,
                                                        departmentId: dept.id,
                                                        departmentName: dept.name,
                                                        companyId: company.id,
                                                        companyName: company.name,
                                                        authorizedManpower: auth,
                                                        existingManpower: exist,
                                                        remaining: auth - exist
                                                      };

                                                      return (
                                                        <tr key={sub.id} className="hover:bg-blue-50/30 transition-colors">
                                                          <td className="py-2.5 px-4 text-center text-gray-400 font-medium">
                                                            {sIdx + 1}
                                                          </td>
                                                          <td className="py-2.5 px-4 font-bold text-gray-900">
                                                            {sub.name}
                                                          </td>
                                                          <td className="py-2.5 px-4 text-center">
                                                            <button
                                                              onClick={() => {
                                                                setEditingItem(flatItem);
                                                                setNewAuthorized(auth);
                                                                setEditRemarks('');
                                                              }}
                                                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition group cursor-pointer text-xs"
                                                              title="Click to edit authorized manpower"
                                                            >
                                                              <span>{auth}</span>
                                                              <Pencil size={11} className="text-blue-500 opacity-60 group-hover:opacity-100" />
                                                            </button>
                                                          </td>
                                                          <td className="py-2.5 px-4 text-center">
                                                            <button
                                                              onClick={() => handleInspectWorkers(flatItem)}
                                                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition group cursor-pointer text-xs"
                                                              title="Click to view assigned workers"
                                                            >
                                                              <span>{exist}</span>
                                                              <Eye size={11} className="text-emerald-600 opacity-60 group-hover:opacity-100" />
                                                            </button>
                                                          </td>
                                                          <td className="py-2.5 px-4 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${st.badgeClass}`}>
                                                              {st.label}
                                                            </span>
                                                          </td>
                                                          <td className="py-2.5 px-4 text-center print:hidden">
                                                            <div className="flex items-center justify-center gap-2">
                                                              <button
                                                                onClick={() => {
                                                                  setEditingItem(flatItem);
                                                                  setNewAuthorized(auth);
                                                                  setEditRemarks('');
                                                                }}
                                                                className="text-xs font-semibold px-2.5 py-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition inline-flex items-center gap-1"
                                                              >
                                                                <Pencil size={12} />
                                                                <span>Edit</span>
                                                              </button>
                                                              <Link
                                                                href={`/recruitment/manpower?companyId=${company.id}&deptId=${dept.id}&sectionId=${section.id}&subSectionId=${sub.id}`}
                                                                className="text-xs font-semibold px-2.5 py-1 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition inline-flex items-center gap-1"
                                                                title="Open dedicated entry page"
                                                              >
                                                                <Sliders size={12} />
                                                                <span>Entry Form</span>
                                                              </Link>
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
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW MODE 2: FLAT TABLE VIEW */
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 print:hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Filter size={16} className="text-blue-600" />
                    <span>Filters & Search</span>
                  </div>
                  {(selectedCompanyId || selectedDeptId || selectedSectionId || statusFilter !== 'ALL' || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedCompanyId('');
                        setSelectedDeptId('');
                        setSelectedSectionId('');
                        setStatusFilter('ALL');
                        setSearchQuery('');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <RefreshCw size={13} /> Reset Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Company Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Company</label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value);
                        setSelectedDeptId('');
                        setSelectedSectionId('');
                      }}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="">All Companies</option>
                      {companiesState.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => {
                        setSelectedDeptId(e.target.value);
                        setSelectedSectionId('');
                      }}
                      disabled={!selectedCompanyId}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">All Departments</option>
                      {availableDepts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Section</label>
                    <select
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      disabled={!selectedDeptId}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">All Sections</option>
                      {availableSections.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e: any) => setStatusFilter(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="VACANCY">Vacancy / Needs Hiring</option>
                      <option value="FULFILLED">Fulfilled</option>
                      <option value="SURPLUS">Surplus</option>
                      <option value="NOT_SET">Not Set</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search sub-section..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Sub Section Manpower Details
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Showing {filteredItems.length} of {items.length} sub-sections
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Vacancy
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Fulfilled
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Surplus
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200/80">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">#</th>
                        <th className="py-3.5 px-4">Company</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4">Section</th>
                        <th className="py-3.5 px-4">Sub Section</th>
                        <th className="py-3.5 px-4 text-center">
                          Authorized
                        </th>
                        <th className="py-3.5 px-4 text-center">
                          Existing
                        </th>
                        <th className="py-3.5 px-4 text-center">
                          Remaining / Vacancy
                        </th>
                        <th className="py-3.5 px-4 text-center">Fulfillment</th>
                        <th className="py-3.5 px-4 text-center print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredItems.map((item, idx) => {
                        const auth = item.authorizedManpower;
                        const exist = item.existingManpower;
                        const st = getManpowerStatus(auth, exist);

                        const fulfillmentPct = auth > 0 
                          ? Math.min(100, Math.round((exist / auth) * 100)) 
                          : 0;

                        return (
                          <tr 
                            key={item.id} 
                            className={`hover:bg-blue-50/40 transition-colors ${
                              st.type === 'VACANCY' ? 'bg-rose-50/15' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center text-gray-400 font-medium text-xs">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-900">
                              {item.companyName}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {item.departmentName}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {item.sectionName}
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-800">
                              {item.name}
                            </td>

                            {/* Authorized Manpower */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setNewAuthorized(item.authorizedManpower);
                                  setEditRemarks('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition group cursor-pointer"
                                title="Click to quick-edit authorized manpower"
                              >
                                <span>{item.authorizedManpower}</span>
                                <Pencil size={12} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                              </button>
                            </td>

                            {/* Existing Manpower */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleInspectWorkers(item)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition group cursor-pointer"
                                title="Click to view assigned workers"
                              >
                                <span>{item.existingManpower}</span>
                                <Eye size={12} className="opacity-40 group-hover:opacity-100 text-emerald-600 transition-opacity" />
                              </button>
                            </td>

                            {/* Remaining / Vacancy */}
                            <td className="py-3 px-4 text-center font-bold">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${st.badgeClass}`}>
                                {st.label}
                              </span>
                            </td>

                            {/* Fulfillment Bar */}
                            <td className="py-3 px-4 text-center w-36">
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    st.type === 'VACANCY' 
                                      ? 'bg-rose-500' 
                                      : st.type === 'FULFILLED' 
                                      ? 'bg-emerald-500' 
                                      : st.type === 'SURPLUS' 
                                      ? 'bg-indigo-500' 
                                      : 'bg-gray-300'
                                  }`}
                                  style={{ width: `${fulfillmentPct}%` }}
                                ></div>
                              </div>
                              <span className="text-[11px] font-semibold text-gray-500 mt-1 block">
                                {fulfillmentPct}%
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-3 px-4 text-center print:hidden">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setNewAuthorized(item.authorizedManpower);
                                    setEditRemarks('');
                                  }}
                                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition border border-transparent hover:border-blue-200 inline-flex items-center gap-1"
                                >
                                  <Pencil size={13} />
                                  <span>Edit</span>
                                </button>
                                <Link
                                  href={`/recruitment/manpower?companyId=${item.companyId}&deptId=${item.departmentId}&sectionId=${item.sectionId}&subSectionId=${item.id}`}
                                  className="text-xs font-semibold px-2 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-200 inline-flex items-center"
                                  title="Open dedicated cascading form"
                                >
                                  <Sliders size={13} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-gray-500">
                            <AlertCircle size={36} className="mx-auto text-gray-300 mb-2" />
                            <p className="font-semibold text-gray-700">No sub-sections match your filter criteria</p>
                            <p className="text-xs text-gray-400 mt-1">Try resetting the filters or modifying your search</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: CASCADING MANPOWER ENTRY */}
      {activeTab === 'entry' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Dedicated Sub-Section Manpower Entry
                </h3>
                <p className="text-xs text-gray-600">
                  Select Company &gt; Department &gt; Section &gt; Sub Section to define or adjust authorized manpower
                </p>
              </div>
            </div>
            <button
              onClick={() => switchTab('overview')}
              className="text-xs font-semibold px-4 py-2 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
            >
              Back to Overview
            </button>
          </div>

          <ManpowerEntryClient 
            companies={companiesState}
            isEmbedded={true}
            onSuccess={() => {
              // Trigger reload in background
              router.refresh();
            }}
          />
        </div>
      )}

      {/* TAB 3: JOB CIRCULARS */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Job Circulars</h2>
            <Link 
              href="/recruitment/new" 
              className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-semibold text-sm shadow-sm"
            >
              <Plus size={18} /> Open New Job
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recruitments.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col hover:border-blue-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-1 whitespace-pre-wrap">{job.description || 'No description provided.'}</p>
                
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">
                    Applicants: <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">{job._count.applicants}</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    Posted: {formatDate(job.createdAt)}
                  </span>
                </div>
              </div>
            ))}

            {recruitments.length === 0 && (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl shadow-sm text-gray-500 border border-gray-100">
                <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-gray-700">No active job circulars</p>
                <p className="text-xs text-gray-400 mt-1">Click &quot;Open New Job&quot; to publish a job posting</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Pencil size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Set Authorized Manpower</h3>
                  <p className="text-xs text-gray-500">Define authorized manpower count for sub-section</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Hierarchy Info */}
            <div className="my-4 p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-400 uppercase tracking-wider w-20">Path:</span>
                <span className="font-medium text-gray-800">
                  {editingItem.companyName} &gt; {editingItem.departmentName} &gt; {editingItem.sectionName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-400 uppercase tracking-wider w-20">Sub Section:</span>
                <span className="font-bold text-blue-600 text-sm">{editingItem.name}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-gray-200/70">
                <span className="font-semibold text-gray-400 uppercase tracking-wider w-20">Current:</span>
                <span className="text-gray-700">
                  Existing Workers: <strong className="text-emerald-700">{editingItem.existingManpower}</strong> | Current Auth: <strong className="text-blue-700">{editingItem.authorizedManpower}</strong>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveAuthorized} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Authorized Manpower *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={newAuthorized}
                  onChange={(e) => setNewAuthorized(e.target.value)}
                  className="w-full text-lg font-bold text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  placeholder="Enter number (e.g. 10)"
                  autoFocus
                />
                <div className="mt-2 text-xs flex items-center justify-between text-gray-500">
                  <span>
                    New Projected Difference: <strong className={
                      (Number(newAuthorized) || 0) - editingItem.existingManpower > 0 
                        ? 'text-rose-600' 
                        : (Number(newAuthorized) || 0) - editingItem.existingManpower === 0 
                        ? 'text-emerald-600' 
                        : 'text-indigo-600'
                    }>
                      {(Number(newAuthorized) || 0) - editingItem.existingManpower > 0 
                        ? `+${(Number(newAuthorized) || 0) - editingItem.existingManpower} Vacancy` 
                        : (Number(newAuthorized) || 0) - editingItem.existingManpower === 0 
                        ? '0 Fulfilled' 
                        : `${Math.abs((Number(newAuthorized) || 0) - editingItem.existingManpower)} Surplus`}
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Remarks / Note (Optional)
                </label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="e.g. Requisition for Q4, management approved"
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {isSaving && <RefreshCw size={14} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker List Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Active Workers: {inspectingItem.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {inspectingItem.companyName} &gt; {inspectingItem.departmentName} &gt; {inspectingItem.sectionName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {isLoadingWorkers ? (
                <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center">
                  <RefreshCw size={24} className="animate-spin mb-2 text-blue-600" />
                  <p className="text-sm">Loading assigned employees...</p>
                </div>
              ) : workerList.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {workerList.map((w: any) => (
                    <div key={w.id} className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                          {w.name ? w.name.slice(0, 2) : 'EM'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{w.name}</p>
                          <p className="text-xs text-gray-500">
                            ID: <span className="font-mono font-medium text-gray-700">{w.workerId}</span> | Designation: {w.designation || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-gray-600 font-medium">Joined: {formatDate(w.joinDate)}</p>
                        {w.phone && <p className="text-gray-400">{w.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Users size={36} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-700">No active employees assigned</p>
                  <p className="text-xs text-gray-400 mt-1">No active workers currently linked to this sub-section</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Total Active Workers: <strong className="text-emerald-700">{workerList.length}</strong></span>
              <button
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
