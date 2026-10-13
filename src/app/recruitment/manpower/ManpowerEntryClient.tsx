'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Layers, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  Users, 
  UserCheck, 
  Sliders, 
  Check, 
  Briefcase,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { updateSubSectionManpower, bulkUpdateSectionManpower } from '../actions';
import { HierarchyCompany } from '../RecruitmentClient';

interface InitialSelection {
  companyId?: string;
  deptId?: string;
  sectionId?: string;
  subSectionId?: string;
}

interface Props {
  companies: HierarchyCompany[];
  initialSelection?: InitialSelection;
  onSuccess?: () => void;
  isEmbedded?: boolean;
}

export default function ManpowerEntryClient({ 
  companies, 
  initialSelection,
  onSuccess,
  isEmbedded = false
}: Props) {
  const router = useRouter();

  // Local state copy of companies tree to ensure React state immutability
  const [companyList, setCompanyList] = useState<HierarchyCompany[]>(companies);

  // Sync state if props change
  useEffect(() => {
    setCompanyList(companies);
  }, [companies]);

  // Cascading selections
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(initialSelection?.companyId || '');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialSelection?.deptId || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(initialSelection?.sectionId || '');
  const [selectedSubSectionId, setSelectedSubSectionId] = useState<string>(initialSelection?.subSectionId || '');

  // Single entry form values
  const [authorizedCount, setAuthorizedCount] = useState<number | string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Bulk entry form values for the selected section: map of subSectionId -> authorizedCount
  const [bulkEntries, setBulkEntries] = useState<Record<string, number | string>>({});
  const [isBulkSubmitting, setIsBulkSubmitting] = useState<boolean>(false);

  // Status / Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // If initialSelection was provided and has items, set them
  useEffect(() => {
    if (initialSelection) {
      if (initialSelection.companyId) setSelectedCompanyId(initialSelection.companyId);
      if (initialSelection.deptId) setSelectedDeptId(initialSelection.deptId);
      if (initialSelection.sectionId) setSelectedSectionId(initialSelection.sectionId);
      if (initialSelection.subSectionId) setSelectedSubSectionId(initialSelection.subSectionId);
    }
  }, [initialSelection]);

  // Derived selections from local state
  const selectedCompany = useMemo(() => {
    return companyList.find(c => c.id === selectedCompanyId) || null;
  }, [companyList, selectedCompanyId]);

  const departments = useMemo(() => {
    return selectedCompany ? selectedCompany.departments : [];
  }, [selectedCompany]);

  const selectedDept = useMemo(() => {
    return departments.find(d => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  const sections = useMemo(() => {
    return selectedDept ? selectedDept.sections : [];
  }, [selectedDept]);

  const selectedSection = useMemo(() => {
    return sections.find(s => s.id === selectedSectionId) || null;
  }, [sections, selectedSectionId]);

  const subSections = useMemo(() => {
    return selectedSection ? selectedSection.subSections : [];
  }, [selectedSection]);

  const selectedSubSection = useMemo(() => {
    return subSections.find(sub => sub.id === selectedSubSectionId) || null;
  }, [subSections, selectedSubSectionId]);

  // When selectedSubSection changes, pre-populate authorizedCount
  useEffect(() => {
    if (selectedSubSection) {
      setAuthorizedCount(selectedSubSection.authorizedManpower);
    } else {
      setAuthorizedCount('');
    }
  }, [selectedSubSection]);

  // When selectedSection changes, initialize bulkEntries
  useEffect(() => {
    if (selectedSection) {
      const initialMap: Record<string, number | string> = {};
      selectedSection.subSections.forEach(sub => {
        initialMap[sub.id] = sub.authorizedManpower;
      });
      setBulkEntries(initialMap);
    } else {
      setBulkEntries({});
    }
  }, [selectedSection]);

  // Single SubSection Submission
  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSectionId) {
      showToast('Please select a Sub-Section (অনুগ্রহ করে উপ-শাখা নির্বাচন করুন)', 'error');
      return;
    }

    if (authorizedCount === '' || isNaN(Number(authorizedCount)) || Number(authorizedCount) < 0) {
      showToast('Please enter a valid authorized manpower count (0 or higher)', 'error');
      return;
    }

    const val = Math.max(0, Math.floor(Number(authorizedCount)));
    setIsSubmitting(true);

    try {
      const res = await updateSubSectionManpower(selectedSubSectionId, val, remarks);
      if (res.success) {
        showToast(res.message || 'Manpower updated successfully!', 'success');

        // Immutably update the local company tree state
        setCompanyList(prev => prev.map(comp => {
          if (comp.id !== selectedCompanyId) return comp;
          return {
            ...comp,
            departments: comp.departments.map(dept => {
              if (dept.id !== selectedDeptId) return dept;
              return {
                ...dept,
                sections: dept.sections.map(sec => {
                  if (sec.id !== selectedSectionId) return sec;
                  return {
                    ...sec,
                    subSections: sec.subSections.map(sub => {
                      if (sub.id !== selectedSubSectionId) return sub;
                      return { ...sub, authorizedManpower: val };
                    })
                  };
                })
              };
            })
          };
        }));

        setBulkEntries(prev => ({ ...prev, [selectedSubSectionId]: val }));
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        showToast(res.error || 'Failed to update manpower', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred while saving', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Section Submission
  const handleBulkSubmit = async () => {
    if (!selectedSection || subSections.length === 0) return;

    const entries = subSections.map(sub => ({
      subSectionId: sub.id,
      authorizedManpower: bulkEntries[sub.id] !== undefined 
        ? Math.max(0, Math.floor(Number(bulkEntries[sub.id]) || 0))
        : sub.authorizedManpower
    }));

    setIsBulkSubmitting(true);
    try {
      const res = await bulkUpdateSectionManpower(entries, `Updated from section bulk entry: ${selectedSection.name}`);
      if (res.success) {
        showToast(res.message || 'Section sub-sections updated successfully!', 'success');

        // Immutably update local company tree state
        setCompanyList(prev => prev.map(comp => {
          if (comp.id !== selectedCompanyId) return comp;
          return {
            ...comp,
            departments: comp.departments.map(dept => {
              if (dept.id !== selectedDeptId) return dept;
              return {
                ...dept,
                sections: dept.sections.map(sec => {
                  if (sec.id !== selectedSectionId) return sec;
                  return {
                    ...sec,
                    subSections: sec.subSections.map(sub => {
                      const updatedVal = bulkEntries[sub.id] !== undefined
                        ? Math.max(0, Math.floor(Number(bulkEntries[sub.id]) || 0))
                        : sub.authorizedManpower;
                      return { ...sub, authorizedManpower: updatedVal };
                    })
                  };
                })
              };
            })
          };
        }));

        if (selectedSubSection && bulkEntries[selectedSubSection.id] !== undefined) {
          setAuthorizedCount(bulkEntries[selectedSubSection.id]);
        }
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        showToast(res.error || 'Failed to bulk update', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred during bulk update', 'error');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Single calculation preview
  const currentExisting = selectedSubSection ? selectedSubSection._count.workers : 0;
  const currentAuth = selectedSubSection ? selectedSubSection.authorizedManpower : 0;
  const parsedNewAuth = authorizedCount === '' ? 0 : Math.max(0, Math.floor(Number(authorizedCount)) || 0);
  const newDiff = parsedNewAuth - currentExisting;

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto'}`}>
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header / Breadcrumb (when standalone) */}
      {!isEmbedded && (
        <div className="flex items-center justify-between">
          <Link 
            href="/recruitment" 
            prefetch={true}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft size={16} /> Back to Recruitment & Manpower Overview
          </Link>

          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200/60">
            Sub Section Wise Manpower
          </span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Sliders size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Sub Section Manpower Entry (উপ-শাখা ভিত্তিক জনবল এন্ট্রি)
            </h1>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              কোম্পানি &gt; বিভাগ &gt; শাখা &gt; উপ-শাখা নির্বাচন করে অনুমোদিত জনবল (Authorized Manpower) সংখ্যা এন্ট্রি বা পরিবর্তন করুন।
            </p>
          </div>
        </div>

        {/* Cascading Entry Form */}
        <form onSubmit={handleSubmitSingle} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Step 1: Company */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs inline-flex items-center justify-center font-bold">1</span>
                <span>Select Company (কোম্পানি নির্বাচন) *</span>
              </label>
              <select
                required
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  setSelectedDeptId('');
                  setSelectedSectionId('');
                  setSelectedSubSectionId('');
                }}
                className="w-full text-sm border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium"
              >
                <option value="">-- Choose Company (কোম্পানি নির্বাচন করুন) --</option>
                {companyList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Department */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs inline-flex items-center justify-center font-bold">2</span>
                <span>Select Department (বিভাগ নির্বাচন) *</span>
              </label>
              <select
                required
                value={selectedDeptId}
                disabled={!selectedCompanyId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setSelectedSectionId('');
                  setSelectedSubSectionId('');
                }}
                className="w-full text-sm border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {!selectedCompanyId 
                    ? '-- Select Company First --' 
                    : departments.length === 0 
                    ? '-- No Departments Found --' 
                    : '-- Choose Department (বিভাগ নির্বাচন করুন) --'}
                </option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Step 3: Section */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs inline-flex items-center justify-center font-bold">3</span>
                <span>Select Section (শাখা নির্বাচন) *</span>
              </label>
              <select
                required
                value={selectedSectionId}
                disabled={!selectedDeptId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  setSelectedSubSectionId('');
                }}
                className="w-full text-sm border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {!selectedDeptId 
                    ? '-- Select Department First --' 
                    : sections.length === 0 
                    ? '-- No Sections Found --' 
                    : '-- Choose Section (শাখা নির্বাচন করুন) --'}
                </option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Step 4: Sub Section */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs inline-flex items-center justify-center font-bold">4</span>
                <span>Select Sub Section (উপ-শাখা নির্বাচন) *</span>
              </label>
              <select
                required
                value={selectedSubSectionId}
                disabled={!selectedSectionId}
                onChange={(e) => setSelectedSubSectionId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-medium disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {!selectedSectionId 
                    ? '-- Select Section First --' 
                    : subSections.length === 0 
                    ? '-- No Sub-Sections Found in this Section --' 
                    : '-- Choose Sub Section (উপ-শাখা নির্বাচন করুন) --'}
                </option>
                {subSections.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} (Auth: {sub.authorizedManpower}, Existing: {sub._count.workers})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Sub Section Info Card */}
          {selectedSubSection && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-white border border-blue-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-200/60">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-blue-600">
                    Selected Sub Section
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{selectedSubSection.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedCompany?.name} &gt; {selectedDept?.name} &gt; {selectedSection?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Current Auth</span>
                    <span className="text-base font-extrabold text-blue-700">{currentAuth}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Existing</span>
                    <span className="text-base font-extrabold text-emerald-700">{currentExisting}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Vacancy / বাকি</span>
                    <span className={`text-base font-extrabold ${currentAuth - currentExisting > 0 ? 'text-rose-600' : 'text-gray-700'}`}>
                      {currentAuth - currentExisting > 0 ? `+${currentAuth - currentExisting}` : currentAuth - currentExisting}
                    </span>
                  </div>
                </div>
              </div>

              {/* Number Input & Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Authorized Manpower Count (অনুমোদিত জনবল সংখ্যা) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={authorizedCount}
                    onChange={(e) => setAuthorizedCount(e.target.value)}
                    placeholder="Enter manpower count (e.g. 15)"
                    className="w-full text-xl font-bold text-gray-900 border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                  <div className="mt-2 text-xs flex items-center justify-between text-gray-500">
                    <span>
                      Projected Vacancy / বাকি: <strong className={newDiff > 0 ? 'text-rose-600' : newDiff === 0 ? 'text-emerald-600' : 'text-indigo-600'}>
                        {newDiff > 0 ? `+${newDiff} Vacancy (বাকি আছে)` : newDiff === 0 ? '0 Fulfilled (পূর্ণ)' : `${Math.abs(newDiff)} Surplus (উদ্বৃত্ত)`}
                      </strong>
                    </span>
                    <span>Active workers: <strong>{currentExisting}</strong></span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Remarks / Justification (মন্তব্য - ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Approved in annual manpower requisition budget"
                    className="w-full text-sm border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                {!isEmbedded && (
                  <Link
                    href="/recruitment"
                    className="w-full sm:w-auto px-5 py-2.5 text-center text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    Back to Recruitment Overview
                  </Link>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save Authorized Manpower (সংরক্ষণ করুন)</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Section Bulk Entry Mode */}
      {selectedSection && subSections.length > 0 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-md">
                  Section Bulk View
                </span>
                <h2 className="text-xl font-bold text-gray-900">
                  All Sub-Sections in &quot;{selectedSection.name}&quot;
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You can also enter or adjust authorized manpower for all {subSections.length} sub-sections of this section together at once.
              </p>
            </div>

            <button
              onClick={handleBulkSubmit}
              disabled={isBulkSubmitting}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm self-start sm:self-auto"
            >
              {isBulkSubmitting ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              <span>Save All for this Section</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Sub Section Name</th>
                  <th className="py-3 px-4 text-center">Existing Workers</th>
                  <th className="py-3 px-4 text-center w-48">Authorized Manpower</th>
                  <th className="py-3 px-4 text-center">Calculated Vacancy / Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subSections.map((sub, idx) => {
                  const rawVal = bulkEntries[sub.id] !== undefined ? bulkEntries[sub.id] : sub.authorizedManpower;
                  const numVal = Math.max(0, Math.floor(Number(rawVal) || 0));
                  const exist = sub._count.workers;
                  const diff = numVal - exist;

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 text-center text-gray-400 font-medium text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {sub.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs border border-emerald-200">
                          {exist}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={rawVal}
                          onChange={(e) => {
                            setBulkEntries(prev => ({ ...prev, [sub.id]: e.target.value }));
                          }}
                          className="w-28 text-center text-sm font-bold border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {numVal === 0 && exist === 0 ? (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                            0 Not Set
                          </span>
                        ) : numVal === 0 && exist > 0 ? (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-bold">
                            {exist} Active (Unset)
                          </span>
                        ) : diff > 0 ? (
                          <span className="text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-bold">
                            +{diff} Vacancy (বাকি আছে)
                          </span>
                        ) : diff === 0 ? (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
                            0 Fulfilled (পূর্ণ)
                          </span>
                        ) : (
                          <span className="text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 font-bold">
                            {Math.abs(diff)} Surplus (উদ্বৃত্ত)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
