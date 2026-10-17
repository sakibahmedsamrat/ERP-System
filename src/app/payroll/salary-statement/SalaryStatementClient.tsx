'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Search,
  Printer,
  Download,
  RotateCcw,
  Building2,
  User,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  Eye,
  Edit3,
  Sparkles,
  Loader2
} from 'lucide-react';
import { numberToWords, formatDate } from '@/lib/formatDate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MonthBreakdown {
  monthName: string;
  grossSalary: number;
  basicSalary: number;
  houseRent: number;
  medical: number;
  conveyance: number;
  pfDeduction: number;
  advanceSalary: number;
  lwpDeduction: number;
  netPayable: number;
}

interface StatementData {
  refNo: string;
  date: string;
  workerId: string;
  name: string;
  designation: string;
  department: string;
  companyName: string;
  companyAddress: string;
  joiningDate: string;
  employmentType: string;
  purpose: string;
  months: [MonthBreakdown, MonthBreakdown, MonthBreakdown];
  // Page 2 specific
  certificationText: string;
  structureBasic: number;
  structureHouseRent: number;
  structureMedical: number;
  structureConveyance: number;
  structureTotal: number;
  amountInWords: string;
  bankNameAndAcc: string;
  monthlyPayableAmount: number;
  monthlyPayableInWords: string;
  totalMonthlyDeduction: number;
  disclaimer: string;
  // Signatory
  signatoryName: string;
  signatoryTitle: string;
  signatoryOrg: string;
}

function getDefault3Months(): [string, string, string] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const res: string[] = [];
  for (let i = 3; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = months[d.getMonth()];
    const yStr = String(d.getFullYear()).slice(-2);
    res.push(`${mName}-${yStr}`);
  }
  return [res[0] || 'May-26', res[1] || 'Jun-26', res[2] || 'Jul-26'];
}

export default function SalaryStatementClient() {
  const [defaultMonths] = useState<[string, string, string]>(getDefault3Months());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);

  // View Mode: 'split', 'form', 'preview'
  const [viewMode, setViewMode] = useState<'split' | 'form' | 'preview'>('split');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'p1' | 'p2' | 'signatory'>('p1');

  // Printable pages refs
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const [formData, setFormData] = useState<StatementData>({
    refNo: `MEPG/HR&ADMIN/314/${currentYear}`,
    date: todayFormatted,
    workerId: '10245',
    name: 'Md. Abdur Rahim',
    designation: 'Senior Executive',
    department: 'Accounts & Finance',
    companyName: 'Mohammadi Electric Wires & Multi Products (MEP) Ltd.',
    companyAddress: 'Head Office: MEP Group, 161 Sadar Road, Barishal, Bangladesh.',
    joiningDate: '01 January, 2022',
    employmentType: 'Permanent',
    purpose: 'personal loan application from Bank',
    months: [
      {
        monthName: defaultMonths[0],
        grossSalary: 50000,
        basicSalary: 30000,
        houseRent: 15000,
        medical: 2500,
        conveyance: 2500,
        pfDeduction: 0,
        advanceSalary: 0,
        lwpDeduction: 0,
        netPayable: 50000,
      },
      {
        monthName: defaultMonths[1],
        grossSalary: 50000,
        basicSalary: 30000,
        houseRent: 15000,
        medical: 2500,
        conveyance: 2500,
        pfDeduction: 0,
        advanceSalary: 0,
        lwpDeduction: 0,
        netPayable: 50000,
      },
      {
        monthName: defaultMonths[2],
        grossSalary: 50000,
        basicSalary: 30000,
        houseRent: 15000,
        medical: 2500,
        conveyance: 2500,
        pfDeduction: 0,
        advanceSalary: 0,
        lwpDeduction: 0,
        netPayable: 50000,
      },
    ],
    certificationText:
      'This is to certify that Mr./Ms. [Name], Staff ID: [ID], Designation: [Designation], Department of [Department] has been serving at [Company] as a Permanent employee since [JoiningDate]. His/Her current monthly salary structure and payment particulars are certified below:',
    structureBasic: 30000,
    structureHouseRent: 15000,
    structureMedical: 2500,
    structureConveyance: 2500,
    structureTotal: 50000,
    amountInWords: 'Fifty Thousand Taka Only.',
    bankNameAndAcc: 'Dutch-Bangla Bank PLC, A/C: 123-151-0098765',
    monthlyPayableAmount: 50000,
    monthlyPayableInWords: 'Fifty Thousand Taka Only.',
    totalMonthlyDeduction: 0,
    disclaimer:
      'This certificate is issued at the request of the employee for banking / official purposes without any financial liability, endorsement or guarantee on the part of the organization.',
    signatoryName: 'Md. Tariqul Islam',
    signatoryTitle: 'Asst. Manager, HR & Admin',
    signatoryOrg: 'MEP Group',
  });

  // Search workers via API
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/workers/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResults(data.workers || []);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Failed to search workers:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle selecting a worker to populate defaults
  const handleSelectWorker = (worker: any) => {
    setSelectedWorker(worker);
    setShowSearchDropdown(false);
    setSearchQuery('');

    const gross = Number(worker.grossSalary) || 0;
    const basic = Number(worker.basicSalary) || (gross > 0 ? Math.round(gross * 0.6) : 0);
    const houseRent = Number(worker.houseRent) || (gross > 0 ? Math.round(gross * 0.3) : 0);
    const medical = Number(worker.medicalAllowance) || (gross > 0 ? Math.round(gross * 0.05) : 0);
    const conveyance = Number(worker.conveyanceAllowance) || (gross > 0 ? Math.max(0, gross - (basic + houseRent + medical)) : 0);
    const totalStructure = basic + houseRent + medical + conveyance || gross;
    const words = totalStructure > 0 ? `${numberToWords(totalStructure)} Taka Only.` : '';

    const joinDateFormatted = worker.joinDate ? formatDate(worker.joinDate) : '01-Jan-2022';
    const compName = worker.company?.name || 'Mohammadi Electric Wires & Multi Products (MEP) Ltd.';

    setFormData((prev) => ({
      ...prev,
      workerId: worker.workerId || prev.workerId,
      name: worker.name || prev.name,
      designation: worker.designation || prev.designation,
      department: worker.department?.name || prev.department,
      companyName: compName,
      joiningDate: joinDateFormatted,
      structureBasic: basic,
      structureHouseRent: houseRent,
      structureMedical: medical,
      structureConveyance: conveyance,
      structureTotal: totalStructure,
      amountInWords: words,
      monthlyPayableAmount: totalStructure,
      monthlyPayableInWords: words,
      totalMonthlyDeduction: 0,
      months: [
        {
          monthName: prev.months[0].monthName,
          grossSalary: totalStructure,
          basicSalary: basic,
          houseRent: houseRent,
          medical: medical,
          conveyance: conveyance,
          pfDeduction: 0,
          advanceSalary: 0,
          lwpDeduction: 0,
          netPayable: totalStructure,
        },
        {
          monthName: prev.months[1].monthName,
          grossSalary: totalStructure,
          basicSalary: basic,
          houseRent: houseRent,
          medical: medical,
          conveyance: conveyance,
          pfDeduction: 0,
          advanceSalary: 0,
          lwpDeduction: 0,
          netPayable: totalStructure,
        },
        {
          monthName: prev.months[2].monthName,
          grossSalary: totalStructure,
          basicSalary: basic,
          houseRent: houseRent,
          medical: medical,
          conveyance: conveyance,
          pfDeduction: 0,
          advanceSalary: 0,
          lwpDeduction: 0,
          netPayable: totalStructure,
        },
      ],
    }));
  };

  // Recalculate Month row values
  const handleMonthChange = (
    index: 0 | 1 | 2,
    field: keyof MonthBreakdown,
    val: string | number
  ) => {
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

      if (field !== 'netPayable' && field !== 'monthName') {
        const gross = Number(currentMonth.grossSalary) || 0;
        const pf = Number(currentMonth.pfDeduction) || 0;
        const advance = Number(currentMonth.advanceSalary) || 0;
        const lwp = Number(currentMonth.lwpDeduction) || 0;
        currentMonth.netPayable = Math.max(0, gross - (pf + advance + lwp));
      }

      updatedMonths[index] = currentMonth;
      return { ...prev, months: updatedMonths };
    });
  };

  // Recalculate Page 2 Structure values
  const handleStructureChange = (
    field: 'structureBasic' | 'structureHouseRent' | 'structureMedical' | 'structureConveyance',
    val: number
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val };
      const total =
        Number(next.structureBasic) +
        Number(next.structureHouseRent) +
        Number(next.structureMedical) +
        Number(next.structureConveyance);
      next.structureTotal = total;
      next.amountInWords = total > 0 ? `${numberToWords(total)} Taka Only.` : '';
      const net = Math.max(0, total - Number(next.totalMonthlyDeduction || 0));
      next.monthlyPayableAmount = net;
      next.monthlyPayableInWords = net > 0 ? `${numberToWords(net)} Taka Only.` : '';
      return next;
    });
  };

  const handleDeductionChange = (val: number) => {
    setFormData((prev) => {
      const net = Math.max(0, Number(prev.structureTotal) - val);
      return {
        ...prev,
        totalMonthlyDeduction: val,
        monthlyPayableAmount: net,
        monthlyPayableInWords: net > 0 ? `${numberToWords(net)} Taka Only.` : '',
      };
    });
  };

  // Copy Month 1 data to Months 2 and 3
  const handleSyncMonthsFromFirst = () => {
    setFormData((prev) => {
      const m1 = prev.months[0];
      return {
        ...prev,
        months: [
          m1,
          { ...m1, monthName: prev.months[1].monthName },
          { ...m1, monthName: prev.months[2].monthName },
        ],
      };
    });
  };

  // Download 2-Page PDF
  const handleDownloadPdf = async () => {
    if (!page1Ref.current || !page2Ref.current) return;
    setIsGeneratingPdf(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Render Page 1
      const canvas1 = await html2canvas(page1Ref.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 1200,
      });
      const img1 = canvas1.toDataURL('image/jpeg', 0.98);
      pdf.addImage(img1, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

      // Render Page 2
      pdf.addPage('a4', 'portrait');
      const canvas2 = await html2canvas(page2Ref.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 1200,
      });
      const img2 = canvas2.toDataURL('image/jpeg', 0.98);
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Print CSS styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden, header, nav, aside {
            display: none !important;
          }
          .salary-doc-page {
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            height: 297mm !important;
            margin: 0 auto !important;
            padding: 16mm 18mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }
        }
      `,
        }}
      />

      {/* Top Navbar & Action Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/payroll"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
              title="Back to Payroll"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Payroll Module
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-semibold text-gray-500">2-Page Statement & Certificate</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Salary Statement Generator</h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="hidden lg:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'split' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode('form')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'form' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Form Only
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Preview Only
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-3.5 py-2 rounded-xl text-sm font-semibold shadow-sm transition hover:border-gray-400"
            >
              <Printer size={16} /> Print / Save PDF
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Compiling 2-Page PDF...
                </>
              ) : (
                <>
                  <Download size={16} /> Download 2-Page PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Worker Quick Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 print:hidden relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Auto-Fill From Employee Record
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Employee ID, Name, or Phone (e.g. 10245)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchDropdown(true);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                {isSearching && (
                  <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.map((worker) => (
                    <button
                      key={worker.id}
                      onClick={() => handleSelectWorker(worker)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50/70 transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-700 text-sm">
                          {worker.name}{' '}
                          <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700 ml-1">
                            {worker.workerId}
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
                        <span className="text-[11px] text-gray-400">Click to Select</span>
                      </div>
                    </button>
                  ))}
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
                  onClick={() => setSelectedWorker(null)}
                  className="text-blue-700 hover:text-blue-900 underline font-semibold ml-2"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Layout */}
        <div
          className={`grid gap-8 ${
            viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* Left Column: Form Editor (Visible in 'split' or 'form') */}
          {(viewMode === 'split' || viewMode === 'form') && (
            <div className={viewMode === 'split' ? 'lg:col-span-5 space-y-6 print:hidden' : 'max-w-4xl mx-auto space-y-6 print:hidden w-full'}>
              {/* Form Navigation Tabs */}
              <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-sm flex items-center gap-1 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('p1')}
                  className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'p1' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText size={15} /> Page 1: 3-Month Breakdown
                </button>
                <button
                  onClick={() => setActiveTab('p2')}
                  className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'p2' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard size={15} /> Page 2: Salary Certificate
                </button>
                <button
                  onClick={() => setActiveTab('signatory')}
                  className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'signatory' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ShieldCheck size={15} /> Signatory
                </button>
              </div>

              {/* TAB 1: Page 1 Data */}
              {activeTab === 'p1' && (
                <div className="space-y-6">
                  {/* General / Header Info */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 border-b pb-2">
                      <FileSpreadsheet size={16} className="text-blue-600" /> Header & Reference
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Reference No.</label>
                        <input
                          type="text"
                          value={formData.refNo}
                          onChange={(e) => setFormData({ ...formData, refNo: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                        <input
                          type="text"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Certificate Purpose</label>
                      <input
                        type="text"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        placeholder="e.g., personal loan application from Bank"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Employee Details */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 border-b pb-2">
                      <User size={16} className="text-blue-600" /> Employee Particulars
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Staff / Worker ID</label>
                        <input
                          type="text"
                          value={formData.workerId}
                          onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Designation</label>
                        <input
                          type="text"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Joining Date</label>
                        <input
                          type="text"
                          value={formData.joiningDate}
                          onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Employment Type</label>
                        <input
                          type="text"
                          value={formData.employmentType}
                          onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                          placeholder="e.g. Permanent"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Company / Sister Concern</label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Company Address / Office Location</label>
                        <input
                          type="text"
                          value={formData.companyAddress}
                          onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                          placeholder="e.g. Corporate Office: MEP Group, 161 Sadar Road, Barishal, Bangladesh."
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Past 3 Months Salary Table */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <DollarSign size={16} className="text-emerald-600" /> Past 3 Months Breakdown
                      </h3>
                      <button
                        type="button"
                        onClick={handleSyncMonthsFromFirst}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                        title="Copy Month 1 numbers to Month 2 & 3"
                      >
                        <Sparkles size={13} /> Copy M1 to M2 & M3
                      </button>
                    </div>

                    {/* 3 Month Columns */}
                    {formData.months.map((m, idx) => {
                      const mIdx = idx as 0 | 1 | 2;
                      return (
                        <div key={idx} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                              Month {idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-gray-500 font-medium">Month Label:</label>
                              <input
                                type="text"
                                value={m.monthName}
                                onChange={(e) => handleMonthChange(mIdx, 'monthName', e.target.value)}
                                className="w-24 px-2 py-0.5 border border-gray-300 rounded text-xs font-bold text-gray-800 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div>
                              <label className="block text-gray-500 mb-0.5">Gross Salary</label>
                              <input
                                type="number"
                                value={m.grossSalary}
                                onChange={(e) => handleMonthChange(mIdx, 'grossSalary', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 mb-0.5">Basic Salary</label>
                              <input
                                type="number"
                                value={m.basicSalary}
                                onChange={(e) => handleMonthChange(mIdx, 'basicSalary', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 mb-0.5">House Rent</label>
                              <input
                                type="number"
                                value={m.houseRent}
                                onChange={(e) => handleMonthChange(mIdx, 'houseRent', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 mb-0.5">Medical</label>
                              <input
                                type="number"
                                value={m.medical}
                                onChange={(e) => handleMonthChange(mIdx, 'medical', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 mb-0.5">Conveyance</label>
                              <input
                                type="number"
                                value={m.conveyance}
                                onChange={(e) => handleMonthChange(mIdx, 'conveyance', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 mb-0.5">(Less) PF</label>
                              <input
                                type="number"
                                value={m.pfDeduction}
                                onChange={(e) => handleMonthChange(mIdx, 'pfDeduction', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 mb-0.5">Advance Salary</label>
                              <input
                                type="number"
                                value={m.advanceSalary}
                                onChange={(e) => handleMonthChange(mIdx, 'advanceSalary', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 mb-0.5">LWP/Late Deduct</label>
                              <input
                                type="number"
                                value={m.lwpDeduction}
                                onChange={(e) => handleMonthChange(mIdx, 'lwpDeduction', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                            <span className="text-xs font-semibold text-gray-600">Net Payable =</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={m.netPayable}
                                onChange={(e) => handleMonthChange(mIdx, 'netPayable', Number(e.target.value))}
                                className="w-28 px-2 py-0.5 border border-emerald-300 rounded bg-emerald-50 text-right font-bold text-xs text-emerald-800"
                              />
                              <span className="text-xs font-medium text-gray-500">BDT</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: Page 2 Data */}
              {activeTab === 'p2' && (
                <div className="space-y-6">
                  {/* Certification Text */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 border-b pb-2">
                      <FileText size={16} className="text-blue-600" /> Certification Statement Text
                    </h3>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Certificate Body Text (Supports [Name], [ID], [Designation], [Department], [Company], [JoiningDate])
                      </label>
                      <textarea
                        rows={3}
                        value={formData.certificationText}
                        onChange={(e) => setFormData({ ...formData, certificationText: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Monthly Salary Structure Table */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 border-b pb-2">
                      <CreditCard size={16} className="text-blue-600" /> Monthly Salary Structure (Page 2)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-gray-600 mb-1">Basic Salary (BDT)</label>
                        <input
                          type="number"
                          value={formData.structureBasic}
                          onChange={(e) => handleStructureChange('structureBasic', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-600 mb-1">House Rent Allowance (BDT)</label>
                        <input
                          type="number"
                          value={formData.structureHouseRent}
                          onChange={(e) => handleStructureChange('structureHouseRent', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-600 mb-1">Medical Allowance (BDT)</label>
                        <input
                          type="number"
                          value={formData.structureMedical}
                          onChange={(e) => handleStructureChange('structureMedical', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-600 mb-1">Conveyance Allowance (BDT)</label>
                        <input
                          type="number"
                          value={formData.structureConveyance}
                          onChange={(e) => handleStructureChange('structureConveyance', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">Total Gross Salary:</span>
                      <span className="text-sm font-extrabold text-blue-900">
                        {formData.structureTotal.toLocaleString()} BDT
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Amount in Words</label>
                      <input
                        type="text"
                        value={formData.amountInWords}
                        onChange={(e) => setFormData({ ...formData, amountInWords: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Bank & Payment Details */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 border-b pb-2">
                      <Building2 size={16} className="text-blue-600" /> Bank & Monthly Payable Particulars
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Bank Name & Account No.
                      </label>
                      <input
                        type="text"
                        value={formData.bankNameAndAcc}
                        onChange={(e) => setFormData({ ...formData, bankNameAndAcc: e.target.value })}
                        placeholder="e.g. Dutch-Bangla Bank PLC, A/C: 123-151-0000000"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-gray-600 mb-1">
                          Total Deductions (PF & other fines)
                        </label>
                        <input
                          type="number"
                          value={formData.totalMonthlyDeduction}
                          onChange={(e) => handleDeductionChange(Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-600 mb-1">
                          Monthly Net Payable (BDT)
                        </label>
                        <input
                          type="number"
                          value={formData.monthlyPayableAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              monthlyPayableAmount: Number(e.target.value),
                              monthlyPayableInWords: `${numberToWords(Number(e.target.value))} Taka Only.`,
                            })
                          }
                          className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-sm bg-emerald-50 text-emerald-800 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Payable Amount in Words
                      </label>
                      <input
                        type="text"
                        value={formData.monthlyPayableInWords}
                        onChange={(e) => setFormData({ ...formData, monthlyPayableInWords: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Certificate Disclaimer</label>
                      <textarea
                        rows={2}
                        value={formData.disclaimer}
                        onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Signatory */}
              {activeTab === 'signatory' && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 border-b pb-2">
                    <ShieldCheck size={16} className="text-blue-600" /> Authorized Signatory Section
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Signatory Full Name</label>
                    <input
                      type="text"
                      value={formData.signatoryName}
                      onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                      placeholder="e.g. Md. Tariqul Islam"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Signatory Title / Designation</label>
                    <input
                      type="text"
                      value={formData.signatoryTitle}
                      onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                      placeholder="e.g. Asst. Manager, HR & Admin"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Organization / Group</label>
                    <input
                      type="text"
                      value={formData.signatoryOrg}
                      onChange={(e) => setFormData({ ...formData, signatoryOrg: e.target.value })}
                      placeholder="e.g. MEP Group"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Form Action & Submit Bar */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pb-2 border-b">
                  <span>Step Navigation:</span>
                  <div className="flex items-center gap-2">
                    {activeTab !== 'p1' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab(activeTab === 'signatory' ? 'p2' : 'p1')}
                        className="px-2.5 py-1 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition"
                      >
                        &larr; Previous
                      </button>
                    )}
                    {activeTab !== 'signatory' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab(activeTab === 'p1' ? 'p2' : 'signatory')}
                        className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-semibold transition"
                      >
                        Next Step &rarr;
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-600/25 transition disabled:opacity-50"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Compiling 2-Page PDF...
                      </>
                    ) : (
                      <>
                        <Download size={18} /> Submit & Download 2-Page PDF
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-4 py-3 rounded-xl text-sm font-semibold shadow-sm transition"
                  >
                    <Printer size={18} /> Print / Save as PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: High-Fidelity 2-Page Document Preview */}
          <div
            className={
              viewMode === 'form'
                ? 'fixed -left-[99999px] top-0 pointer-events-none opacity-0 print:static print:opacity-100 print:left-auto print:w-full space-y-10'
                : viewMode === 'preview'
                ? 'max-w-4xl mx-auto space-y-10 w-full'
                : 'lg:col-span-7 space-y-10'
            }
          >
            {/* PAGE 1 CONTAINER */}
            <div className="relative group">
              <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-gray-500 print:hidden">
                <span className="uppercase tracking-wider">Page 1 of 2: Past 3 Months Breakdown</span>
                <span className="text-gray-400">Standard A4 Sheet (210mm x 297mm)</span>
              </div>

              <div className="w-full overflow-x-auto pb-4">
                <div
                  ref={page1Ref}
                  className="salary-doc-page bg-white shadow-xl rounded-xl border border-gray-200 p-8 sm:p-10 text-[13px] text-gray-900 leading-relaxed font-sans flex flex-col justify-between mx-auto"
                  style={{ width: '794px', minHeight: '1123px', boxSizing: 'border-box' }}
                >
                  {/* Top Letterhead */}
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-5">
                      <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/logo.png"
                          alt="MEP Logo"
                          className="h-16 w-auto object-contain shrink-0"
                        />
                        <div>
                          <h2 className="text-xl font-extrabold uppercase tracking-wide text-gray-900">
                            {formData.companyName}
                          </h2>
                          <p className="text-[11px] text-gray-600 leading-tight mt-0.5">
                            {formData.companyAddress}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Web: www.mepgroupbd.com | Email: hr@mepgroupbd.com
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ref and Date */}
                    <div className="flex justify-between items-center text-xs font-semibold mb-6">
                      <div>
                        Ref: <span className="font-mono text-gray-800">{formData.refNo}</span>
                      </div>
                      <div>
                        Date: <span className="text-gray-800">{formData.date}</span>
                      </div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center my-4">
                      <h3 className="text-base font-extrabold tracking-wider uppercase underline underline-offset-4 decoration-2 inline-block">
                        TO WHOM IT MAY CONCERN
                      </h3>
                    </div>

                    {/* Introduction Paragraph */}
                    <p className="text-justify mb-4 text-gray-800 leading-relaxed text-[13px]">
                      This is to certify that <strong>Mr./Ms. {formData.name}</strong>, Staff ID:{' '}
                      <strong>{formData.workerId}</strong> is serving in our organization as{' '}
                      <strong>{formData.designation}</strong> in the <strong>{formData.department}</strong> department since{' '}
                      <strong>{formData.joiningDate}</strong>. His/Her employment type is{' '}
                      <strong>{formData.employmentType}</strong>.
                    </p>

                    <p className="mb-4 text-gray-800 text-[13px]">
                      His/Her gross monthly salary breakdown for the past 3 (three) consecutive months is detailed below:
                    </p>

                    {/* Past 3 Months Table */}
                    <table className="w-full border-collapse border border-gray-900 text-xs mb-6">
                      <thead>
                        <tr className="bg-gray-100 font-bold border-b border-gray-900 text-center">
                          <th className="border border-gray-900 py-2 px-3 text-left w-1/3">
                            Particulars / Salary Head
                          </th>
                          <th className="border border-gray-900 py-2 px-3 w-[22%]">
                            {formData.months[0].monthName}
                          </th>
                          <th className="border border-gray-900 py-2 px-3 w-[22%]">
                            {formData.months[1].monthName}
                          </th>
                          <th className="border border-gray-900 py-2 px-3 w-[22%]">
                            {formData.months[2].monthName}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        <tr className="font-bold bg-gray-50/60">
                          <td className="border border-gray-900 py-1.5 px-3">Gross Salary (BDT)</td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[0].grossSalary.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[1].grossSalary.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[2].grossSalary.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3">Basic</td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[0].basicSalary.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[1].basicSalary.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[2].basicSalary.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3">House Rent</td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[0].houseRent.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[1].houseRent.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[2].houseRent.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3">Medical</td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[0].medical.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[1].medical.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[2].medical.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3">Conveyance</td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[0].conveyance.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[1].conveyance.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[2].conveyance.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3 text-rose-800 font-medium">
                            (Less) PF
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[0].pfDeduction.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[1].pfDeduction.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[2].pfDeduction.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3 text-rose-800 font-medium">
                            Advance Salary
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[0].advanceSalary.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[1].advanceSalary.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[2].advanceSalary.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3 text-rose-800 font-medium">
                            LWP/Late & Early Deduction
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[0].lwpDeduction.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[1].lwpDeduction.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.months[2].lwpDeduction.toLocaleString()}
                          </td>
                        </tr>
                        <tr className="font-extrabold bg-gray-100 text-gray-950">
                          <td className="border border-gray-900 py-2 px-3">Net Payable =</td>
                          <td className="border border-gray-900 py-2 px-3 text-right text-sm">
                            {formData.months[0].netPayable.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-2 px-3 text-right text-sm">
                            {formData.months[1].netPayable.toLocaleString()}
                          </td>
                          <td className="border border-gray-900 py-2 px-3 text-right text-sm">
                            {formData.months[2].netPayable.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Purpose Disclaimer */}
                    <p className="text-justify text-xs text-gray-700 leading-relaxed mb-6">
                      This certificate is issued upon the request of the employee for the purpose of{' '}
                      <strong>{formData.purpose}</strong> and carries no financial liability or commitment on the part
                      of the organization or any of its management.
                    </p>
                  </div>

                  {/* Signatory Section Bottom */}
                  <div className="pt-8">
                    <p className="text-xs mb-12">Sincerely yours,</p>
                    <div className="inline-block border-t border-gray-900 pt-1.5 text-xs min-w-[200px]">
                      <div className="font-bold text-gray-900">{formData.signatoryName}</div>
                      <div className="text-gray-700">{formData.signatoryTitle}</div>
                      <div className="font-semibold text-gray-800">{formData.signatoryOrg}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 2 CONTAINER */}
              <div className="relative group">
                <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-gray-500 print:hidden">
                  <span className="uppercase tracking-wider">Page 2 of 2: Monthly Salary Certificate</span>
                  <span className="text-gray-400">Standard A4 Sheet (210mm x 297mm)</span>
                </div>

                <div className="w-full overflow-x-auto pb-4">
                  <div
                    ref={page2Ref}
                    className="salary-doc-page bg-white shadow-xl rounded-xl border border-gray-200 p-8 sm:p-10 text-[13px] text-gray-900 leading-relaxed font-sans flex flex-col justify-between mx-auto"
                    style={{ width: '794px', minHeight: '1123px', boxSizing: 'border-box' }}
                  >
                    {/* Top Letterhead */}
                    <div>
                      <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-5">
                        <div className="flex items-center gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/logo.png"
                            alt="MEP Logo"
                            className="h-16 w-auto object-contain shrink-0"
                          />
                          <div>
                            <h2 className="text-xl font-extrabold uppercase tracking-wide text-gray-900">
                              {formData.companyName}
                            </h2>
                            <p className="text-[11px] text-gray-600 leading-tight mt-0.5">
                              {formData.companyAddress}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Web: www.mepgroupbd.com | Email: hr@mepgroupbd.com
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Ref and Date */}
                      <div className="flex justify-between items-center text-xs font-semibold mb-6">
                        <div>
                          Ref: <span className="font-mono text-gray-800">{formData.refNo}</span>
                        </div>
                        <div>
                          Date: <span className="text-gray-800">{formData.date}</span>
                        </div>
                      </div>

                      {/* Document Title */}
                      <div className="text-center my-4">
                        <h3 className="text-base font-extrabold tracking-wider uppercase underline underline-offset-4 decoration-2 inline-block">
                          MONTHLY SALARY CERTIFICATE
                        </h3>
                      </div>

                      {/* Certification Text */}
                      <p className="text-justify mb-4 text-gray-800 leading-relaxed text-[13px] whitespace-pre-line">
                        {formData.certificationText
                          .replace(/\[Name\]/gi, formData.name)
                          .replace(/\[ID\]/gi, formData.workerId)
                          .replace(/\[Designation\]/gi, formData.designation)
                          .replace(/\[Department\]/gi, formData.department)
                          .replace(/\[Company\]/gi, formData.companyName)
                          .replace(/\[JoiningDate\]/gi, formData.joiningDate)}
                      </p>

                      <p className="mb-4 text-gray-800 text-[13px]">
                        As per official payroll records, his/her current monthly salary structure is detailed below:
                      </p>

                    {/* Table of Monthly Salary Structure */}
                    <table className="w-full border-collapse border border-gray-900 text-xs mb-3">
                      <thead>
                        <tr className="bg-gray-100 font-bold border-b border-gray-900">
                          <th className="border border-gray-900 py-2 px-3 text-left w-2/3">Salary Component</th>
                          <th className="border border-gray-900 py-2 px-3 text-right w-1/3">
                            Monthly Amount (BDT)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3">Basic</td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.structureBasic.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3">House Rent</td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.structureHouseRent.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3">Medical Allowance</td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.structureMedical.toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-900 py-1.5 px-3">Conveyance</td>
                          <td className="border border-gray-900 py-1.5 px-3 text-right">
                            {formData.structureConveyance.toLocaleString()}
                          </td>
                        </tr>
                        <tr className="font-extrabold bg-gray-100 text-gray-950">
                          <td className="border border-gray-900 py-2 px-3">Total Salary</td>
                          <td className="border border-gray-900 py-2 px-3 text-right text-sm">
                            {formData.structureTotal.toLocaleString()} BDT
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Amount in Words */}
                    <div className="text-xs mb-6 font-medium text-gray-900">
                      Amount in Words: <span className="font-bold underline">{formData.amountInWords}</span>
                    </div>

                    {/* Monthly Salary Details Box */}
                    <div className="border border-gray-900 rounded-lg p-4 bg-gray-50/60 mb-6 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 border-b border-gray-200 pb-1.5">
                        <span className="font-semibold text-gray-700">Bank Details:</span>
                        <span className="font-bold text-gray-900">{formData.bankNameAndAcc}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 border-b border-gray-200 pb-1.5">
                        <span className="font-semibold text-gray-700">Monthly Net Payable Amount:</span>
                        <span className="font-extrabold text-gray-950 text-sm">
                          {formData.monthlyPayableAmount.toLocaleString()} BDT
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 border-b border-gray-200 pb-1.5">
                        <span className="font-semibold text-gray-700">Payable in Words:</span>
                        <span className="font-bold text-gray-900 italic">{formData.monthlyPayableInWords}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                        <span className="font-semibold text-gray-700">Total Monthly Deductions:</span>
                        <span className="font-medium text-rose-800">
                          (PF & other fines): {formData.totalMonthlyDeduction.toLocaleString()} BDT
                        </span>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-justify text-xs text-gray-700 leading-relaxed mb-6">
                      {formData.disclaimer}
                    </p>
                  </div>

                  {/* Signatory Section Bottom */}
                  <div className="pt-8">
                    <p className="text-xs mb-12">Sincerely yours,</p>
                    <div className="inline-block border-t border-gray-900 pt-1.5 text-xs min-w-[200px]">
                      <div className="font-bold text-gray-900">{formData.signatoryName}</div>
                      <div className="text-gray-700">{formData.signatoryTitle}</div>
                      <div className="font-semibold text-gray-800">{formData.signatoryOrg}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
