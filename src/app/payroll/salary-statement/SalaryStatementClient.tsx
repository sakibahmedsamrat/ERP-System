'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  Printer,
  FileText,
  CreditCard,
  ArrowLeft,
  Loader2,
  Sparkles,
  Save,
  Copy,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  Bookmark,
} from 'lucide-react';
import {
  StatementData,
  MonthBreakdown,
  StatementCustomRow,
  createDefaultCustomRows,
  computeNetPayable,
  formatWordsOnly,
  formatDocDate,
  formatOrdinalDate,
  getDefault3Months,
} from './types';
import {
  saveSalaryStatement,
  getSavedSalaryStatements,
  getSalaryStatementById,
  deleteSalaryStatement,
  updateSalaryStatementStatus,
} from './actions';
import dynamic from 'next/dynamic';
import { SalaryStatementTable } from './components/SalaryStatementTable';

function FormEditorSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading form editor">
      <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/70">
        <div className="h-10 bg-slate-200 rounded-xl flex-1" />
        <div className="h-10 bg-slate-200 rounded-xl flex-1" />
        <div className="h-10 bg-slate-200 rounded-xl flex-1" />
      </div>
      <div className="glass-card rounded-3xl p-6 border border-white/70 space-y-4 shadow-xs">
        <div className="h-5 bg-slate-200 rounded-md w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-32 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading document preview">
      <div className="h-14 bg-white/80 rounded-2xl border border-slate-200/80" />
      <div className="w-[794px] h-[1123px] max-w-full bg-white rounded-xl border border-slate-200 shadow-md p-12 mx-auto flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Preparing Document Preview...</span>
      </div>
    </div>
  );
}

const SalaryStatementForm = dynamic(
  () => import('./components/SalaryStatementForm').then((mod) => mod.SalaryStatementForm),
  {
    ssr: false,
    loading: () => <FormEditorSkeleton />,
  }
);

const SalaryStatementPreview = dynamic(
  () => import('./components/SalaryStatementPreview').then((mod) => mod.SalaryStatementPreview),
  {
    ssr: false,
    loading: () => <PreviewSkeleton />,
  }
);

const SavedStatementsDrawer = dynamic(
  () => import('./components/SavedStatementsDrawer').then((mod) => mod.SavedStatementsDrawer),
  { ssr: false }
);

const preloadGenerator = () => {
  if (typeof window !== 'undefined') {
    import('./components/SalaryStatementForm');
    import('./components/SalaryStatementPreview');
  }
};

function createInitialDefaultData(
  currentYear: number,
  todayFormatted: string,
  defaultMonths: [string, string, string]
): StatementData {
  return {
    refNo: `MEPG/HR&ADMIN/309/${currentYear}`,
    date: todayFormatted,
    workerId: '4917',
    name: 'Sakib Ahmed Samrat',
    salutation: 'Mr.',
    genderPronoun: 'He',
    designation: 'Executive',
    department: 'HR & Admin',
    companyName: 'Mohammadi Electric Wires and Multi Products (MEP) Limited',
    companyAddress: 'Head Office: MEP Group, 161 Sadar Road, Barishal, Bangladesh.',
    joiningDate: '14th June 2009',
    purpose: 'personal loan from Bank',
    months: [
      {
        monthName: defaultMonths[0],
        grossLabel: 'Gross Salary',
        grossSalary: 44000,
        basicLabel: 'Basic',
        basicSalary: 22000,
        houseRentLabel: 'House Rent',
        houseRent: 13200,
        medicalLabel: 'Medical',
        medical: 4400,
        conveyanceLabel: 'Conveyance',
        conveyance: 4400,
        pfLabel: '(Less) PF',
        pfDeduction: 1848,
        overtimeLabel: 'Over Time',
        overtime: 2933,
        incomeTaxLabel: 'Income Tax',
        incomeTax: 1000,
        netPayableLabel: 'Net Payable=',
        netPayable: 44085,
      },
      {
        monthName: defaultMonths[1],
        grossLabel: 'Gross Salary',
        grossSalary: 44000,
        basicLabel: 'Basic',
        basicSalary: 22000,
        houseRentLabel: 'House Rent',
        houseRent: 13200,
        medicalLabel: 'Medical',
        medical: 4400,
        conveyanceLabel: 'Conveyance',
        conveyance: 4400,
        pfLabel: '(Less) PF',
        pfDeduction: 1848,
        overtimeLabel: 'Over Time',
        overtime: 14986,
        incomeTaxLabel: 'Income Tax',
        incomeTax: 1000,
        netPayableLabel: 'Net Payable=',
        netPayable: 56138,
      },
      {
        monthName: defaultMonths[2],
        grossLabel: 'Gross Salary',
        grossSalary: 44000,
        basicLabel: 'Basic',
        basicSalary: 22000,
        houseRentLabel: 'House Rent',
        houseRent: 13200,
        medicalLabel: 'Medical',
        medical: 4400,
        conveyanceLabel: 'Conveyance',
        conveyance: 4400,
        pfLabel: '(Less) PF',
        pfDeduction: 1848,
        overtimeLabel: 'Over Time',
        overtime: 4400,
        incomeTaxLabel: 'Income Tax',
        incomeTax: 417,
        netPayableLabel: 'Net Payable=',
        netPayable: 46135,
      },
    ],
    // Page 2 specific
    structureBasicLabel: 'Basic',
    structureBasic: 22000,
    structureHouseRentLabel: 'House Rent',
    structureHouseRent: 13200,
    structureMedicalLabel: 'Medical Allowance',
    structureMedical: 4400,
    structureConveyanceLabel: 'Conveyance',
    structureConveyance: 4400,
    structureTotalLabel: 'Total Salary',
    structureTotal: 44000,
    amountInWords: 'Forty-Four Thousand Taka Only.',
    bankName: 'Prime Bank',
    bankAccountNo: '2111212026612',
    monthlyPayableAmount: 41735,
    monthlyPayableInWords: 'Forty- One Thousand Seven Hundred Thirty-Five Taka Only.',
    p2Item2Label: 'Total deduction amount (PF purpose Tk.',
    pfDeductionPage2: 417,
    disclaimer:
      'This certificate is issued at the request of the mentioned employee with no responsibility borne either on the signatory or the company for any kind of financial transactions.',
    // Signatory
    signatoryName: 'Sajjad Hosen',
    signatoryTitle: 'Senior Deputy Manager',
    signatoryDepartment: 'HR & Admin',
    signatoryOrg: 'MEP Group.',
    customRows: createDefaultCustomRows(),
  };
}

export interface SalaryStatementClientProps {
  initialStatementId?: string;
  initialStatements?: any[];
  isExplicitNew?: boolean;
}

export default function SalaryStatementClient({
  initialStatementId,
  initialStatements = [],
  isExplicitNew = false,
}: SalaryStatementClientProps = {}) {
  // Use React 18 transition for non-blocking, instantaneous click transitions
  const [, startTransition] = useTransition();

  const [defaultMonths] = useState<[string, string, string]>(getDefault3Months());

  // Search state for autocomplete in generator
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close worker search autocomplete dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Saved Statements & Active Statement state
  const [activeStatementId, setActiveStatementId] = useState<string | null>(initialStatementId || null);
  const [activeStatementRefNo, setActiveStatementRefNo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [savedStatements, setSavedStatements] = useState<any[]>(initialStatements || []);
  const [savedStatementsTotal, setSavedStatementsTotal] = useState<number>(initialStatements?.length || 0);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);
  const [loadingStatementId, setLoadingStatementId] = useState<string | null>(null);
  const [savedSearchQuery, setSavedSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Main View: 'list' (Settlements-style list) or 'generator' (2-Page Editor & Preview)
  const [mainView, setMainView] = useState<'list' | 'generator'>(() => {
    if (initialStatementId) return 'generator';
    if (isExplicitNew) return 'generator';
    return 'list';
  });

  // Save Success Notification State
  const [saveSuccess, setSaveSuccess] = useState<{
    message: string;
    statementId: string;
    workerName: string;
    refNo: string;
  } | null>(null);

  // Settlements Table Filter States
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'ISSUED'>('ALL');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  // Toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handlePrintRef = useRef<() => void>(() => {});

  // View Mode: 'split', 'form', 'preview'
  const [viewMode, setViewMode] = useState<'split' | 'form' | 'preview'>('split');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('form');
    }
  }, []);

  // Preload generator components in idle time so transitions and prints are instant
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(preloadGenerator);
      } else {
        setTimeout(preloadGenerator, 1000);
      }
    }
  }, []);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'p1' | 'p2' | 'signatory'>('p1');

  // Printable pages refs
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  // Official Letterhead Pad & Print Clearance Settings
  const [padTopMargin, setPadTopMargin] = useState<number>(38); // mm
  const [padBottomMargin, setPadBottomMargin] = useState<number>(28); // mm
  const [padLeftMargin, setPadLeftMargin] = useState<number>(20); // mm
  const [padRightMargin, setPadRightMargin] = useState<number>(20); // mm
  const [logoDisplay, setLogoDisplay] = useState<'blank_space' | 'collapsed' | 'digital_logo'>('blank_space');
  const [headerMode, setHeaderMode] = useState<'company_info' | 'blank_header'>('blank_header');

  const currentYear = new Date().getFullYear();
  const todayFormatted = formatDocDate(new Date());

  const initialDefaultsRef = useRef<StatementData>(
    createInitialDefaultData(currentYear, todayFormatted, defaultMonths)
  );

  const [formData, setFormData] = useState<StatementData>(() =>
    structuredClone(initialDefaultsRef.current)
  );

  // Helper to safely parse and normalize JSON data
  const normalizeStatementData = useCallback((data: any): any => {
    if (!data) return {};
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch {
        return {};
      }
    }
    return typeof data === 'object' && data !== null ? data : {};
  }, []);

  // Update savedStatements when initialStatements change
  useEffect(() => {
    if (initialStatements && initialStatements.length > 0) {
      setSavedStatements(initialStatements);
      setSavedStatementsTotal(initialStatements.length);
    }
  }, [initialStatements]);

  // Counts for Settlements-style tabs (single-pass linear scan)
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let issued = 0;
    const list = (savedStatements || []).filter(Boolean);

    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const raw = normalizeStatementData(s.data);
      const fd = raw && typeof raw === 'object' && raw.formData ? raw.formData : raw || {};
      const st = (s.data?.status || raw?.status || fd.status || 'APPROVED').toUpperCase();
      if (st === 'PENDING') {
        pending++;
      } else if (st === 'ISSUED' || st === 'PAID') {
        issued++;
      } else {
        approved++;
      }
    }

    return {
      all: list.length,
      pending,
      approved,
      issued,
    };
  }, [savedStatements, normalizeStatementData]);

  // Search workers via API with debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchDropdown(false);
      setHighlightedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/workers/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setSearchResults(data.workers || []);
        setShowSearchDropdown(true);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('Failed to search workers:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle selecting a worker to populate defaults
  const handleSelectWorker = useCallback((worker: any) => {
    setSelectedWorker(worker);
    setShowSearchDropdown(false);
    setSearchQuery('');

    const gross = Number(worker.grossSalary) || 44000;
    const basic = Number(worker.basicSalary) || (gross > 0 ? Math.round(gross * 0.5) : 22000);
    const houseRent = Number(worker.houseRent) || (gross > 0 ? Math.round(gross * 0.3) : 13200);
    const medical = Number(worker.medicalAllowance) || (gross > 0 ? Math.round(gross * 0.1) : 4400);
    const conveyance =
      Number(worker.conveyanceAllowance) ||
      (gross > 0 ? Math.max(0, gross - (basic + houseRent + medical)) : 4400);
    const totalStructure = basic + houseRent + medical + conveyance || gross;

    const isFemale = String(worker.gender || '').toUpperCase() === 'FEMALE';
    const salutation = isFemale ? 'Ms.' : 'Mr.';
    const pronoun: 'He' | 'She' = isFemale ? 'She' : 'He';

    const joinDateFormatted = worker.joinDate ? formatOrdinalDate(worker.joinDate) : '14th June 2009';
    const compName =
      worker.company?.name || 'Mohammadi Electric Wires and Multi Products (MEP) Limited';
    const deptName = worker.department?.name || 'HR & Admin';
    const bankName = worker.bankName || 'Prime Bank';
    const accountNo = worker.bankAccountNo || '2111212026612';
    const pfDeduct = Number(worker.pfContribution || worker.pfAmount) || 417;
    const netPayable = Math.max(0, totalStructure - pfDeduct);

    setFormData((prev) => {
      const updated: StatementData = {
        ...prev,
        workerId: worker.workerId || '',
        name: worker.name || '',
        salutation,
        genderPronoun: pronoun,
        designation: worker.designation || 'Staff',
        department: deptName,
        companyName: compName,
        joiningDate: joinDateFormatted,
        structureBasic: basic,
        structureHouseRent: houseRent,
        structureMedical: medical,
        structureConveyance: conveyance,
        structureTotal: totalStructure,
        amountInWords: formatWordsOnly(totalStructure),
        bankName,
        bankAccountNo: accountNo,
        pfDeductionPage2: pfDeduct,
        monthlyPayableAmount: netPayable,
        monthlyPayableInWords: formatWordsOnly(netPayable),
      };
      initialDefaultsRef.current = structuredClone(updated);
      return updated;
    });

    showToast(`Loaded details for ${worker.name}`, 'info');
  }, [showToast]);

  // Reset selected worker to initial standard default
  const handleClearSelectedWorker = useCallback(() => {
    setSelectedWorker(null);
    const standardDefault = createInitialDefaultData(currentYear, todayFormatted, defaultMonths);
    initialDefaultsRef.current = structuredClone(standardDefault);
    setFormData(standardDefault);
    setActiveStatementId(null);
    setActiveStatementRefNo(null);
    setPadTopMargin(38);
    setPadBottomMargin(28);
    setPadLeftMargin(20);
    setPadRightMargin(20);
    setLogoDisplay('blank_space');
    setHeaderMode('blank_header');
  }, [currentYear, todayFormatted, defaultMonths]);

  // Fetch saved statements from server action (only called on drawer search or mutations)
  const fetchSavedStatements = useCallback(async (search = '') => {
    setIsLoadingSaved(true);
    try {
      const res = await getSavedSalaryStatements({
        search: search.trim() || undefined,
        limit: 50,
      });
      if (res.success) {
        setSavedStatements(res.statements || []);
        setSavedStatementsTotal(res.total || 0);
      } else {
        console.error('Failed to load saved statements:', res.error);
      }
    } catch (err) {
      console.error('Failed to load saved statements:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  // Search debounce when drawer is open
  useEffect(() => {
    if (!isDrawerOpen) return;
    const timer = setTimeout(() => {
      fetchSavedStatements(savedSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [savedSearchQuery, isDrawerOpen, fetchSavedStatements]);

  // Load a saved statement into the live editor and preview
  const handleLoadStatement = useCallback(
    async (statement: any, autoPrint = false) => {
      try {
        setLoadingStatementId(statement.id);
        let rawData = normalizeStatementData(statement.data);

        // If statement summary from list does not include raw data, fetch full document by id
        if (!rawData || Object.keys(rawData).length === 0) {
          const fetchRes = await getSalaryStatementById(statement.id);
          if (!fetchRes.success || !fetchRes.statement) {
            showToast(fetchRes.error || 'Failed to retrieve statement details', 'error');
            setLoadingStatementId(null);
            return;
          }
          rawData = normalizeStatementData(fetchRes.statement.data);
        }

        if (!rawData || Object.keys(rawData).length === 0) {
          showToast('No saved document data found in statement', 'error');
          setLoadingStatementId(null);
          return;
        }

        let parsedFormData: any;
        let loadedPadSettings: any = null;

        if (rawData.formData && typeof rawData.formData === 'object') {
          parsedFormData = rawData.formData;
          loadedPadSettings = rawData.padSettings;
        } else if (typeof rawData === 'object') {
          parsedFormData = rawData;
          loadedPadSettings = rawData.padSettings;
        } else {
          showToast('Unrecognized statement data format', 'error');
          setLoadingStatementId(null);
          return;
        }

        let loadedCustomRows: StatementCustomRow[] = [];
        if (Array.isArray(parsedFormData.customRows) && parsedFormData.customRows.length > 0) {
          loadedCustomRows = parsedFormData.customRows;
        } else if (Array.isArray(parsedFormData.months) && parsedFormData.months.length === 3) {
          const m = parsedFormData.months;
          loadedCustomRows = [
            {
              id: 'pf',
              labels: [m[0].pfLabel || '(Less) PF', m[1].pfLabel || '(Less) PF', m[2].pfLabel || '(Less) PF'],
              types: [m[0].pfType || 'deduction', m[1].pfType || 'deduction', m[2].pfType || 'deduction'],
              amounts: [Number(m[0].pfDeduction) || 0, Number(m[1].pfDeduction) || 0, Number(m[2].pfDeduction) || 0],
            },
            {
              id: 'overtime',
              labels: [m[0].overtimeLabel || 'Over Time', m[1].overtimeLabel || 'Over Time', m[2].overtimeLabel || 'Over Time'],
              types: [m[0].overtimeType || 'addition', m[1].overtimeType || 'addition', m[2].overtimeType || 'addition'],
              amounts: [Number(m[0].overtime) || 0, Number(m[1].overtime) || 0, Number(m[2].overtime) || 0],
            },
            {
              id: 'incomeTax',
              labels: [m[0].incomeTaxLabel || 'Income Tax', m[1].incomeTaxLabel || 'Income Tax', m[2].incomeTaxLabel || 'Income Tax'],
              types: [m[0].incomeTaxType || 'deduction', m[1].incomeTaxType || 'deduction', m[2].incomeTaxType || 'deduction'],
              amounts: [Number(m[0].incomeTax) || 0, Number(m[1].incomeTax) || 0, Number(m[2].incomeTax) || 0],
            },
          ];
        }

        setFormData((prev) => {
          const nextMonths =
            Array.isArray(parsedFormData.months) && parsedFormData.months.length === 3
              ? parsedFormData.months
              : prev.months;
          const merged: StatementData = {
            ...prev,
            ...parsedFormData,
            months: nextMonths,
            customRows: loadedCustomRows.length > 0 ? loadedCustomRows : prev.customRows || createDefaultCustomRows(),
          };
          initialDefaultsRef.current = structuredClone(merged);
          return merged;
        });

        if (loadedPadSettings) {
          if (typeof loadedPadSettings.padTopMargin === 'number') setPadTopMargin(loadedPadSettings.padTopMargin);
          if (typeof loadedPadSettings.padBottomMargin === 'number') setPadBottomMargin(loadedPadSettings.padBottomMargin);
          if (typeof loadedPadSettings.padLeftMargin === 'number') setPadLeftMargin(loadedPadSettings.padLeftMargin);
          if (typeof loadedPadSettings.padRightMargin === 'number') setPadRightMargin(loadedPadSettings.padRightMargin);
          if (loadedPadSettings.logoDisplay) setLogoDisplay(loadedPadSettings.logoDisplay);
          if (loadedPadSettings.headerMode) setHeaderMode(loadedPadSettings.headerMode);
        }

        setActiveStatementId(statement.id);
        setActiveStatementRefNo(statement.refNo);
        setIsDrawerOpen(false);

        showToast(`Loaded statement "${statement.refNo}" for ${statement.name}.`, 'success');

        if (autoPrint) {
          setTimeout(() => {
            try {
              handlePrintRef.current();
            } finally {
              setLoadingStatementId(null);
            }
          }, 350);
        } else {
          setLoadingStatementId(null);
        }
      } catch (err: any) {
        console.error('Failed to load statement:', err);
        showToast('Failed to load salary statement data', 'error');
        setLoadingStatementId(null);
      }
    },
    [showToast, normalizeStatementData]
  );

  // Auto-load statement if initialStatementId was provided via route/query param
  useEffect(() => {
    if (initialStatementId) {
      const loadInitial = async () => {
        try {
          const res = await getSalaryStatementById(initialStatementId);
          if (res.success && res.statement) {
            handleLoadStatement(res.statement);
          }
        } catch (err) {
          console.error('Failed to auto-load statement from ID:', err);
        }
      };
      loadInitial();
    }
  }, [initialStatementId, handleLoadStatement]);

  // Save / Update Statement
  const handleSaveStatement = useCallback(
    async (asNewCopy = false) => {
      setIsSaving(true);
      try {
        const targetId = asNewCopy ? undefined : activeStatementId || undefined;
        const payload = {
          id: targetId,
          refNo: formData.refNo,
          workerId: formData.workerId,
          name: formData.name,
          designation: formData.designation,
          department: formData.department,
          statementDate: formData.date,
          data: {
            formData,
            padSettings: {
              padTopMargin,
              padBottomMargin,
              padLeftMargin,
              padRightMargin,
              logoDisplay,
              headerMode,
            },
            savedAt: new Date().toISOString(),
            status: 'APPROVED',
          },
        };

        const res = await saveSalaryStatement(payload);
        if (res.success && res.statement) {
          const savedStmt = res.statement;
          setActiveStatementId(savedStmt.id);
          setActiveStatementRefNo(savedStmt.refNo);

          setSavedStatements((prev) => {
            const withoutCurrent = prev.filter((s) => s.id !== savedStmt.id);
            return [savedStmt, ...withoutCurrent];
          });
          setSavedStatementsTotal((prev) => (asNewCopy ? prev + 1 : Math.max(prev, 1)));

          setSaveSuccess({
            message: asNewCopy
              ? `Salary statement copy saved successfully!`
              : targetId
              ? `Salary statement updated successfully!`
              : `Salary statement saved successfully!`,
            statementId: savedStmt.id,
            workerName: formData.name,
            refNo: savedStmt.refNo,
          });

          startTransition(() => {
            setMainView('list');
          });

          showToast(
            asNewCopy
              ? `Statement saved as a new copy: ${savedStmt.refNo}`
              : targetId
              ? `Statement updated successfully: ${savedStmt.refNo}`
              : `Statement saved successfully: ${savedStmt.refNo}`,
            'success'
          );
          fetchSavedStatements(tableSearchQuery);
        } else {
          showToast(res.error || 'Failed to save salary statement', 'error');
        }
      } catch (err: any) {
        console.error('Failed to save statement:', err);
        showToast(err.message || 'An error occurred while saving', 'error');
      } finally {
        setIsSaving(false);
      }
    },
    [
      activeStatementId,
      formData,
      padTopMargin,
      padBottomMargin,
      padLeftMargin,
      padRightMargin,
      logoDisplay,
      headerMode,
      tableSearchQuery,
      fetchSavedStatements,
      showToast,
    ]
  );

  // Delete saved statement
  const handleDeleteStatement = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setDeletingId(id);
      try {
        const res = await deleteSalaryStatement(id);
        if (res.success) {
          showToast('Salary statement deleted successfully', 'success');
          if (activeStatementId === id) {
            setActiveStatementId(null);
            setActiveStatementRefNo(null);
          }
          if (saveSuccess?.statementId === id) {
            setSaveSuccess(null);
          }
          setDeleteConfirmId(null);
          setSavedStatements((prev) => prev.filter((s) => s.id !== id));
          setSavedStatementsTotal((prev) => Math.max(0, prev - 1));
          fetchSavedStatements(tableSearchQuery);
        } else {
          showToast(res.error || 'Failed to delete salary statement', 'error');
        }
      } catch (err: any) {
        console.error('Failed to delete statement:', err);
        showToast(err.message || 'An error occurred while deleting', 'error');
      } finally {
        setDeletingId(null);
      }
    },
    [activeStatementId, saveSuccess?.statementId, tableSearchQuery, fetchSavedStatements, showToast]
  );

  // Start fresh / new statement session
  const handleStartNewStatement = useCallback(() => {
    preloadGenerator();
    startTransition(() => {
      handleClearSelectedWorker();
      setActiveStatementId(null);
      setActiveStatementRefNo(null);
      setSaveSuccess(null);
      setMainView('generator');
    });
    showToast('Started new salary statement session.', 'info');
  }, [handleClearSelectedWorker, showToast]);

  // Edit statement from Settlements-style table
  const handleEditFromTable = useCallback(
    async (statementId: string) => {
      preloadGenerator();
      const target = savedStatements.find((s) => s.id === statementId);
      if (target) {
        await handleLoadStatement(target, false);
      } else {
        const res = await getSalaryStatementById(statementId);
        if (res.success && res.statement) {
          await handleLoadStatement(res.statement, false);
        }
      }
      startTransition(() => {
        setMainView('generator');
      });
    },
    [savedStatements, handleLoadStatement]
  );

  // Print statement from Settlements-style table
  const handlePrintFromTable = useCallback(
    async (statementId: string) => {
      if (loadingStatementId) return;
      try {
        preloadGenerator();
        setLoadingStatementId(statementId);
        const target = savedStatements.find((s) => s.id === statementId);
        if (target && target.data) {
          await handleLoadStatement(target, true);
        } else {
          const res = await getSalaryStatementById(statementId);
          if (res.success && res.statement) {
            await handleLoadStatement(res.statement, true);
          } else {
            showToast(res.error || 'Failed to retrieve statement details', 'error');
            setLoadingStatementId(null);
          }
        }
      } catch (err: any) {
        console.error('Failed to print statement:', err);
        showToast('Failed to load statement for print', 'error');
        setLoadingStatementId(null);
      }
    },
    [loadingStatementId, savedStatements, handleLoadStatement, showToast]
  );

  // Quick status update from table
  const handleStatusChange = useCallback(
    async (statementId: string, newStatus: string) => {
      try {
        const res = await updateSalaryStatementStatus(statementId, newStatus);
        if (res.success) {
          setSavedStatements((prev) =>
            prev.map((s) => {
              if (s.id !== statementId) return s;
              const currentData = normalizeStatementData(s.data);
              const currentFormData =
                typeof currentData.formData === 'object' && currentData.formData !== null
                  ? currentData.formData
                  : {};
              const updatedData = {
                ...currentData,
                status: newStatus,
                formData: {
                  ...currentFormData,
                  status: newStatus,
                },
              };
              return { ...s, data: updatedData };
            })
          );
          showToast(`Status updated to ${newStatus}`, 'success');
        } else {
          showToast(res.error || 'Failed to update status', 'error');
        }
      } catch (err: any) {
        console.error('Failed to update status:', err);
        showToast(err?.message || 'Failed to update status', 'error');
      }
    },
    [normalizeStatementData, showToast]
  );

  // Helper resetting a single field on StatementData
  const handleResetField = useCallback((field: keyof StatementData) => {
    if (initialDefaultsRef.current) {
      setFormData((prev) => ({
        ...prev,
        [field]: initialDefaultsRef.current[field],
      }));
    }
  }, []);

  const handleResetAllCustomLabels = useCallback(() => {
    setFormData((prev) => {
      const defaultRows = initialDefaultsRef.current?.customRows
        ? structuredClone(initialDefaultsRef.current.customRows)
        : createDefaultCustomRows();
      const updatedMonths = prev.months.map((m, idx) => ({
        ...m,
        netPayable: computeNetPayable(m.grossSalary, idx as 0 | 1 | 2, defaultRows),
      })) as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
      const latestNet = updatedMonths[2].netPayable;
      return {
        ...prev,
        customRows: defaultRows,
        months: updatedMonths,
        monthlyPayableAmount: latestNet,
        monthlyPayableInWords: formatWordsOnly(latestNet),
      };
    });
  }, []);

  const handleSyncCustomLabels = useCallback((fromIndex: 0 | 1 | 2 = 0) => {
    setFormData((prev) => {
      const existingRows = prev.customRows || [];
      const updatedRows = existingRows.map((r) => {
        const srcLabel = r.labels[fromIndex];
        const srcType = r.types[fromIndex];
        return {
          ...r,
          labels: [srcLabel, srcLabel, srcLabel] as [string, string, string],
          types: [srcType, srcType, srcType] as [
            'deduction' | 'addition',
            'deduction' | 'addition',
            'deduction' | 'addition',
          ],
        };
      });
      const updatedMonths = prev.months.map((m, idx) => ({
        ...m,
        netPayable: computeNetPayable(m.grossSalary, idx as 0 | 1 | 2, updatedRows),
      })) as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
      const latestNet = updatedMonths[2].netPayable;
      return {
        ...prev,
        customRows: updatedRows,
        months: updatedMonths,
        monthlyPayableAmount: latestNet,
        monthlyPayableInWords: formatWordsOnly(latestNet),
      };
    });
  }, []);

  const handleResetRowLabel = useCallback(
    (
      monthIdx: 0 | 1 | 2,
      field:
        | 'pfLabel'
        | 'overtimeLabel'
        | 'incomeTaxLabel'
        | 'grossLabel'
        | 'basicLabel'
        | 'houseRentLabel'
        | 'medicalLabel'
        | 'conveyanceLabel'
        | 'netPayableLabel'
    ) => {
      const defaults: Record<string, string> = {
        pfLabel: '(Less) PF',
        overtimeLabel: 'Over Time',
        incomeTaxLabel: 'Income Tax',
        grossLabel: 'Gross Salary',
        basicLabel: 'Basic',
        houseRentLabel: 'House Rent',
        medicalLabel: 'Medical',
        conveyanceLabel: 'Conveyance',
        netPayableLabel: 'Net Payable=',
      };
      setFormData((prev) => {
        const next = [...prev.months] as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
        next[monthIdx] = { ...next[monthIdx], [field]: defaults[field] || '' };
        return { ...prev, months: next };
      });
    },
    []
  );

  const handleResetMonthAmount = useCallback(
    (monthIdx: 0 | 1 | 2, field: keyof MonthBreakdown) => {
      const initial = initialDefaultsRef.current?.months[monthIdx][field];
      if (initial !== undefined) {
        setFormData((prev) => {
          const next = [...prev.months] as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
          next[monthIdx] = { ...next[monthIdx], [field]: initial };
          return { ...prev, months: next };
        });
      }
    },
    []
  );

  const handleResetNetPayable = useCallback((monthIdx: 0 | 1 | 2) => {
    setFormData((prev) => {
      const updatedMonths = [...prev.months] as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
      const currentMonth = { ...updatedMonths[monthIdx] };
      currentMonth.netPayable = computeNetPayable(currentMonth.grossSalary, monthIdx, prev.customRows);
      currentMonth.netPayableLabel = 'Net Payable=';
      updatedMonths[monthIdx] = currentMonth;
      const latestNet = updatedMonths[2].netPayable;
      return {
        ...prev,
        months: updatedMonths,
        monthlyPayableAmount: latestNet,
        monthlyPayableInWords: formatWordsOnly(latestNet),
      };
    });
  }, []);

  const handleResetAllTable = useCallback(() => {
    if (initialDefaultsRef.current) {
      setFormData((prev) => ({
        ...prev,
        months: structuredClone(initialDefaultsRef.current.months),
        customRows: structuredClone(
          initialDefaultsRef.current.customRows || createDefaultCustomRows()
        ),
        monthlyPayableAmount: initialDefaultsRef.current.monthlyPayableAmount,
        monthlyPayableInWords: initialDefaultsRef.current.monthlyPayableInWords,
      }));
    }
  }, []);

  const handleResetEntireDocument = useCallback(() => {
    if (initialDefaultsRef.current) {
      setFormData(structuredClone(initialDefaultsRef.current));
    }
  }, []);

  const handleResetSalaryStructure = useCallback(() => {
    if (initialDefaultsRef.current) {
      const init = initialDefaultsRef.current;
      setFormData((prev) => ({
        ...prev,
        structureBasicLabel: init.structureBasicLabel || 'Basic',
        structureBasic: init.structureBasic,
        structureHouseRentLabel: init.structureHouseRentLabel || 'House Rent',
        structureHouseRent: init.structureHouseRent,
        structureMedicalLabel: init.structureMedicalLabel || 'Medical Allowance',
        structureMedical: init.structureMedical,
        structureConveyanceLabel: init.structureConveyanceLabel || 'Conveyance',
        structureConveyance: init.structureConveyance,
        structureTotalLabel: init.structureTotalLabel || 'Total Salary',
        structureTotal: init.structureTotal,
        amountInWords: init.amountInWords,
        monthlyPayableAmount: init.monthlyPayableAmount,
        monthlyPayableInWords: init.monthlyPayableInWords,
        pfDeductionPage2: init.pfDeductionPage2,
        p2Item2Label: init.p2Item2Label || 'Total deduction amount (PF purpose Tk.',
      }));
    }
  }, []);

  const handleResetStructureRow = useCallback(
    (
      labelField:
        | 'structureBasicLabel'
        | 'structureHouseRentLabel'
        | 'structureMedicalLabel'
        | 'structureConveyanceLabel'
        | 'structureTotalLabel',
      defaultLabel: string,
      amountField?:
        | 'structureBasic'
        | 'structureHouseRent'
        | 'structureMedical'
        | 'structureConveyance'
        | 'structureTotal'
    ) => {
      setFormData((prev) => {
        const next = { ...prev, [labelField]: defaultLabel };
        if (amountField && initialDefaultsRef.current) {
          (next as any)[amountField] = (initialDefaultsRef.current as any)[amountField];
          const total =
            Number(next.structureBasic || 0) +
            Number(next.structureHouseRent || 0) +
            Number(next.structureMedical || 0) +
            Number(next.structureConveyance || 0);
          next.structureTotal = total;
          next.amountInWords = formatWordsOnly(total);
          const net = Math.max(0, total - Number(next.pfDeductionPage2 || 0));
          next.monthlyPayableAmount = net;
          next.monthlyPayableInWords = formatWordsOnly(net);
        }
        return next;
      });
    },
    []
  );

  const handleStructureChange = useCallback(
    (
      field: 'structureBasic' | 'structureHouseRent' | 'structureMedical' | 'structureConveyance',
      val: number
    ) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: val };
        const total =
          Number(next.structureBasic || 0) +
          Number(next.structureHouseRent || 0) +
          Number(next.structureMedical || 0) +
          Number(next.structureConveyance || 0);
        next.structureTotal = total;
        next.amountInWords = formatWordsOnly(total);
        const net = Math.max(0, total - Number(next.pfDeductionPage2 || 0));
        next.monthlyPayableAmount = net;
        next.monthlyPayableInWords = formatWordsOnly(net);
        return next;
      });
    },
    []
  );

  const handlePage2PfChange = useCallback((val: number) => {
    setFormData((prev) => {
      const net = Math.max(0, Number(prev.structureTotal || 0) - val);
      return {
        ...prev,
        pfDeductionPage2: val,
        monthlyPayableAmount: net,
        monthlyPayableInWords: formatWordsOnly(net),
      };
    });
  }, []);

  const handleMonthChange = useCallback(
    (index: 0 | 1 | 2, field: keyof MonthBreakdown, val: string | number | undefined) => {
      setFormData((prev) => {
        const updatedMonths = [...prev.months] as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
        const currentMonth = { ...updatedMonths[index], [field]: val };

        if (['basicSalary', 'houseRent', 'medical', 'conveyance'].includes(field)) {
          currentMonth.grossSalary =
            (Number(currentMonth.basicSalary) || 0) +
            (Number(currentMonth.houseRent) || 0) +
            (Number(currentMonth.medical) || 0) +
            (Number(currentMonth.conveyance) || 0);
        }

        if (field !== 'netPayable' && field !== 'monthName' && field !== 'netPayableLabel') {
          currentMonth.netPayable = computeNetPayable(currentMonth.grossSalary, index, prev.customRows);
        }

        updatedMonths[index] = currentMonth;
        const latestNet = updatedMonths[2].netPayable;
        return {
          ...prev,
          months: updatedMonths,
          monthlyPayableAmount: latestNet,
          monthlyPayableInWords: formatWordsOnly(latestNet),
        };
      });
    },
    []
  );

  const handleAddCustomRow = useCallback(() => {
    setFormData((prev) => {
      const existingRows = prev.customRows || [];
      const newId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newRow = {
        id: newId,
        labels: ['Other Deduction', 'Other Deduction', 'Other Deduction'] as [string, string, string],
        types: ['deduction', 'deduction', 'deduction'] as [
          'deduction' | 'addition',
          'deduction' | 'addition',
          'deduction' | 'addition',
        ],
        amounts: [0, 0, 0] as [number, number, number],
      };
      const updatedRows = [...existingRows, newRow];
      const updatedMonths = prev.months.map((m, idx) => ({
        ...m,
        netPayable: computeNetPayable(m.grossSalary, idx as 0 | 1 | 2, updatedRows),
      })) as [MonthBreakdown, MonthBreakdown, MonthBreakdown];

      const latestNet = updatedMonths[2].netPayable;
      return {
        ...prev,
        customRows: updatedRows,
        months: updatedMonths,
        monthlyPayableAmount: latestNet,
        monthlyPayableInWords: formatWordsOnly(latestNet),
      };
    });
  }, []);

  const handleRemoveCustomRow = useCallback((rowId: string) => {
    setFormData((prev) => {
      const existingRows = prev.customRows || [];
      const updatedRows = existingRows.filter((r) => r.id !== rowId);
      const updatedMonths = prev.months.map((m, idx) => ({
        ...m,
        netPayable: computeNetPayable(m.grossSalary, idx as 0 | 1 | 2, updatedRows),
      })) as [MonthBreakdown, MonthBreakdown, MonthBreakdown];

      const latestNet = updatedMonths[2].netPayable;
      return {
        ...prev,
        customRows: updatedRows,
        months: updatedMonths,
        monthlyPayableAmount: latestNet,
        monthlyPayableInWords: formatWordsOnly(latestNet),
      };
    });
  }, []);

  const handleToggleCustomRowType = useCallback(
    (rowId: string, monthIdx: 0 | 1 | 2, targetType?: 'addition' | 'deduction') => {
      setFormData((prev) => {
        const existingRows = prev.customRows || [];
        const updatedRows = existingRows.map((r) => {
          if (r.id !== rowId) return r;
          const currentType = r.types[monthIdx] || 'deduction';
          const newType = targetType || (currentType === 'deduction' ? 'addition' : 'deduction');
          const newTypes = [...r.types] as [
            'deduction' | 'addition',
            'deduction' | 'addition',
            'deduction' | 'addition',
          ];
          newTypes[monthIdx] = newType;
          return { ...r, types: newTypes };
        });

        const updatedMonths = prev.months.map((m, idx) => ({
          ...m,
          netPayable: computeNetPayable(m.grossSalary, idx as 0 | 1 | 2, updatedRows),
        })) as [MonthBreakdown, MonthBreakdown, MonthBreakdown];

        const latestNet = updatedMonths[2].netPayable;
        return {
          ...prev,
          customRows: updatedRows,
          months: updatedMonths,
          monthlyPayableAmount: latestNet,
          monthlyPayableInWords: formatWordsOnly(latestNet),
        };
      });
    },
    []
  );

  const handleCustomRowLabelChange = useCallback((rowId: string, monthIdx: 0 | 1 | 2, val: string) => {
    setFormData((prev) => {
      const existingRows = prev.customRows || [];
      const updatedRows = existingRows.map((r) => {
        if (r.id !== rowId) return r;
        const newLabels = [...r.labels] as [string, string, string];
        newLabels[monthIdx] = val;
        return { ...r, labels: newLabels };
      });
      return { ...prev, customRows: updatedRows };
    });
  }, []);

  const handleCustomRowAmountChange = useCallback((rowId: string, monthIdx: 0 | 1 | 2, val: number) => {
    setFormData((prev) => {
      const existingRows = prev.customRows || [];
      const updatedRows = existingRows.map((r) => {
        if (r.id !== rowId) return r;
        const newAmounts = [...r.amounts] as [number, number, number];
        newAmounts[monthIdx] = val;
        return { ...r, amounts: newAmounts };
      });

      const updatedMonths = prev.months.map((m, idx) => ({
        ...m,
        netPayable: computeNetPayable(m.grossSalary, idx as 0 | 1 | 2, updatedRows),
      })) as [MonthBreakdown, MonthBreakdown, MonthBreakdown];

      const latestNet = updatedMonths[2].netPayable;
      return {
        ...prev,
        customRows: updatedRows,
        months: updatedMonths,
        monthlyPayableAmount: latestNet,
        monthlyPayableInWords: formatWordsOnly(latestNet),
      };
    });
  }, []);

  const handleResetCustomRowLabel = useCallback((rowId: string, monthIdx: 0 | 1 | 2) => {
    const initRow = initialDefaultsRef.current.customRows?.find((r) => r.id === rowId);
    const fallback =
      rowId === 'pf'
        ? '(Less) PF'
        : rowId === 'overtime'
        ? 'Over Time'
        : rowId === 'incomeTax'
        ? 'Income Tax'
        : 'Other Deduction';
    const defaultLabel = initRow?.labels[monthIdx] || fallback;
    handleCustomRowLabelChange(rowId, monthIdx, defaultLabel);
  }, [handleCustomRowLabelChange]);

  const handleResetCustomRowAmount = useCallback((rowId: string, monthIdx: 0 | 1 | 2) => {
    const initRow = initialDefaultsRef.current.customRows?.find((r) => r.id === rowId);
    const defaultAmount = initRow?.amounts[monthIdx] ?? 0;
    handleCustomRowAmountChange(rowId, monthIdx, defaultAmount);
  }, [handleCustomRowAmountChange]);

  // Download 2-Page PDF
  const handleDownloadPdf = async () => {
    if (!page1Ref.current || !page2Ref.current) return;
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsGeneratingPdf(true);

    if (page1Ref.current.parentElement) {
      page1Ref.current.parentElement.scrollLeft = 0;
    }
    if (page2Ref.current.parentElement) {
      page2Ref.current.parentElement.scrollLeft = 0;
    }

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const canvas1 = await html2canvas(page1Ref.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const img1 = canvas1.toDataURL('image/jpeg', 0.95);
      pdf.addImage(img1, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

      const canvas2 = await html2canvas(page2Ref.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const img2 = canvas2.toDataURL('image/jpeg', 0.95);
      pdf.addPage('a4', 'portrait');
      pdf.addImage(img2, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

      const sanitizedName = formData.name.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Salary_Statement_${formData.workerId}_${sanitizedName}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not generate PDF download directly. You can use the Print / Save as PDF button.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Reset scroll before print
  useEffect(() => {
    const handleBeforePrint = () => {
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if (page1Ref.current?.parentElement) {
        page1Ref.current.parentElement.scrollLeft = 0;
      }
      if (page2Ref.current?.parentElement) {
        page2Ref.current.parentElement.scrollLeft = 0;
      }
      document.querySelectorAll('.salary-doc-page-wrapper').forEach((el) => {
        (el as HTMLElement).scrollLeft = 0;
      });
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  const handlePrint = useCallback(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (page1Ref.current?.parentElement) {
      page1Ref.current.parentElement.scrollLeft = 0;
    }
    if (page2Ref.current?.parentElement) {
      page2Ref.current.parentElement.scrollLeft = 0;
    }
    document.querySelectorAll('.salary-doc-page-wrapper').forEach((el) => {
      (el as HTMLElement).scrollLeft = 0;
    });
    window.print();
  }, []);

  handlePrintRef.current = handlePrint;

  return (
    <div className="salary-statement-root min-h-screen bg-transparent print:bg-white text-slate-900 pb-16 print:p-0 print:m-0 print:min-h-0 print:pb-0">
      {/* Print CSS styles and document table typography */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .salary-doc-page table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          width: 100% !important;
        }
        .salary-doc-page table th,
        .salary-doc-page table td {
          border: 1px solid #000000 !important;
          vertical-align: middle !important;
          line-height: 1.35 !important;
          padding-top: 6px !important;
          padding-bottom: 6px !important;
          padding-left: 6px !important;
          padding-right: 6px !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }
        .salary-doc-title-underline,
        .salary-doc-page u,
        .salary-doc-page .underline,
        .salary-doc-page [class*="underline"] {
          text-decoration: none !important;
          text-decoration-line: none !important;
          -webkit-text-decoration-line: none !important;
          border-bottom: 1.5px solid #000000 !important;
          padding-bottom: 2px !important;
          display: inline-block !important;
          line-height: 1.15 !important;
          vertical-align: baseline !important;
        }
        .salary-doc-page-2 table td {
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
        .salary-doc-page table td *,
        .salary-doc-page table th * {
          overflow: visible !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-pages-container,
          #printable-pages-container * {
            visibility: visible !important;
          }
          #printable-pages-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          .salary-doc-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .salary-doc-page-2 {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .print\\:hidden,
          .inline-reset-btn,
          .sheet-reset-btn,
          .on-sheet-toolbar {
            display: none !important;
          }
        }
      `,
        }}
      />

      {/* Top Navbar & Action Bar */}
      <div className="glass-header sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/payroll"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition border border-transparent hover:border-blue-100"
              title="Back to Payroll"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
                  Payroll Module
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">2-Page Statement & Certificate</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Salary Statements</h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Statements List vs Generator */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setMainView('list');
                  });
                }}
                className={`whitespace-nowrap shrink-0 min-h-[40px] px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  mainView === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={15} className="text-blue-600" />
                <span>All Statements</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {counts.all}
                </span>
              </button>
              <button
                type="button"
                onMouseEnter={preloadGenerator}
                onClick={() => {
                  preloadGenerator();
                  startTransition(() => {
                    setMainView('generator');
                  });
                }}
                className={`whitespace-nowrap shrink-0 min-h-[40px] px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  mainView === 'generator'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <Sparkles size={15} className="text-indigo-600" />
                <span>Statement Generator</span>
              </button>
            </div>

            {/* New Statement Button */}
            <button
              type="button"
              onMouseEnter={preloadGenerator}
              onClick={handleStartNewStatement}
              className="min-h-[44px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20"
            >
              <Plus size={17} /> New Statement
            </button>

            {mainView === 'generator' && (
              <>
                {/* View Mode Toggle (Split / Form / Preview) */}
                <div className="hidden lg:flex items-center bg-slate-100/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/70 text-xs font-bold">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      viewMode === 'split' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Split View
                  </button>
                  <button
                    onClick={() => setViewMode('form')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      viewMode === 'form' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Form Only
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      viewMode === 'preview' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Preview Only
                  </button>
                </div>

                {/* Save / Update Button */}
                {activeStatementId ? (
                  <div className="inline-flex items-center rounded-xl bg-emerald-600 p-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => handleSaveStatement(false)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                      title="Update existing statement in database"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>Update</span>
                    </button>
                    <div className="w-px h-5 bg-emerald-500/80 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => handleSaveStatement(true)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1 px-2.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold text-emerald-100 hover:text-white hover:bg-emerald-700 transition disabled:opacity-50"
                      title="Save as a new copy"
                    >
                      <Copy size={13} />
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveStatement(false)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>Save</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold shadow-xs transition hover:border-slate-300"
                >
                  <Bookmark size={15} className="text-blue-600" />
                  <span>Saved</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {savedStatementsTotal}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settlements-style Success Banner */}
      {saveSuccess && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 print:hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">{saveSuccess.message}</span>
                  <span className="font-mono text-xs bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-semibold">
                    {saveSuccess.refNo}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Record for <strong>{saveSuccess.workerName}</strong> has been registered in the salary statements list.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setMainView('list');
                  });
                }}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl font-bold text-xs transition"
              >
                View Statements
              </button>
              <button
                type="button"
                onClick={() => handlePrintFromTable(saveSuccess.statementId)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer size={14} /> Print Certificate
              </button>
              <button
                type="button"
                onClick={() => setSaveSuccess(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-100 transition"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Edit Session Indicator Banner */}
      {mainView === 'generator' && activeStatementId && activeStatementRefNo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 print:hidden">
          <div className="bg-blue-50/90 border border-blue-200 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2 text-blue-950 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span className="truncate">
                Editing saved statement: <strong className="font-mono">{activeStatementRefNo}</strong> ({formData.name})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSaveStatement(true)}
                disabled={isSaving}
                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs hover:bg-blue-50 transition"
                title="Save current modifications as a duplicate copy"
              >
                <Copy size={13} /> Save as New Copy
              </button>
              <button
                type="button"
                onClick={handleStartNewStatement}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs hover:bg-white transition"
                title="Start a fresh unsaved document without modifying this record"
              >
                <Plus size={13} /> New Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="salary-statement-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 print:p-0 print:m-0 print:max-w-none print:w-full space-y-6">
        {/* Settlements-style Table Section */}
        {mainView === 'list' && (
          <SalaryStatementTable
            statements={savedStatements}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            tableSearchQuery={tableSearchQuery}
            onTableSearchChange={setTableSearchQuery}
            counts={counts}
            onEdit={handleEditFromTable}
            onPrint={handlePrintFromTable}
            onDelete={handleDeleteStatement}
            onStatusChange={handleStatusChange}
            onNewStatement={handleStartNewStatement}
            onPreloadGenerator={preloadGenerator}
            loadingStatementId={loadingStatementId}
            deleteConfirmId={deleteConfirmId}
            onSetDeleteConfirmId={setDeleteConfirmId}
            deletingId={deletingId}
            normalizeStatementData={normalizeStatementData}
          />
        )}

        {/* Generator Workspace (Form + Preview) - Rendered only when active or preparing print */}
        {(mainView === 'generator' || Boolean(loadingStatementId)) && (
          <div
            className={
              mainView === 'list'
                ? 'salary-statement-generator-wrapper print:block'
                : 'salary-statement-generator-wrapper block space-y-6'
            }
          >
            {mainView === 'generator' && (
            <>
              {/* Header row in generator: Back to statements list button */}
              <div className="flex items-center justify-between print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setMainView('list');
                    });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-xl transition shadow-xs"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Statements List ({counts.all})</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Interactive 2-Page Document Editor</span>
                </div>
              </div>

              {/* Worker Quick Search Bar */}
              <div
                ref={searchContainerRef}
                className="glass-card p-4 rounded-3xl shadow-sm border border-white/70 mb-6 print:hidden relative z-30"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 relative">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Auto-Fill From Employee Record
                    </label>
                    <div className="relative">
                      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by Employee ID, Name, or Phone (e.g. 4917 or Sakib)..."
                        value={searchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchQuery(val);
                          if (val.trim().length > 0) {
                            setShowSearchDropdown(true);
                          } else {
                            setShowSearchDropdown(false);
                            setSearchResults([]);
                            setHighlightedIndex(-1);
                          }
                        }}
                        onFocus={() => {
                          if (searchQuery.trim().length > 0) {
                            setShowSearchDropdown(true);
                          }
                        }}
                        onClick={() => {
                          if (searchQuery.trim().length > 0) {
                            setShowSearchDropdown(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowSearchDropdown(false);
                          } else if (e.key === 'ArrowDown') {
                            if (!showSearchDropdown && searchResults.length > 0) {
                              setShowSearchDropdown(true);
                            } else if (searchResults.length > 0) {
                              e.preventDefault();
                              setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
                            }
                          } else if (e.key === 'ArrowUp') {
                            if (searchResults.length > 0) {
                              e.preventDefault();
                              setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
                            }
                          } else if (e.key === 'Enter') {
                            if (showSearchDropdown && searchResults.length > 0) {
                              e.preventDefault();
                              const targetWorker =
                                highlightedIndex >= 0 ? searchResults[highlightedIndex] : searchResults[0];
                              if (targetWorker) {
                                handleSelectWorker(targetWorker);
                              }
                            }
                          }
                        }}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                      {isSearching ? (
                        <Loader2
                          size={16}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin"
                        />
                      ) : searchQuery.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                            setShowSearchDropdown(false);
                            setHighlightedIndex(-1);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                          title="Clear search"
                        >
                          <X size={15} />
                        </button>
                      ) : null}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showSearchDropdown && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {searchResults.map((worker, idx) => (
                          <button
                            type="button"
                            key={worker.id}
                            onClick={() => handleSelectWorker(worker)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`w-full px-4 py-3 text-left transition flex items-center justify-between group ${
                              highlightedIndex === idx ? 'bg-blue-50' : 'hover:bg-blue-50/70'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-gray-900 group-hover:text-blue-700 text-sm">
                                {worker.name}{' '}
                                <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded ml-1">
                                  ID: {worker.workerId}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {worker.designation || 'Staff'} • {worker.department?.name || 'Department'} •{' '}
                                {worker.company?.name || 'Company'}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-emerald-600 block">
                                Gross: {(worker.grossSalary || 0).toLocaleString()} BDT
                              </span>
                              <span className="text-[11px] text-gray-400 group-hover:text-blue-600 font-medium">
                                Click to Select
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {showSearchDropdown && isSearching && searchResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                        <Loader2 size={15} className="text-blue-500 animate-spin" />
                        <span>Searching employee ID or name...</span>
                      </div>
                    )}

                    {showSearchDropdown && !isSearching && searchQuery.trim().length >= 1 && searchResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 text-center text-xs text-slate-500 font-medium">
                        No employee found matching &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>

                  {selectedWorker && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-blue-900">
                        <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                        <span>
                          Loaded <strong>{selectedWorker.name}</strong> ({selectedWorker.workerId})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelectedWorker}
                        className="text-blue-700 hover:text-blue-900 underline font-semibold ml-2"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile View Mode Switcher (<1024px) */}
              <div className="flex lg:hidden items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 text-xs font-bold w-full gap-2 shadow-xs mb-6 print:hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('form')}
                  className={`flex-1 py-2.5 px-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition ${
                    viewMode === 'form' || viewMode === 'split'
                      ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  <FileText size={16} />
                  <span>Form Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`flex-1 py-2.5 px-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2 transition ${
                    viewMode === 'preview'
                      ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  <Eye size={16} />
                  <span>Document Preview</span>
                </button>
              </div>
            </>
          )}

          {/* Workspace Layout */}
          <div
            className={`salary-statement-grid ${
              mainView === 'list'
                ? 'print:block print:m-0 print:p-0'
                : `grid gap-8 print:block print:m-0 print:p-0 print:gap-0 ${
                    viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
                  }`
            }`}
          >
            {/* Left Column: Form Editor */}
            {mainView === 'generator' && (viewMode === 'split' || viewMode === 'form') && (
              <div
                className={
                  viewMode === 'split'
                    ? 'lg:col-span-5 space-y-6 print:hidden'
                    : 'max-w-4xl mx-auto space-y-6 print:hidden w-full'
                }
              >
                <SalaryStatementForm
                  formData={formData}
                  setFormData={setFormData}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  padTopMargin={padTopMargin}
                  setPadTopMargin={setPadTopMargin}
                  padBottomMargin={padBottomMargin}
                  setPadBottomMargin={setPadBottomMargin}
                  logoDisplay={logoDisplay}
                  setLogoDisplay={setLogoDisplay}
                  headerMode={headerMode}
                  setHeaderMode={setHeaderMode}
                  initialDefaults={initialDefaultsRef.current}
                  activeStatementId={activeStatementId}
                  isSaving={isSaving}
                  isGeneratingPdf={isGeneratingPdf}
                  onSave={handleSaveStatement}
                  onDownloadPdf={handleDownloadPdf}
                  onPrint={handlePrint}
                  onResetField={handleResetField}
                />
              </div>
            )}

            {/* Right Column: 2-Page Document Preview */}
            <SalaryStatementPreview
              formData={formData}
              setFormData={setFormData}
              initialDefaults={initialDefaultsRef.current}
              padTopMargin={padTopMargin}
              setPadTopMargin={setPadTopMargin}
              padBottomMargin={padBottomMargin}
              setPadBottomMargin={setPadBottomMargin}
              padLeftMargin={padLeftMargin}
              setPadLeftMargin={setPadLeftMargin}
              padRightMargin={padRightMargin}
              setPadRightMargin={setPadRightMargin}
              logoDisplay={logoDisplay}
              setLogoDisplay={setLogoDisplay}
              headerMode={headerMode}
              setHeaderMode={setHeaderMode}
              page1Ref={page1Ref}
              page2Ref={page2Ref}
              mainView={mainView}
              viewMode={viewMode}
              todayFormatted={todayFormatted}
              onResetField={handleResetField}
              onResetAllCustomLabels={handleResetAllCustomLabels}
              onResetAllTable={handleResetAllTable}
              onResetEntireDocument={handleResetEntireDocument}
              onResetSalaryStructure={handleResetSalaryStructure}
              onResetStructureRow={handleResetStructureRow}
              onStructureChange={handleStructureChange}
              onPage2PfChange={handlePage2PfChange}
              onMonthChange={handleMonthChange}
              onResetRowLabel={handleResetRowLabel}
              onResetMonthAmount={handleResetMonthAmount}
              onResetNetPayable={handleResetNetPayable}
              onAddCustomRow={handleAddCustomRow}
              onRemoveCustomRow={handleRemoveCustomRow}
              onToggleCustomRowType={handleToggleCustomRowType}
              onCustomRowLabelChange={handleCustomRowLabelChange}
              onCustomRowAmountChange={handleCustomRowAmountChange}
              onResetCustomRowLabel={handleResetCustomRowLabel}
              onResetCustomRowAmount={handleResetCustomRowAmount}
              onSyncCustomLabels={handleSyncCustomLabels}
            />
          </div>
        </div>
      )}
    </div>

      {/* Saved Statements Drawer */}
      <SavedStatementsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        savedStatements={savedStatements}
        savedStatementsTotal={savedStatementsTotal}
        isLoadingSaved={isLoadingSaved}
        onRefresh={() => fetchSavedStatements(savedSearchQuery)}
        savedSearchQuery={savedSearchQuery}
        onSavedSearchChange={setSavedSearchQuery}
        onLoadStatement={handleLoadStatement}
        onDeleteStatement={handleDeleteStatement}
        activeStatementId={activeStatementId}
        loadingStatementId={loadingStatementId}
        deletingId={deletingId}
        deleteConfirmId={deleteConfirmId}
        onSetDeleteConfirmId={setDeleteConfirmId}
        normalizeStatementData={normalizeStatementData}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 print:hidden flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700 shadow-rose-600/25'
              : toast.type === 'info'
              ? 'bg-blue-600 text-white border-blue-700 shadow-blue-600/25'
              : 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/25'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={18} className="shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white p-0.5 rounded transition"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
