'use client';

import React, { memo, useCallback } from 'react';
import {
  FileSpreadsheet,
  FileText,
  CreditCard,
  Building2,
  ShieldCheck,
  Sliders,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Copy,
  Download,
  Printer,
  Loader2,
} from 'lucide-react';
import {
  StatementData,
  MonthBreakdown,
  StatementCustomRow,
  computeNetPayable,
  formatWordsOnly,
  createDefaultCustomRows,
} from '../types';

export interface SalaryStatementFormProps {
  formData: StatementData;
  setFormData: React.Dispatch<React.SetStateAction<StatementData>>;
  activeTab: 'p1' | 'p2' | 'signatory';
  setActiveTab: (tab: 'p1' | 'p2' | 'signatory') => void;
  padTopMargin: number;
  setPadTopMargin: (v: number) => void;
  padBottomMargin: number;
  setPadBottomMargin: (v: number) => void;
  logoDisplay: 'blank_space' | 'collapsed' | 'digital_logo';
  setLogoDisplay: (v: 'blank_space' | 'collapsed' | 'digital_logo') => void;
  headerMode: 'company_info' | 'blank_header';
  setHeaderMode: (v: 'company_info' | 'blank_header') => void;
  initialDefaults: StatementData;
  activeStatementId: string | null;
  isSaving: boolean;
  isGeneratingPdf: boolean;
  onSave: (asNewCopy?: boolean) => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onResetField: (field: keyof StatementData) => void;
}

export const SalaryStatementForm = memo(function SalaryStatementForm({
  formData,
  setFormData,
  activeTab,
  setActiveTab,
  padTopMargin,
  setPadTopMargin,
  padBottomMargin,
  setPadBottomMargin,
  logoDisplay,
  setLogoDisplay,
  headerMode,
  setHeaderMode,
  initialDefaults,
  activeStatementId,
  isSaving,
  isGeneratingPdf,
  onSave,
  onDownloadPdf,
  onPrint,
  onResetField,
}: SalaryStatementFormProps) {
  // Handlers for Tab 1 (Breakdown)
  const handleMonthChange = useCallback((
    index: 0 | 1 | 2,
    field: keyof MonthBreakdown,
    val: string | number | undefined
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
  }, [setFormData]);

  const handleAddCustomRow = useCallback(() => {
    setFormData((prev) => {
      const existingRows = prev.customRows || [];
      const newId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newRow: StatementCustomRow = {
        id: newId,
        labels: ['Other Deduction', 'Other Deduction', 'Other Deduction'],
        types: ['deduction', 'deduction', 'deduction'],
        amounts: [0, 0, 0],
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
  }, [setFormData]);

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
  }, [setFormData]);

  const handleToggleCustomRowType = useCallback((
    rowId: string,
    monthIdx: 0 | 1 | 2,
    targetType?: 'addition' | 'deduction'
  ) => {
    setFormData((prev) => {
      const existingRows = prev.customRows || [];
      const updatedRows = existingRows.map((r) => {
        if (r.id !== rowId) return r;
        const currentType = r.types[monthIdx] || 'deduction';
        const newType = targetType || (currentType === 'deduction' ? 'addition' : 'deduction');
        const newTypes = [...r.types] as [('deduction' | 'addition'), ('deduction' | 'addition'), ('deduction' | 'addition')];
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
  }, [setFormData]);

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
  }, [setFormData]);

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
  }, [setFormData]);

  const handleResetCustomRowLabel = useCallback((rowId: string, monthIdx: 0 | 1 | 2) => {
    const initRow = initialDefaults.customRows?.find((r) => r.id === rowId);
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
  }, [initialDefaults.customRows, handleCustomRowLabelChange]);

  const handleResetCustomRowAmount = useCallback((rowId: string, monthIdx: 0 | 1 | 2) => {
    const initRow = initialDefaults.customRows?.find((r) => r.id === rowId);
    const defaultAmount = initRow?.amounts[monthIdx] ?? 0;
    handleCustomRowAmountChange(rowId, monthIdx, defaultAmount);
  }, [initialDefaults.customRows, handleCustomRowAmountChange]);

  const handleResetMonthAmount = useCallback((monthIdx: 0 | 1 | 2, field: keyof MonthBreakdown) => {
    const initial = initialDefaults?.months[monthIdx][field];
    if (initial !== undefined) {
      handleMonthChange(monthIdx, field, initial);
    }
  }, [initialDefaults?.months, handleMonthChange]);

  const handleResetMonth = useCallback((monthIdx: 0 | 1 | 2) => {
    const initial = initialDefaults?.months[monthIdx];
    const initialCustom = initialDefaults?.customRows;
    if (initial) {
      setFormData((prev) => {
        const nextMonths = [...prev.months] as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
        nextMonths[monthIdx] = { ...initial };
        let updatedRows = prev.customRows || [];
        if (initialCustom) {
          updatedRows = updatedRows.map((r) => {
            const initRow = initialCustom.find((ir) => ir.id === r.id);
            if (!initRow) return r;
            const newAmounts = [...r.amounts] as [number, number, number];
            const newLabels = [...r.labels] as [string, string, string];
            const newTypes = [...r.types] as [
              'deduction' | 'addition',
              'deduction' | 'addition',
              'deduction' | 'addition'
            ];
            newAmounts[monthIdx] = initRow.amounts[monthIdx];
            newLabels[monthIdx] = initRow.labels[monthIdx];
            newTypes[monthIdx] = initRow.types[monthIdx];
            return { ...r, amounts: newAmounts, labels: newLabels, types: newTypes };
          });
        }
        nextMonths[monthIdx].netPayable = computeNetPayable(
          nextMonths[monthIdx].grossSalary,
          monthIdx,
          updatedRows
        );
        const latestNet = nextMonths[2].netPayable;
        return {
          ...prev,
          months: nextMonths,
          customRows: updatedRows,
          monthlyPayableAmount: latestNet,
          monthlyPayableInWords: formatWordsOnly(latestNet),
        };
      });
    }
  }, [initialDefaults?.months, initialDefaults?.customRows, setFormData]);

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
  }, [setFormData]);

  const handleResetAllCustomLabels = useCallback(() => {
    setFormData((prev) => {
      const defaultRows = initialDefaults?.customRows
        ? structuredClone(initialDefaults.customRows)
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
  }, [initialDefaults?.customRows, setFormData]);

  // Handlers for Tab 2 (Page 2 Salary Structure)
  const handleStructureChange = useCallback((
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
  }, [setFormData]);

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
  }, [setFormData]);

  const handleResetSalaryStructure = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      structureBasicLabel: initialDefaults.structureBasicLabel || 'Basic',
      structureBasic: initialDefaults.structureBasic,
      structureHouseRentLabel: initialDefaults.structureHouseRentLabel || 'House Rent',
      structureHouseRent: initialDefaults.structureHouseRent,
      structureMedicalLabel: initialDefaults.structureMedicalLabel || 'Medical Allowance',
      structureMedical: initialDefaults.structureMedical,
      structureConveyanceLabel: initialDefaults.structureConveyanceLabel || 'Conveyance',
      structureConveyance: initialDefaults.structureConveyance,
      structureTotalLabel: initialDefaults.structureTotalLabel || 'Total Salary',
      structureTotal: initialDefaults.structureTotal,
      amountInWords: initialDefaults.amountInWords,
      monthlyPayableAmount: initialDefaults.monthlyPayableAmount,
      monthlyPayableInWords: initialDefaults.monthlyPayableInWords,
      pfDeductionPage2: initialDefaults.pfDeductionPage2,
      p2Item2Label: initialDefaults.p2Item2Label || 'Total deduction amount (PF purpose Tk.',
    }));
  }, [initialDefaults, setFormData]);

  const handleResetBankDetails = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      bankName: initialDefaults.bankName,
      bankAccountNo: initialDefaults.bankAccountNo,
      p2Item2Label: initialDefaults.p2Item2Label || 'Total deduction amount (PF purpose Tk.',
    }));
  }, [initialDefaults.bankName, initialDefaults.bankAccountNo, initialDefaults.p2Item2Label, setFormData]);

  const handleResetSignatory = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      signatoryName: initialDefaults.signatoryName,
      signatoryTitle: initialDefaults.signatoryTitle,
      signatoryDepartment: initialDefaults.signatoryDepartment,
      signatoryOrg: initialDefaults.signatoryOrg,
    }));
  }, [initialDefaults.signatoryName, initialDefaults.signatoryTitle, initialDefaults.signatoryDepartment, initialDefaults.signatoryOrg, setFormData]);

  return (
    <div className="space-y-6">
      {/* Form Navigation Tabs */}
      <div className="glass-panel rounded-2xl p-1.5 border border-white/70 shadow-xs flex items-center gap-1 text-xs font-bold overflow-x-auto no-scrollbar touch-scroll">
        <button
          type="button"
          onClick={() => setActiveTab('p1')}
          className={`flex-1 min-h-[44px] whitespace-nowrap shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'p1'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <FileText size={14} />
          <span className="hidden sm:inline">Page 1: 3-Month Breakdown</span>
          <span className="sm:hidden">Breakdown (P1)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('p2')}
          className={`flex-1 min-h-[44px] whitespace-nowrap shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'p2'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <CreditCard size={14} />
          <span className="hidden sm:inline">Page 2: Salary Certificate</span>
          <span className="sm:hidden">Certificate (P2)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('signatory')}
          className={`flex-1 min-h-[44px] whitespace-nowrap shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'signatory'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <ShieldCheck size={14} /> Signatory
        </button>
      </div>

      {/* TAB 1: Page 1 Data */}
      {activeTab === 'p1' && (
        <div className="space-y-6">
          {/* General / Header Info */}
          <div className="glass-card rounded-3xl p-5 border border-white/70 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <FileSpreadsheet size={16} className="text-blue-600" /> Header & Reference
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600">Reference No.</label>
                  <button
                    type="button"
                    onClick={() => onResetField('refNo')}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset Reference Number"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.refNo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, refNo: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600">Date</label>
                  <button
                    type="button"
                    onClick={() => onResetField('date')}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset Date"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600">Certificate Purpose (Page 1 Closing)</label>
                <button
                  type="button"
                  onClick={() => onResetField('purpose')}
                  className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                  title="Reset Purpose"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                placeholder="e.g. personal loan from Bank"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Official Letterhead Pad & Clearance Setup */}
          <div className="glass-card rounded-3xl p-5 border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sliders size={16} className="text-amber-600" /> Letterhead Pad & Print Clearance
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                Official Pad Preset
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Standard clearance reserved for company letterhead pad (top: 38mm, bottom: 28mm, margins: 20mm).
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPadTopMargin(38);
                  setPadBottomMargin(28);
                  setLogoDisplay('blank_space');
                  setHeaderMode('blank_header');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition border ${
                  padTopMargin === 38 && padBottomMargin === 28 && headerMode === 'blank_header'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Official Pad (Blank Top Header)
              </button>
            </div>
          </div>

          {/* 3 Months Salary Table Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Past 3 Months Breakdown Table
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddCustomRow}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition"
                >
                  <Plus size={13} /> Add Row
                </button>
              </div>
            </div>

            {formData.months.map((m, mIdx) => {
              const idx = mIdx as 0 | 1 | 2;
              return (
                <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        Month {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={m.monthName}
                        onChange={(e) => handleMonthChange(idx, 'monthName', e.target.value)}
                        className="px-2 py-0.5 border border-gray-300 rounded text-xs font-bold w-24 text-center"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleResetMonth(idx)}
                        className="text-[11px] text-slate-400 hover:text-blue-600 font-semibold flex items-center gap-1 transition"
                        title="Reset this month's data"
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                    </div>
                  </div>

                  {/* Custom rows management */}
                  <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800">
                        Custom Rows (Month {idx + 1})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddCustomRow}
                          className="text-[10px] text-rose-700 hover:text-rose-900 font-bold bg-white px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 shadow-2xs"
                        >
                          <Plus size={10} /> Add
                        </button>
                        <button
                          type="button"
                          onClick={handleResetAllCustomLabels}
                          className="text-[10px] text-rose-700 hover:text-rose-900 font-semibold underline flex items-center gap-0.5"
                          title="Reset custom rows"
                        >
                          <RotateCcw size={10} /> Reset
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {(formData.customRows || []).map((row) => (
                        <div
                          key={row.id}
                          className="p-2 bg-white/90 rounded border border-rose-200/70 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[90px]">
                              {row.labels[idx] || 'Custom Item'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleCustomRowType(row.id, idx)}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition ${
                                  row.types[idx] === 'addition'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                                title="Toggle addition (+) or deduction (-)"
                              >
                                {row.types[idx] === 'addition' ? '+ Addition' : '- Deduction'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomRow(row.id)}
                                className="p-0.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded transition"
                                title="Delete row"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={row.labels[idx]}
                              onChange={(e) =>
                                handleCustomRowLabelChange(row.id, idx, e.target.value)
                              }
                              placeholder="Row Label"
                              className="w-full px-2 py-1 border border-rose-300 rounded bg-white font-medium text-xs text-rose-950 focus:ring-1 focus:ring-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleResetCustomRowLabel(row.id, idx)}
                              className="p-1 text-rose-500 hover:text-rose-800 rounded transition shrink-0"
                              title="Reset Label"
                            >
                              <RotateCcw size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amounts Editor */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-gray-500">Gross Salary</label>
                        <button
                          type="button"
                          onClick={() => handleResetMonthAmount(idx, 'grossSalary')}
                          className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                          title="Reset gross salary"
                        >
                          <RotateCcw size={9} />
                        </button>
                      </div>
                      <input
                        type="number"
                        value={m.grossSalary}
                        onChange={(e) => handleMonthChange(idx, 'grossSalary', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-gray-500">Basic</label>
                        <button
                          type="button"
                          onClick={() => handleResetMonthAmount(idx, 'basicSalary')}
                          className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                          title="Reset basic salary"
                        >
                          <RotateCcw size={9} />
                        </button>
                      </div>
                      <input
                        type="number"
                        value={m.basicSalary}
                        onChange={(e) => handleMonthChange(idx, 'basicSalary', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-gray-500">House Rent</label>
                        <button
                          type="button"
                          onClick={() => handleResetMonthAmount(idx, 'houseRent')}
                          className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                          title="Reset house rent"
                        >
                          <RotateCcw size={9} />
                        </button>
                      </div>
                      <input
                        type="number"
                        value={m.houseRent}
                        onChange={(e) => handleMonthChange(idx, 'houseRent', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-gray-500">Medical</label>
                        <button
                          type="button"
                          onClick={() => handleResetMonthAmount(idx, 'medical')}
                          className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                          title="Reset medical allowance"
                        >
                          <RotateCcw size={9} />
                        </button>
                      </div>
                      <input
                        type="number"
                        value={m.medical}
                        onChange={(e) => handleMonthChange(idx, 'medical', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-gray-500">Conveyance</label>
                        <button
                          type="button"
                          onClick={() => handleResetMonthAmount(idx, 'conveyance')}
                          className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                          title="Reset conveyance allowance"
                        >
                          <RotateCcw size={9} />
                        </button>
                      </div>
                      <input
                        type="number"
                        value={m.conveyance}
                        onChange={(e) => handleMonthChange(idx, 'conveyance', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                      />
                    </div>

                    {/* Dynamic Custom Row Amounts */}
                    {(formData.customRows || []).map((row) => (
                      <div key={row.id}>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                row.types[idx] === 'addition'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {row.types[idx] === 'addition' ? '+' : '-'}
                            </span>
                            <label className="text-gray-500 truncate max-w-[80px]">
                              {row.labels[idx] || 'Custom Item'}
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResetCustomRowAmount(row.id, idx)}
                            className="text-slate-400 hover:text-blue-600 p-0.5 rounded shrink-0"
                            title="Reset amount"
                          >
                            <RotateCcw size={9} />
                          </button>
                        </div>
                        <input
                          type="number"
                          value={row.amounts[idx]}
                          onChange={(e) =>
                            handleCustomRowAmountChange(row.id, idx, Number(e.target.value))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-800">Net Payable =</span>
                      <button
                        type="button"
                        onClick={() => handleResetMonth(idx)}
                        className="text-[11px] text-slate-400 hover:text-blue-600 font-semibold flex items-center gap-0.5"
                        title={`Reset Month ${idx + 1} values to default`}
                      >
                        <RotateCcw size={10} /> Reset Month {idx + 1}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleResetNetPayable(idx)}
                        className="p-1 text-emerald-600 hover:text-emerald-800 rounded transition shrink-0"
                        title="Recalculate & Reset Net Payable"
                      >
                        <RotateCcw size={11} />
                      </button>
                      <input
                        type="number"
                        value={m.netPayable}
                        onChange={(e) => handleMonthChange(idx, 'netPayable', Number(e.target.value))}
                        className="w-32 px-2 py-0.5 border border-emerald-300 rounded bg-emerald-50 text-right font-bold text-xs text-emerald-800"
                      />
                      <span className="text-xs font-semibold text-gray-600">/-</span>
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
          {/* Monthly Salary Structure Table */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" /> Monthly Salary & Allowance Structure (Page 2)
              </h3>
              <button
                type="button"
                onClick={handleResetSalaryStructure}
                className="text-xs text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                title="Reset salary structure amounts"
              >
                <RotateCcw size={12} /> Reset Structure
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-600">Basic (BDT)</label>
                  <button
                    type="button"
                    onClick={() => onResetField('structureBasic')}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset Basic"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <input
                  type="number"
                  value={formData.structureBasic}
                  onChange={(e) => handleStructureChange('structureBasic', Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-600">House Rent (BDT)</label>
                  <button
                    type="button"
                    onClick={() => onResetField('structureHouseRent')}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset House Rent"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <input
                  type="number"
                  value={formData.structureHouseRent}
                  onChange={(e) => handleStructureChange('structureHouseRent', Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-600">Medical Allowance (BDT)</label>
                  <button
                    type="button"
                    onClick={() => onResetField('structureMedical')}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset Medical Allowance"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <input
                  type="number"
                  value={formData.structureMedical}
                  onChange={(e) => handleStructureChange('structureMedical', Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-600">Conveyance (BDT)</label>
                  <button
                    type="button"
                    onClick={() => onResetField('structureConveyance')}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset Conveyance"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <input
                  type="number"
                  value={formData.structureConveyance}
                  onChange={(e) => handleStructureChange('structureConveyance', Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">Total Salary:</span>
              <span className="text-sm font-extrabold text-blue-900">
                {formData.structureTotal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                BDT
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600">In Word (Total Salary)</label>
                <button
                  type="button"
                  onClick={() => onResetField('amountInWords')}
                  className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                  title="Reset In Word"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
              <input
                type="text"
                value={formData.amountInWords}
                onChange={(e) => setFormData((prev) => ({ ...prev, amountInWords: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
              />
            </div>
          </div>

          {/* Bank & Payment Details */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" /> Monthly Salary Details (Numbered List)
              </h3>
              <button
                type="button"
                onClick={() => {
                  handleResetBankDetails();
                  onResetField('pfDeductionPage2');
                  onResetField('monthlyPayableAmount');
                  onResetField('monthlyPayableInWords');
                  onResetField('disclaimer');
                }}
                className="text-xs text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                title="Reset payment details"
              >
                <RotateCcw size={12} /> Reset Payment Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-600">Bank Name</label>
                  <button
                    type="button"
                    onClick={() => onResetField('bankName')}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset Bank Name"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))}
                  placeholder="e.g. Prime Bank"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-600">Account Number</label>
                  <button
                    type="button"
                    onClick={() => onResetField('bankAccountNo')}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset Account Number"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.bankAccountNo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bankAccountNo: e.target.value }))}
                  placeholder="e.g. 2111212026612"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-600">Item 2 Deduction Label & Amount</label>
                  <button
                    type="button"
                    onClick={() => {
                      onResetField('p2Item2Label');
                      onResetField('pfDeductionPage2');
                    }}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset PF Deduction"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={formData.p2Item2Label || 'Total deduction amount (PF purpose Tk.'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, p2Item2Label: e.target.value }))}
                    placeholder="Total deduction amount (PF purpose Tk."
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    value={formData.pfDeductionPage2}
                    onChange={(e) => handlePage2PfChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-600">Monthly Net Payable Amount</label>
                  <button
                    type="button"
                    onClick={() => onResetField('monthlyPayableAmount')}
                    className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                    title="Reset Net Payable"
                  >
                    <RotateCcw size={10} /> Reset
                  </button>
                </div>
                <input
                  type="number"
                  value={formData.monthlyPayableAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthlyPayableAmount: Number(e.target.value),
                      monthlyPayableInWords: formatWordsOnly(Number(e.target.value)),
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-sm bg-emerald-50 text-emerald-800 font-bold"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600">Payable in Words (Item 1)</label>
                <button
                  type="button"
                  onClick={() => onResetField('monthlyPayableInWords')}
                  className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                  title="Reset Payable in Words"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
              <input
                type="text"
                value={formData.monthlyPayableInWords}
                onChange={(e) => setFormData((prev) => ({ ...prev, monthlyPayableInWords: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600">Item 3 Disclaimer Statement</label>
                <button
                  type="button"
                  onClick={() => onResetField('disclaimer')}
                  className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                  title="Reset Disclaimer"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
              <textarea
                rows={3}
                value={formData.disclaimer}
                onChange={(e) => setFormData((prev) => ({ ...prev, disclaimer: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Signatory */}
      {activeTab === 'signatory' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600" /> Authorized Signatory Section
            </h3>
            <button
              type="button"
              onClick={handleResetSignatory}
              className="text-xs text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1 hover:underline"
              title="Reset signatory details"
            >
              <RotateCcw size={12} /> Reset Signatory
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">Signatory Full Name</label>
              <button
                type="button"
                onClick={() => onResetField('signatoryName')}
                className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                title="Reset Name"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            <input
              type="text"
              value={formData.signatoryName}
              onChange={(e) => setFormData((prev) => ({ ...prev, signatoryName: e.target.value }))}
              placeholder="e.g. Sajjad Hosen"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">Signatory Title / Designation</label>
              <button
                type="button"
                onClick={() => onResetField('signatoryTitle')}
                className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                title="Reset Title"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            <input
              type="text"
              value={formData.signatoryTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, signatoryTitle: e.target.value }))}
              placeholder="e.g. Senior Deputy Manager"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">Department</label>
              <button
                type="button"
                onClick={() => onResetField('signatoryDepartment')}
                className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                title="Reset Department"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            <input
              type="text"
              value={formData.signatoryDepartment}
              onChange={(e) => setFormData((prev) => ({ ...prev, signatoryDepartment: e.target.value }))}
              placeholder="e.g. HR & Admin"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">Organization / Group (Page 1 &amp; 2 line 4)</label>
              <button
                type="button"
                onClick={() => onResetField('signatoryOrg')}
                className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                title="Reset Organization"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            <input
              type="text"
              value={formData.signatoryOrg}
              onChange={(e) => setFormData((prev) => ({ ...prev, signatoryOrg: e.target.value }))}
              placeholder="e.g. MEP Group."
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
          {/* Save or Update Statement */}
          {activeStatementId ? (
            <div className="inline-flex items-center rounded-xl bg-emerald-600 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => onSave(false)}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                title="Update existing statement in database"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Update Statement</span>
              </button>
              <div className="w-px h-6 bg-emerald-500/80 mx-1" />
              <button
                type="button"
                onClick={() => onSave(true)}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-3 rounded-lg text-xs font-semibold text-emerald-100 hover:text-white hover:bg-emerald-700 transition disabled:opacity-50"
                title="Save as a new copy"
              >
                <Copy size={14} />
                <span className="hidden sm:inline">Save as New Copy</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onSave(false)}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-sm shadow-emerald-600/20 transition disabled:opacity-50"
              title="Save this statement to database"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Save Statement</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDownloadPdf}
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
            onClick={onPrint}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-4 py-3 rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Printer size={18} /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
});
