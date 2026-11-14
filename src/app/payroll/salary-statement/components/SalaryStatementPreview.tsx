'use client';

import React, { memo } from 'react';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react';
import {
  StatementData,
  MonthBreakdown,
  renderOrdinalDateText,
  formatWordsOnly,
} from '../types';
import {
  EditableLabelCell,
  EditableAmountCell,
  EditableInlineAmount,
  EditableInlineText,
} from './EditableCells';

export interface SalaryStatementPreviewProps {
  formData: StatementData;
  setFormData: React.Dispatch<React.SetStateAction<StatementData>>;
  initialDefaults: StatementData;
  padTopMargin: number;
  setPadTopMargin: (v: number) => void;
  padBottomMargin: number;
  setPadBottomMargin: (v: number) => void;
  padLeftMargin: number;
  setPadLeftMargin: (v: number) => void;
  padRightMargin: number;
  setPadRightMargin: (v: number) => void;
  logoDisplay: 'blank_space' | 'collapsed' | 'digital_logo';
  setLogoDisplay: (v: 'blank_space' | 'collapsed' | 'digital_logo') => void;
  headerMode: 'company_info' | 'blank_header';
  setHeaderMode: (v: 'company_info' | 'blank_header') => void;
  page1Ref: React.RefObject<HTMLDivElement>;
  page2Ref: React.RefObject<HTMLDivElement>;
  mainView: 'list' | 'generator';
  viewMode: 'split' | 'form' | 'preview';
  todayFormatted: string;
  onResetField: (field: keyof StatementData) => void;
  onResetAllCustomLabels: () => void;
  onResetAllTable: () => void;
  onResetEntireDocument: () => void;
  onResetSalaryStructure: () => void;
  onResetStructureRow: (labelField: any, defaultLabel: string, amountField?: any) => void;
  onStructureChange: (field: any, val: number) => void;
  onPage2PfChange: (val: number) => void;
  onMonthChange: (index: 0 | 1 | 2, field: keyof MonthBreakdown, val: string | number | undefined) => void;
  onResetRowLabel: (monthIdx: 0 | 1 | 2, field: any) => void;
  onResetMonthAmount: (monthIdx: 0 | 1 | 2, field: keyof MonthBreakdown) => void;
  onResetNetPayable: (monthIdx: 0 | 1 | 2) => void;
  onAddCustomRow: () => void;
  onRemoveCustomRow: (rowId: string) => void;
  onToggleCustomRowType: (rowId: string, monthIdx: 0 | 1 | 2, targetType?: 'addition' | 'deduction') => void;
  onCustomRowLabelChange: (rowId: string, monthIdx: 0 | 1 | 2, val: string) => void;
  onCustomRowAmountChange: (rowId: string, monthIdx: 0 | 1 | 2, val: number) => void;
  onResetCustomRowLabel: (rowId: string, monthIdx: 0 | 1 | 2) => void;
  onResetCustomRowAmount: (rowId: string, monthIdx: 0 | 1 | 2) => void;
  onSyncCustomLabels: (sourceMonthIdx: 0 | 1 | 2) => void;
}

export const SalaryStatementPreview = memo(function SalaryStatementPreview({
  formData,
  setFormData,
  initialDefaults,
  padTopMargin,
  setPadTopMargin,
  padBottomMargin,
  setPadBottomMargin,
  padLeftMargin,
  setPadLeftMargin,
  padRightMargin,
  setPadRightMargin,
  logoDisplay,
  setLogoDisplay,
  headerMode,
  setHeaderMode,
  page1Ref,
  page2Ref,
  mainView,
  viewMode,
  todayFormatted,
  onResetField,
  onResetAllCustomLabels,
  onResetAllTable,
  onResetEntireDocument,
  onResetSalaryStructure,
  onResetStructureRow,
  onStructureChange,
  onPage2PfChange,
  onMonthChange,
  onResetRowLabel,
  onResetMonthAmount,
  onResetNetPayable,
  onAddCustomRow,
  onRemoveCustomRow,
  onToggleCustomRowType,
  onCustomRowLabelChange,
  onCustomRowAmountChange,
  onResetCustomRowLabel,
  onResetCustomRowAmount,
  onSyncCustomLabels,
}: SalaryStatementPreviewProps) {
  // Convert mm to pixels for screen canvas render (1mm ~= 3.7795px at 96 DPI)
  const topPaddingPx = Math.round(padTopMargin * 3.7795);
  const bottomPaddingPx = Math.round(padBottomMargin * 3.7795);
  const leftPaddingPx = Math.round(padLeftMargin * 3.7795);
  const rightPaddingPx = Math.round(padRightMargin * 3.7795);

  const getPossessivePronoun = (pronoun: 'He' | 'She' | 'He/She'): string => {
    if (pronoun === 'He') return 'his';
    if (pronoun === 'She') return 'her';
    return 'his/her';
  };

  return (
    <div
      id="printable-pages-container"
      className={
        mainView === 'list'
          ? 'fixed -left-[99999px] top-0 pointer-events-none opacity-0 print:static print:opacity-100 print:left-auto print:w-full print:m-0 print:p-0 space-y-6 print:space-y-0'
          : viewMode === 'form'
          ? 'fixed -left-[99999px] top-0 pointer-events-none opacity-0 print:static print:opacity-100 print:left-auto print:w-full print:m-0 print:p-0 space-y-6 print:space-y-0'
          : viewMode === 'preview'
          ? 'max-w-4xl mx-auto space-y-6 w-full print:m-0 print:p-0 print:max-w-none print:w-full print:space-y-0'
          : 'hidden lg:block lg:col-span-7 space-y-6 print:w-full print:m-0 print:p-0 print:space-y-0'
      }
    >
      {/* Official Letterhead Pad Print Settings Control Panel (rendered only in generator mode) */}
      {mainView === 'generator' && (
        <>
          <div className="print:hidden bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <Sliders size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Official Letterhead Pad Print Clearance
                    </h4>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Ready to Print
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Top & bottom blank margins reserved for company letterhead pad header & footer
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPadTopMargin(38);
                    setPadBottomMargin(28);
                    setPadLeftMargin(20);
                    setPadRightMargin(20);
                    setLogoDisplay('blank_space');
                    setHeaderMode('blank_header');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition border ${
                    padTopMargin === 38 &&
                    padBottomMargin === 28 &&
                    padLeftMargin === 20 &&
                    padRightMargin === 20 &&
                    headerMode === 'blank_header'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="Office pad with pre-printed header (hides digital header completely, generous top clearance)"
                >
                  Official Pad (Blank Top Header)
                </button>
              </div>
            </div>
          </div>

          {/* On-Sheet Direct Editing Action Bar */}
          <div className="on-sheet-toolbar print:hidden bg-gradient-to-r from-blue-50/95 via-indigo-50/95 to-slate-50/95 border border-blue-200/90 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>On-Sheet Direct Editing Active: Click any cell, label, or text to modify directly.</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={onResetAllCustomLabels}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                title="Reset (Less) PF, Over Time, Income Tax labels across all 3 months"
              >
                <RotateCcw size={11} /> Reset Red Row Labels
              </button>
              <button
                type="button"
                onClick={() => onSyncCustomLabels(0)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                title="Sync Month 1 custom row labels to Month 2 & Month 3"
              >
                <Sparkles size={11} /> Sync Labels (M1 &rarr; M2/M3)
              </button>
              <button
                type="button"
                onClick={onResetAllTable}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                title="Reset 3-Month Breakdown Table to defaults"
              >
                <RotateCcw size={11} /> Reset Table
              </button>
              <button
                type="button"
                onClick={onResetEntireDocument}
                className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                title="Reset all fields, amounts, and labels to defaults"
              >
                <RotateCcw size={11} /> Reset Entire Document
              </button>
            </div>
          </div>
        </>
      )}

      {/* PAGE 1 CONTAINER */}
      <div className="salary-page-wrapper salary-page-1-wrapper relative group print:m-0 print:p-0">
        <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-gray-500 print:hidden">
          <span className="uppercase tracking-wider">Page 1 of 2: Past 3 Months Breakdown</span>
          <span className="text-gray-400">Standard A4 Sheet (210mm x 297mm) • Verbatim Official Template</span>
        </div>

        <div className="salary-doc-page-wrapper w-full overflow-x-auto custom-scrollbar touch-scroll pb-4 print:p-0 print:m-0 print:overflow-visible">
          <div
            ref={page1Ref}
            id="salary-statement-page-1"
            className="salary-doc-page salary-doc-page-1 bg-white shadow-xl rounded-xl border border-gray-200 text-[13.5px] text-black leading-relaxed flex flex-col justify-start mx-auto overflow-hidden print:rounded-none print:border-none print:shadow-none print:m-0"
            style={{
              width: '794px',
              height: '1123px',
              minHeight: '1123px',
              maxHeight: '1123px',
              boxSizing: 'border-box',
              paddingTop: `${topPaddingPx}px`,
              paddingBottom: `${bottomPaddingPx}px`,
              paddingLeft: `${leftPaddingPx}px`,
              paddingRight: `${rightPaddingPx}px`,
              fontFamily: "'Times New Roman', Times, Georgia, serif",
            }}
          >
            {/* Top Letterhead (Visible in Plain Paper mode or if headerMode === 'company_info') */}
            {headerMode !== 'blank_header' && (
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
                <div className="flex items-center gap-4">
                  {logoDisplay === 'digital_logo' ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/logo.png"
                      alt="MEP Logo"
                      className="h-14 w-auto object-contain shrink-0"
                    />
                  ) : logoDisplay === 'blank_space' ? (
                    <div className="h-14 w-[105px] shrink-0" aria-hidden="true" />
                  ) : null}
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                      {formData.companyName}
                    </h2>
                    <p className="text-[11px] text-gray-700 leading-tight mt-0.5">
                      {formData.companyAddress}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Web: www.mepgroupbd.com | Email: hr@mepgroupbd.com
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Ref No and Date */}
            <div className="flex justify-between items-baseline mb-6 text-[14px]">
              <div className="flex items-center gap-1">
                <strong className="font-bold">Ref No:</strong>
                <EditableInlineText
                  value={formData.refNo}
                  defaultValue={initialDefaults.refNo}
                  onChange={(val) => setFormData((prev) => ({ ...prev, refNo: val }))}
                  onReset={() => onResetField('refNo')}
                  isMono={true}
                />
              </div>
              <div className="flex items-center gap-1">
                <span>Date:</span>
                <EditableInlineText
                  value={formData.date}
                  defaultValue={todayFormatted}
                  onChange={(val) => setFormData((prev) => ({ ...prev, date: val }))}
                  onReset={() => onResetField('date')}
                />
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center mb-6">
              <EditableInlineText
                value={formData.p1Title || 'To Whom It May Concern'}
                defaultValue="To Whom It May Concern"
                onChange={(val) => setFormData((prev) => ({ ...prev, p1Title: val }))}
                onReset={() => setFormData((prev) => ({ ...prev, p1Title: 'To Whom It May Concern' }))}
                isBold={true}
                isUnderline={true}
                className="text-[16px]"
              />
            </div>

            {/* Paragraph 1 */}
            <p className="text-justify mb-4 leading-normal text-[14px]">
              This is to certify that{' '}
              <EditableInlineText
                value={formData.salutation}
                defaultValue={initialDefaults.salutation}
                onChange={(val) => setFormData((prev) => ({ ...prev, salutation: val }))}
                onReset={() => onResetField('salutation')}
              />{' '}
              <EditableInlineText
                value={formData.name}
                defaultValue={initialDefaults.name}
                onChange={(val) => setFormData((prev) => ({ ...prev, name: val }))}
                onReset={() => onResetField('name')}
                isBold={true}
              />{' '}
              (Staff ID:{' '}
              <EditableInlineText
                value={formData.workerId}
                defaultValue={initialDefaults.workerId}
                onChange={(val) => setFormData((prev) => ({ ...prev, workerId: val }))}
                onReset={() => onResetField('workerId')}
              />
              ) has been employed with{' '}
              <EditableInlineText
                value={formData.companyName}
                defaultValue={initialDefaults.companyName}
                onChange={(val) => setFormData((prev) => ({ ...prev, companyName: val }))}
                onReset={() => onResetField('companyName')}
              />
              , a sister concern of MEP GROUP since{' '}
              <EditableInlineText
                value={formData.joiningDate}
                defaultValue={initialDefaults.joiningDate}
                onChange={(val) => setFormData((prev) => ({ ...prev, joiningDate: val }))}
                onReset={() => onResetField('joiningDate')}
                renderDisplay={(val) => renderOrdinalDateText(val)}
              />
              .{' '}
              <EditableInlineText
                value={formData.genderPronoun}
                defaultValue={initialDefaults.genderPronoun}
                onChange={(val) => setFormData((prev) => ({ ...prev, genderPronoun: val as any }))}
                onReset={() => onResetField('genderPronoun')}
              />{' '}
              is currently working as a{' '}
              <EditableInlineText
                value={formData.designation}
                defaultValue={initialDefaults.designation}
                onChange={(val) => setFormData((prev) => ({ ...prev, designation: val }))}
                onReset={() => onResetField('designation')}
              />{' '}
              in the{' '}
              <EditableInlineText
                value={formData.department}
                defaultValue={initialDefaults.department}
                onChange={(val) => setFormData((prev) => ({ ...prev, department: val }))}
                onReset={() => onResetField('department')}
              />{' '}
              Department.{' '}
              <EditableInlineText
                value={formData.genderPronoun}
                defaultValue={initialDefaults.genderPronoun}
                onChange={(val) => setFormData((prev) => ({ ...prev, genderPronoun: val as any }))}
                onReset={() => onResetField('genderPronoun')}
              />{' '}
              is a permanent employee of MEP GROUP.
            </p>

            {/* Intro line before table */}
            <p className="mb-3 text-[14px]">
              <EditableInlineText
                value={
                  formData.p1IntroText ||
                  `The details of ${getPossessivePronoun(formData.genderPronoun)} gross monthly salary for the past three months are as follows:`
                }
                defaultValue={`The details of ${getPossessivePronoun(formData.genderPronoun)} gross monthly salary for the past three months are as follows:`}
                onChange={(val) => setFormData((prev) => ({ ...prev, p1IntroText: val }))}
                onReset={() =>
                  setFormData((prev) => ({
                    ...prev,
                    p1IntroText: `The details of ${getPossessivePronoun(formData.genderPronoun)} gross monthly salary for the past three months are as follows:`,
                  }))
                }
              />
            </p>

            {/* Past 3 Months Table (6 Columns: Month 1 | Month 2 | Month 3) */}
            <table className="salary-table w-full table-fixed border-collapse border border-black text-[13px] mb-4">
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '13.33%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '13.33%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '13.34%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th colSpan={2} className="border border-black py-1.5 px-2.5 text-center font-bold text-[13.5px] w-1/3 align-middle leading-normal">
                    <EditableInlineText
                      value={formData.months[0].monthName}
                      defaultValue={initialDefaults.months[0].monthName}
                      onChange={(val) => onMonthChange(0, 'monthName', val)}
                      onReset={() => onResetMonthAmount(0, 'monthName')}
                      isBold={true}
                    />
                  </th>
                  <th colSpan={2} className="border border-black py-1.5 px-2.5 text-center font-bold text-[13.5px] w-1/3 align-middle leading-normal">
                    <EditableInlineText
                      value={formData.months[1].monthName}
                      defaultValue={initialDefaults.months[1].monthName}
                      onChange={(val) => onMonthChange(1, 'monthName', val)}
                      onReset={() => onResetMonthAmount(1, 'monthName')}
                      isBold={true}
                    />
                  </th>
                  <th colSpan={2} className="relative border border-black py-1.5 px-2.5 text-center font-bold text-[13.5px] w-1/3 align-middle leading-normal">
                    <EditableInlineText
                      value={formData.months[2].monthName}
                      defaultValue={initialDefaults.months[2].monthName}
                      onChange={(val) => onMonthChange(2, 'monthName', val)}
                      onReset={() => onResetMonthAmount(2, 'monthName')}
                      isBold={true}
                    />
                    {/* Corner + button to add new custom row */}
                    <div className="print:hidden absolute right-1.5 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={onAddCustomRow}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs transition cursor-pointer"
                        title="Add New Row (+)"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        <span>Add</span>
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Gross Salary */}
                <tr>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal w-[20%]">
                    <EditableLabelCell
                      value={formData.months[0].grossLabel || 'Gross Salary'}
                      defaultValue="Gross Salary"
                      onChange={(val) => onMonthChange(0, 'grossLabel', val)}
                      onReset={() => onResetRowLabel(0, 'grossLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right w-[13.33%]">
                    <EditableAmountCell
                      value={formData.months[0].grossSalary}
                      onChange={(val) => onMonthChange(0, 'grossSalary', val)}
                      onReset={() => onResetMonthAmount(0, 'grossSalary')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal w-[20%]">
                    <EditableLabelCell
                      value={formData.months[1].grossLabel || 'Gross Salary'}
                      defaultValue="Gross Salary"
                      onChange={(val) => onMonthChange(1, 'grossLabel', val)}
                      onReset={() => onResetRowLabel(1, 'grossLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right w-[13.33%]">
                    <EditableAmountCell
                      value={formData.months[1].grossSalary}
                      onChange={(val) => onMonthChange(1, 'grossSalary', val)}
                      onReset={() => onResetMonthAmount(1, 'grossSalary')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal w-[20%]">
                    <EditableLabelCell
                      value={formData.months[2].grossLabel || 'Gross Salary'}
                      defaultValue="Gross Salary"
                      onChange={(val) => onMonthChange(2, 'grossLabel', val)}
                      onReset={() => onResetRowLabel(2, 'grossLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right w-[13.34%]">
                    <EditableAmountCell
                      value={formData.months[2].grossSalary}
                      onChange={(val) => onMonthChange(2, 'grossSalary', val)}
                      onReset={() => onResetMonthAmount(2, 'grossSalary')}
                    />
                  </td>
                </tr>

                {/* Row 2: Basic */}
                <tr>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[0].basicLabel || 'Basic'}
                      defaultValue="Basic"
                      onChange={(val) => onMonthChange(0, 'basicLabel', val)}
                      onReset={() => onResetRowLabel(0, 'basicLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[0].basicSalary}
                      onChange={(val) => onMonthChange(0, 'basicSalary', val)}
                      onReset={() => onResetMonthAmount(0, 'basicSalary')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[1].basicLabel || 'Basic'}
                      defaultValue="Basic"
                      onChange={(val) => onMonthChange(1, 'basicLabel', val)}
                      onReset={() => onResetRowLabel(1, 'basicLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[1].basicSalary}
                      onChange={(val) => onMonthChange(1, 'basicSalary', val)}
                      onReset={() => onResetMonthAmount(1, 'basicSalary')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[2].basicLabel || 'Basic'}
                      defaultValue="Basic"
                      onChange={(val) => onMonthChange(2, 'basicLabel', val)}
                      onReset={() => onResetRowLabel(2, 'basicLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[2].basicSalary}
                      onChange={(val) => onMonthChange(2, 'basicSalary', val)}
                      onReset={() => onResetMonthAmount(2, 'basicSalary')}
                    />
                  </td>
                </tr>

                {/* Row 3: House Rent */}
                <tr>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[0].houseRentLabel || 'House Rent'}
                      defaultValue="House Rent"
                      onChange={(val) => onMonthChange(0, 'houseRentLabel', val)}
                      onReset={() => onResetRowLabel(0, 'houseRentLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[0].houseRent}
                      onChange={(val) => onMonthChange(0, 'houseRent', val)}
                      onReset={() => onResetMonthAmount(0, 'houseRent')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[1].houseRentLabel || 'House Rent'}
                      defaultValue="House Rent"
                      onChange={(val) => onMonthChange(1, 'houseRentLabel', val)}
                      onReset={() => onResetRowLabel(1, 'houseRentLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[1].houseRent}
                      onChange={(val) => onMonthChange(1, 'houseRent', val)}
                      onReset={() => onResetMonthAmount(1, 'houseRent')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[2].houseRentLabel || 'House Rent'}
                      defaultValue="House Rent"
                      onChange={(val) => onMonthChange(2, 'houseRentLabel', val)}
                      onReset={() => onResetRowLabel(2, 'houseRentLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[2].houseRent}
                      onChange={(val) => onMonthChange(2, 'houseRent', val)}
                      onReset={() => onResetMonthAmount(2, 'houseRent')}
                    />
                  </td>
                </tr>

                {/* Row 4: Medical */}
                <tr>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[0].medicalLabel || 'Medical'}
                      defaultValue="Medical"
                      onChange={(val) => onMonthChange(0, 'medicalLabel', val)}
                      onReset={() => onResetRowLabel(0, 'medicalLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[0].medical}
                      onChange={(val) => onMonthChange(0, 'medical', val)}
                      onReset={() => onResetMonthAmount(0, 'medical')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[1].medicalLabel || 'Medical'}
                      defaultValue="Medical"
                      onChange={(val) => onMonthChange(1, 'medicalLabel', val)}
                      onReset={() => onResetRowLabel(1, 'medicalLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[1].medical}
                      onChange={(val) => onMonthChange(1, 'medical', val)}
                      onReset={() => onResetMonthAmount(1, 'medical')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[2].medicalLabel || 'Medical'}
                      defaultValue="Medical"
                      onChange={(val) => onMonthChange(2, 'medicalLabel', val)}
                      onReset={() => onResetRowLabel(2, 'medicalLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[2].medical}
                      onChange={(val) => onMonthChange(2, 'medical', val)}
                      onReset={() => onResetMonthAmount(2, 'medical')}
                    />
                  </td>
                </tr>

                {/* Row 5: Conveyance */}
                <tr>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[0].conveyanceLabel || 'Conveyance'}
                      defaultValue="Conveyance"
                      onChange={(val) => onMonthChange(0, 'conveyanceLabel', val)}
                      onReset={() => onResetRowLabel(0, 'conveyanceLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[0].conveyance}
                      onChange={(val) => onMonthChange(0, 'conveyance', val)}
                      onReset={() => onResetMonthAmount(0, 'conveyance')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[1].conveyanceLabel || 'Conveyance'}
                      defaultValue="Conveyance"
                      onChange={(val) => onMonthChange(1, 'conveyanceLabel', val)}
                      onReset={() => onResetRowLabel(1, 'conveyanceLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[1].conveyance}
                      onChange={(val) => onMonthChange(1, 'conveyance', val)}
                      onReset={() => onResetMonthAmount(1, 'conveyance')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[2].conveyanceLabel || 'Conveyance'}
                      defaultValue="Conveyance"
                      onChange={(val) => onMonthChange(2, 'conveyanceLabel', val)}
                      onReset={() => onResetRowLabel(2, 'conveyanceLabel')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[2].conveyance}
                      onChange={(val) => onMonthChange(2, 'conveyance', val)}
                      onReset={() => onResetMonthAmount(2, 'conveyance')}
                    />
                  </td>
                </tr>

                {/* Dynamic Variable Rows (PF, Over Time, Income Tax, Custom Rows) */}
                {(formData.customRows || []).map((row) => {
                  const initRow = initialDefaults.customRows?.find((r) => r.id === row.id);
                  return (
                    <tr key={row.id} className="relative group/custom-row">
                      {/* Month 0 */}
                      <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                        <div className="flex items-center justify-between gap-1 w-full min-h-[22px]">
                          <div
                            className="print:hidden flex items-center shrink-0 border border-slate-300 rounded overflow-hidden shadow-2xs text-[10px] font-bold bg-white"
                            title={`Month 1: ${row.types[0] === 'addition' ? 'Addition (+)' : 'Deduction (-)'}. Click to switch.`}
                          >
                            <button
                              type="button"
                              onClick={() => onToggleCustomRowType(row.id, 0, 'addition')}
                              className={`px-1.5 py-0.5 transition cursor-pointer ${
                                row.types[0] === 'addition'
                                  ? 'bg-emerald-600 text-white font-extrabold shadow-inner'
                                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title="Add to Net Payable (+)"
                            >
                              +
                            </button>
                            <div className="w-[1px] h-3.5 bg-slate-200" />
                            <button
                              type="button"
                              onClick={() => onToggleCustomRowType(row.id, 0, 'deduction')}
                              className={`px-1.5 py-0.5 transition cursor-pointer ${
                                row.types[0] === 'deduction'
                                  ? 'bg-rose-600 text-white font-extrabold shadow-inner'
                                  : 'text-slate-400 hover:text-rose-700 hover:bg-rose-50'
                              }`}
                              title="Deduct from Net Payable (-)"
                            >
                              -
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <EditableLabelCell
                              value={row.labels[0]}
                              defaultValue={initRow?.labels[0] || row.labels[0]}
                              onChange={(val) => onCustomRowLabelChange(row.id, 0, val)}
                              onReset={() => onResetCustomRowLabel(row.id, 0)}
                              highlight={true}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                        <EditableAmountCell
                          value={row.amounts[0]}
                          onChange={(val) => onCustomRowAmountChange(row.id, 0, val)}
                          onReset={() => onResetCustomRowAmount(row.id, 0)}
                          defaultValue={initRow?.amounts[0] ?? 0}
                        />
                      </td>

                      {/* Month 1 */}
                      <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                        <div className="flex items-center justify-between gap-1 w-full min-h-[22px]">
                          <div
                            className="print:hidden flex items-center shrink-0 border border-slate-300 rounded overflow-hidden shadow-2xs text-[10px] font-bold bg-white"
                            title={`Month 2: ${row.types[1] === 'addition' ? 'Addition (+)' : 'Deduction (-)'}. Click to switch.`}
                          >
                            <button
                              type="button"
                              onClick={() => onToggleCustomRowType(row.id, 1, 'addition')}
                              className={`px-1.5 py-0.5 transition cursor-pointer ${
                                row.types[1] === 'addition'
                                  ? 'bg-emerald-600 text-white font-extrabold shadow-inner'
                                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title="Add to Net Payable (+)"
                            >
                              +
                            </button>
                            <div className="w-[1px] h-3.5 bg-slate-200" />
                            <button
                              type="button"
                              onClick={() => onToggleCustomRowType(row.id, 1, 'deduction')}
                              className={`px-1.5 py-0.5 transition cursor-pointer ${
                                row.types[1] === 'deduction'
                                  ? 'bg-rose-600 text-white font-extrabold shadow-inner'
                                  : 'text-slate-400 hover:text-rose-700 hover:bg-rose-50'
                              }`}
                              title="Deduct from Net Payable (-)"
                            >
                              -
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <EditableLabelCell
                              value={row.labels[1]}
                              defaultValue={initRow?.labels[1] || row.labels[1]}
                              onChange={(val) => onCustomRowLabelChange(row.id, 1, val)}
                              onReset={() => onResetCustomRowLabel(row.id, 1)}
                              highlight={true}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                        <EditableAmountCell
                          value={row.amounts[1]}
                          onChange={(val) => onCustomRowAmountChange(row.id, 1, val)}
                          onReset={() => onResetCustomRowAmount(row.id, 1)}
                          defaultValue={initRow?.amounts[1] ?? 0}
                        />
                      </td>

                      {/* Month 2 */}
                      <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                        <div className="flex items-center justify-between gap-1 w-full min-h-[22px]">
                          <div
                            className="print:hidden flex items-center shrink-0 border border-slate-300 rounded overflow-hidden shadow-2xs text-[10px] font-bold bg-white"
                            title={`Month 3: ${row.types[2] === 'addition' ? 'Addition (+)' : 'Deduction (-)'}. Click to switch.`}
                          >
                            <button
                              type="button"
                              onClick={() => onToggleCustomRowType(row.id, 2, 'addition')}
                              className={`px-1.5 py-0.5 transition cursor-pointer ${
                                row.types[2] === 'addition'
                                  ? 'bg-emerald-600 text-white font-extrabold shadow-inner'
                                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title="Add to Net Payable (+)"
                            >
                              +
                            </button>
                            <div className="w-[1px] h-3.5 bg-slate-200" />
                            <button
                              type="button"
                              onClick={() => onToggleCustomRowType(row.id, 2, 'deduction')}
                              className={`px-1.5 py-0.5 transition cursor-pointer ${
                                row.types[2] === 'deduction'
                                  ? 'bg-rose-600 text-white font-extrabold shadow-inner'
                                  : 'text-slate-400 hover:text-rose-700 hover:bg-rose-50'
                              }`}
                              title="Deduct from Net Payable (-)"
                            >
                              -
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <EditableLabelCell
                              value={row.labels[2]}
                              defaultValue={initRow?.labels[2] || row.labels[2]}
                              onChange={(val) => onCustomRowLabelChange(row.id, 2, val)}
                              onReset={() => onResetCustomRowLabel(row.id, 2)}
                              highlight={true}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                        <div className="flex items-center justify-end gap-1 w-full">
                          <div className="flex-1 text-right">
                            <EditableAmountCell
                              value={row.amounts[2]}
                              onChange={(val) => onCustomRowAmountChange(row.id, 2, val)}
                              onReset={() => onResetCustomRowAmount(row.id, 2)}
                              defaultValue={initRow?.amounts[2] ?? 0}
                            />
                          </div>
                          {/* Minus button to remove this row */}
                          <button
                            type="button"
                            onClick={() => onRemoveCustomRow(row.id)}
                            className="print:hidden shrink-0 w-4 h-4 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-300 flex items-center justify-center transition shadow-2xs cursor-pointer"
                            title="Delete this row (-)"
                          >
                            <Minus size={10} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Add Row Corner / Control Bar right below dynamic rows (print:hidden) */}
                <tr className="print:hidden bg-slate-50/90 hover:bg-slate-100 transition border-y border-dashed border-slate-300">
                  <td colSpan={6} className="py-1 px-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Variable Rows ({formData.customRows?.length || 0} active) • Use (+, -) to switch addition or deduction
                      </span>
                      <button
                        type="button"
                        onClick={onAddCustomRow}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition cursor-pointer"
                        title="Add New Row (+)"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        Add Row (+)
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 9: Net Payable= */}
                <tr className="font-bold">
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[0].netPayableLabel || 'Net Payable='}
                      defaultValue="Net Payable="
                      onChange={(val) => onMonthChange(0, 'netPayableLabel', val)}
                      onReset={() => onResetRowLabel(0, 'netPayableLabel')}
                      isBold={true}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[0].netPayable}
                      onChange={(val) => onMonthChange(0, 'netPayable', val)}
                      onReset={() => onResetNetPayable(0)}
                      isBold={true}
                      defaultValue={initialDefaults.months[0].netPayable}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[1].netPayableLabel || 'Net Payable='}
                      defaultValue="Net Payable="
                      onChange={(val) => onMonthChange(1, 'netPayableLabel', val)}
                      onReset={() => onResetRowLabel(1, 'netPayableLabel')}
                      isBold={true}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[1].netPayable}
                      onChange={(val) => onMonthChange(1, 'netPayable', val)}
                      onReset={() => onResetNetPayable(1)}
                      isBold={true}
                      defaultValue={initialDefaults.months[1].netPayable}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.months[2].netPayableLabel || 'Net Payable='}
                      defaultValue="Net Payable="
                      onChange={(val) => onMonthChange(2, 'netPayableLabel', val)}
                      onReset={() => onResetRowLabel(2, 'netPayableLabel')}
                      isBold={true}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-2 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.months[2].netPayable}
                      onChange={(val) => onMonthChange(2, 'netPayable', val)}
                      onReset={() => onResetNetPayable(2)}
                      isBold={true}
                      defaultValue={initialDefaults.months[2].netPayable}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Closing Paragraph */}
            <p className="text-justify mt-3.5 mb-4 leading-normal text-[14px]">
              This certificate is issued upon {getPossessivePronoun(formData.genderPronoun)} personal request for the purpose of{' '}
              <EditableInlineText
                value={formData.purpose}
                defaultValue={initialDefaults.purpose}
                onChange={(val) => setFormData((prev) => ({ ...prev, purpose: val }))}
                onReset={() => onResetField('purpose')}
              />
              , for which Company or undersigned has no responsibility or liability at all.
            </p>

            {/* Spacer to push signature section down to bottom */}
            <div className="salary-signature-spacer flex-1 min-h-[48px]" />

            {/* Signatory Section */}
            <div className="salary-signature-block mt-auto pt-6 text-[14px] leading-snug shrink-0">
              <div className="w-52 border-b border-black mb-2" />
              <div className="font-bold">
                <EditableInlineText
                  value={formData.signatoryName}
                  defaultValue={initialDefaults.signatoryName}
                  onChange={(val) => setFormData((prev) => ({ ...prev, signatoryName: val }))}
                  onReset={() => onResetField('signatoryName')}
                  isBold={true}
                />
              </div>
              <div>
                <EditableInlineText
                  value={formData.signatoryTitle}
                  defaultValue={initialDefaults.signatoryTitle}
                  onChange={(val) => setFormData((prev) => ({ ...prev, signatoryTitle: val }))}
                  onReset={() => onResetField('signatoryTitle')}
                />
              </div>
              <div>
                <EditableInlineText
                  value={formData.signatoryDepartment}
                  defaultValue={initialDefaults.signatoryDepartment}
                  onChange={(val) => setFormData((prev) => ({ ...prev, signatoryDepartment: val }))}
                  onReset={() => onResetField('signatoryDepartment')}
                />
              </div>
              <div>
                <EditableInlineText
                  value={formData.signatoryOrg}
                  defaultValue={initialDefaults.signatoryOrg}
                  onChange={(val) => setFormData((prev) => ({ ...prev, signatoryOrg: val }))}
                  onReset={() => onResetField('signatoryOrg')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2 CONTAINER */}
      <div className="salary-page-wrapper salary-page-2-wrapper relative group print:m-0 print:p-0">
        <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-gray-500 print:hidden">
          <span className="uppercase tracking-wider">Page 2 of 2: Monthly Salary Certificate</span>
          <span className="text-gray-400">Standard A4 Sheet (210mm x 297mm) • Verbatim Official Template</span>
        </div>

        <div className="salary-doc-page-wrapper w-full overflow-x-auto custom-scrollbar touch-scroll pb-4 print:p-0 print:m-0 print:overflow-visible">
          <div
            ref={page2Ref}
            id="salary-statement-page-2"
            className="salary-doc-page salary-doc-page-2 bg-white shadow-xl rounded-xl border border-gray-200 text-[13.5px] text-black leading-relaxed flex flex-col justify-start mx-auto overflow-hidden print:rounded-none print:border-none print:shadow-none print:m-0"
            style={{
              width: '794px',
              height: '1123px',
              minHeight: '1123px',
              maxHeight: '1123px',
              boxSizing: 'border-box',
              paddingTop: `${topPaddingPx}px`,
              paddingBottom: `${bottomPaddingPx}px`,
              paddingLeft: `${leftPaddingPx}px`,
              paddingRight: `${rightPaddingPx}px`,
              fontFamily: "'Times New Roman', Times, Georgia, serif",
            }}
          >
            {/* Top Letterhead */}
            {headerMode !== 'blank_header' && (
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
                <div className="flex items-center gap-4">
                  {logoDisplay === 'digital_logo' ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/logo.png"
                      alt="MEP Logo"
                      className="h-14 w-auto object-contain shrink-0"
                    />
                  ) : logoDisplay === 'blank_space' ? (
                    <div className="h-14 w-[105px] shrink-0" aria-hidden="true" />
                  ) : null}
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-wide text-black">
                      {formData.companyName}
                    </h2>
                    <p className="text-[11px] text-gray-700 leading-tight mt-0.5">
                      {formData.companyAddress}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Web: www.mepgroupbd.com | Email: hr@mepgroupbd.com
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Ref No and Date */}
            <div className="flex justify-between items-baseline mb-6 text-[14px]">
              <div className="flex items-center gap-1">
                <strong className="font-bold">Ref No:</strong>
                <EditableInlineText
                  value={formData.refNo}
                  defaultValue={initialDefaults.refNo}
                  onChange={(val) => setFormData((prev) => ({ ...prev, refNo: val }))}
                  onReset={() => onResetField('refNo')}
                  isMono={true}
                />
              </div>
              <div className="flex items-center gap-1">
                <span>Date:</span>
                <EditableInlineText
                  value={formData.date}
                  defaultValue={todayFormatted}
                  onChange={(val) => setFormData((prev) => ({ ...prev, date: val }))}
                  onReset={() => onResetField('date')}
                />
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center mb-6">
              <EditableInlineText
                value={formData.p2Title || 'Monthly Salary Certificate'}
                defaultValue="Monthly Salary Certificate"
                onChange={(val) => setFormData((prev) => ({ ...prev, p2Title: val }))}
                onReset={() => setFormData((prev) => ({ ...prev, p2Title: 'Monthly Salary Certificate' }))}
                isBold={true}
                isUnderline={true}
                className="text-[16px]"
              />
            </div>

            {/* Paragraph 1 */}
            <p className="text-justify mb-4 leading-normal text-[14px]">
              This is to certify that{' '}
              <EditableInlineText
                value={formData.salutation}
                defaultValue={initialDefaults.salutation}
                onChange={(val) => setFormData((prev) => ({ ...prev, salutation: val }))}
                onReset={() => onResetField('salutation')}
              />{' '}
              <EditableInlineText
                value={formData.name}
                defaultValue={initialDefaults.name}
                onChange={(val) => setFormData((prev) => ({ ...prev, name: val }))}
                onReset={() => onResetField('name')}
                isBold={true}
              />{' '}
              (Staff ID:{' '}
              <EditableInlineText
                value={formData.workerId}
                defaultValue={initialDefaults.workerId}
                onChange={(val) => setFormData((prev) => ({ ...prev, workerId: val }))}
                onReset={() => onResetField('workerId')}
              />
              ) has been employed with{' '}
              <EditableInlineText
                value={formData.companyName}
                defaultValue={initialDefaults.companyName}
                onChange={(val) => setFormData((prev) => ({ ...prev, companyName: val }))}
                onReset={() => onResetField('companyName')}
              />
              , a sister concern of MEP GROUP since{' '}
              <EditableInlineText
                value={formData.joiningDate}
                defaultValue={initialDefaults.joiningDate}
                onChange={(val) => setFormData((prev) => ({ ...prev, joiningDate: val }))}
                onReset={() => onResetField('joiningDate')}
                renderDisplay={(val) => renderOrdinalDateText(val)}
              />
              .{' '}
              <EditableInlineText
                value={formData.genderPronoun}
                defaultValue={initialDefaults.genderPronoun}
                onChange={(val) => setFormData((prev) => ({ ...prev, genderPronoun: val as any }))}
                onReset={() => onResetField('genderPronoun')}
              />{' '}
              is currently working as a{' '}
              <EditableInlineText
                value={formData.designation}
                defaultValue={initialDefaults.designation}
                onChange={(val) => setFormData((prev) => ({ ...prev, designation: val }))}
                onReset={() => onResetField('designation')}
              />{' '}
              in the{' '}
              <EditableInlineText
                value={formData.department}
                defaultValue={initialDefaults.department}
                onChange={(val) => setFormData((prev) => ({ ...prev, department: val }))}
                onReset={() => onResetField('department')}
              />{' '}
              Department.{' '}
              <EditableInlineText
                value={formData.genderPronoun}
                defaultValue={initialDefaults.genderPronoun}
                onChange={(val) => setFormData((prev) => ({ ...prev, genderPronoun: val as any }))}
                onReset={() => onResetField('genderPronoun')}
              />{' '}
              is a permanent employee of MEP GROUP.
            </p>

            {/* Intro line before table */}
            <p className="mb-3 text-[14px]">
              <EditableInlineText
                value={
                  formData.p2CustomParagraph ||
                  `Details of ${getPossessivePronoun(formData.genderPronoun)} monthly salary & allowance are as follows:`
                }
                defaultValue={`Details of ${getPossessivePronoun(formData.genderPronoun)} monthly salary & allowance are as follows:`}
                onChange={(val) => setFormData((prev) => ({ ...prev, p2CustomParagraph: val }))}
                onReset={() =>
                  setFormData((prev) => ({
                    ...prev,
                    p2CustomParagraph: `Details of ${getPossessivePronoun(formData.genderPronoun)} monthly salary & allowance are as follows:`,
                  }))
                }
              />
            </p>

            {/* 2-Column Monthly Salary & Allowance Table */}
            <table className="salary-table w-full table-fixed border-collapse border border-black text-[13.5px] mb-3">
              <colgroup>
                <col style={{ width: '65%' }} />
                <col style={{ width: '35%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal w-[65%]">
                    <EditableLabelCell
                      value={formData.structureBasicLabel || 'Basic'}
                      defaultValue="Basic"
                      onChange={(val) => setFormData((prev) => ({ ...prev, structureBasicLabel: val }))}
                      onReset={() => onResetStructureRow('structureBasicLabel', 'Basic')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right w-[35%]">
                    <EditableAmountCell
                      value={formData.structureBasic}
                      onChange={(val) => onStructureChange('structureBasic', val)}
                      onReset={() => onResetStructureRow('structureBasicLabel', 'Basic', 'structureBasic')}
                      defaultValue={initialDefaults.structureBasic}
                      decimals={2}
                      suffix=""
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.structureHouseRentLabel || 'House Rent'}
                      defaultValue="House Rent"
                      onChange={(val) => setFormData((prev) => ({ ...prev, structureHouseRentLabel: val }))}
                      onReset={() => onResetStructureRow('structureHouseRentLabel', 'House Rent')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.structureHouseRent}
                      onChange={(val) => onStructureChange('structureHouseRent', val)}
                      onReset={() => onResetStructureRow('structureHouseRentLabel', 'House Rent', 'structureHouseRent')}
                      defaultValue={initialDefaults.structureHouseRent}
                      decimals={2}
                      suffix=""
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.structureMedicalLabel || 'Medical Allowance'}
                      defaultValue="Medical Allowance"
                      onChange={(val) => setFormData((prev) => ({ ...prev, structureMedicalLabel: val }))}
                      onReset={() => onResetStructureRow('structureMedicalLabel', 'Medical Allowance')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.structureMedical}
                      onChange={(val) => onStructureChange('structureMedical', val)}
                      onReset={() => onResetStructureRow('structureMedicalLabel', 'Medical Allowance', 'structureMedical')}
                      defaultValue={initialDefaults.structureMedical}
                      decimals={2}
                      suffix=""
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.structureConveyanceLabel || 'Conveyance'}
                      defaultValue="Conveyance"
                      onChange={(val) => setFormData((prev) => ({ ...prev, structureConveyanceLabel: val }))}
                      onReset={() => onResetStructureRow('structureConveyanceLabel', 'Conveyance')}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.structureConveyance}
                      onChange={(val) => onStructureChange('structureConveyance', val)}
                      onReset={() => onResetStructureRow('structureConveyanceLabel', 'Conveyance', 'structureConveyance')}
                      defaultValue={initialDefaults.structureConveyance}
                      decimals={2}
                      suffix=""
                    />
                  </td>
                </tr>
                <tr className="font-bold">
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal">
                    <EditableLabelCell
                      value={formData.structureTotalLabel || 'Total Salary'}
                      defaultValue="Total Salary"
                      onChange={(val) => setFormData((prev) => ({ ...prev, structureTotalLabel: val }))}
                      onReset={() => onResetStructureRow('structureTotalLabel', 'Total Salary')}
                      isBold={true}
                    />
                  </td>
                  <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right">
                    <EditableAmountCell
                      value={formData.structureTotal}
                      onChange={(val) => setFormData((prev) => ({ ...prev, structureTotal: val }))}
                      onReset={onResetSalaryStructure}
                      isBold={true}
                      defaultValue={initialDefaults.structureTotal}
                      decimals={2}
                      suffix=""
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* In Word line */}
            <div className="font-bold text-[14px] mt-2 mb-3 flex items-center gap-1 flex-wrap">
              <span>In Word: -</span>
              <EditableInlineText
                value={(formData.amountInWords || '').replace(/^In Word:\s*-?\s*/i, '').trim()}
                defaultValue={initialDefaults.amountInWords}
                onChange={(val) => setFormData((prev) => ({ ...prev, amountInWords: val }))}
                onReset={() => onResetField('amountInWords')}
                isBold={true}
              />
            </div>

            {/* Monthly salary details heading */}
            <div className="mt-3 mb-2">
              <span className="font-bold salary-doc-title-underline text-[14px] inline-block">
                Monthly salary details:
              </span>
            </div>

            {/* Numbered Items List */}
            <div className="space-y-2 text-[14px] leading-relaxed">
              <p className="leading-relaxed">
                <span>1. </span>
                <EditableInlineText
                  value={formData.bankName}
                  defaultValue={initialDefaults.bankName}
                  onChange={(val) => setFormData((prev) => ({ ...prev, bankName: val }))}
                  onReset={() => onResetField('bankName')}
                />
                <span> (A/C No. </span>
                <EditableInlineText
                  value={formData.bankAccountNo}
                  defaultValue={initialDefaults.bankAccountNo}
                  onChange={(val) => setFormData((prev) => ({ ...prev, bankAccountNo: val }))}
                  onReset={() => onResetField('bankAccountNo')}
                  isMono={true}
                />
                <span>) payable amount: </span>
                <EditableInlineAmount
                  value={formData.monthlyPayableAmount}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthlyPayableAmount: val,
                      monthlyPayableInWords: formatWordsOnly(val),
                    }))
                  }
                  onReset={() => onResetField('monthlyPayableAmount')}
                  defaultValue={initialDefaults.monthlyPayableAmount}
                  suffix="/-"
                />
                <span> (In Word: - </span>
                <EditableInlineText
                  value={(formData.monthlyPayableInWords || '')
                    .replace(/^\(?In Word:\s*-?\s*/i, '')
                    .replace(/\)?\s*$/, '')
                    .trim()}
                  defaultValue={initialDefaults.monthlyPayableInWords}
                  onChange={(val) => setFormData((prev) => ({ ...prev, monthlyPayableInWords: val }))}
                  onReset={() => onResetField('monthlyPayableInWords')}
                />
                <span>)</span>
              </p>
              <p className="leading-relaxed">
                <span>2. </span>
                <EditableInlineText
                  value={formData.p2Item2Label || 'Total deduction amount (PF purpose Tk.'}
                  defaultValue="Total deduction amount (PF purpose Tk."
                  onChange={(val) => setFormData((prev) => ({ ...prev, p2Item2Label: val }))}
                  onReset={() => onResetField('p2Item2Label')}
                />{' '}
                <EditableInlineAmount
                  value={formData.pfDeductionPage2}
                  onChange={(val) => onPage2PfChange(val)}
                  onReset={() => onResetField('pfDeductionPage2')}
                  defaultValue={initialDefaults.pfDeductionPage2}
                  suffix="/-"
                />
                <span>)</span>
              </p>
              <div className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5">3.</span>
                <div className="flex-1 min-w-0">
                  <EditableInlineText
                    value={formData.disclaimer}
                    defaultValue={initialDefaults.disclaimer}
                    onChange={(val) => setFormData((prev) => ({ ...prev, disclaimer: val }))}
                    onReset={() => onResetField('disclaimer')}
                    multiline={true}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Spacer to push signature section down to bottom */}
            <div className="salary-signature-spacer flex-1 min-h-[54px]" />

            {/* Signatory Section */}
            <div className="salary-signature-block mt-auto pt-6 text-[14px] leading-snug shrink-0">
              <div className="w-52 border-b border-black mb-2" />
              <div className="font-bold">
                <EditableInlineText
                  value={formData.signatoryName}
                  defaultValue={initialDefaults.signatoryName}
                  onChange={(val) => setFormData((prev) => ({ ...prev, signatoryName: val }))}
                  onReset={() => onResetField('signatoryName')}
                  isBold={true}
                />
              </div>
              <div>
                <EditableInlineText
                  value={formData.signatoryTitle}
                  defaultValue={initialDefaults.signatoryTitle}
                  onChange={(val) => setFormData((prev) => ({ ...prev, signatoryTitle: val }))}
                  onReset={() => onResetField('signatoryTitle')}
                />
              </div>
              <div>
                <EditableInlineText
                  value={formData.signatoryDepartment}
                  defaultValue={initialDefaults.signatoryDepartment}
                  onChange={(val) => setFormData((prev) => ({ ...prev, signatoryDepartment: val }))}
                  onReset={() => onResetField('signatoryDepartment')}
                />
              </div>
              <div>
                <EditableInlineText
                  value={formData.signatoryOrg}
                  defaultValue={initialDefaults.signatoryOrg}
                  onChange={(val) => setFormData((prev) => ({ ...prev, signatoryOrg: val }))}
                  onReset={() => onResetField('signatoryOrg')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
