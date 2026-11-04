'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Printer,
  Download,
  Building2,
  User,
  CheckCircle2,
  FileSpreadsheet,
  DollarSign,
  FileText,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  Loader2,
  Sliders,
  Sparkles,
  RotateCcw,
  Undo2
} from 'lucide-react';
import { numberToWords, parseFlexibleDate } from '@/lib/formatDate';

interface MonthBreakdown {
  monthName: string;
  grossLabel?: string;
  grossSalary: number;
  basicLabel?: string;
  basicSalary: number;
  houseRentLabel?: string;
  houseRent: number;
  medicalLabel?: string;
  medical: number;
  conveyanceLabel?: string;
  conveyance: number;
  pfLabel?: string;
  pfType?: 'deduction' | 'addition';
  pfDeduction: number;
  overtimeLabel?: string;
  overtimeType?: 'deduction' | 'addition';
  overtime: number;
  incomeTaxLabel?: string;
  incomeTaxType?: 'deduction' | 'addition';
  incomeTax: number;
  netPayableLabel?: string;
  netPayable: number;
}

interface StatementData {
  refNo: string;
  date: string;
  workerId: string;
  name: string;
  salutation: string;
  genderPronoun: 'He' | 'She' | 'He/She';
  designation: string;
  department: string;
  companyName: string;
  companyAddress: string;
  joiningDate: string;
  purpose: string;
  months: [MonthBreakdown, MonthBreakdown, MonthBreakdown];
  // Page 2 specific
  structureBasicLabel?: string;
  structureBasic: number;
  structureHouseRentLabel?: string;
  structureHouseRent: number;
  structureMedicalLabel?: string;
  structureMedical: number;
  structureConveyanceLabel?: string;
  structureConveyance: number;
  structureTotalLabel?: string;
  structureTotal: number;
  amountInWords: string;
  bankName: string;
  bankAccountNo: string;
  monthlyPayableAmount: number;
  monthlyPayableInWords: string;
  p2Item2Label?: string;
  pfDeductionPage2: number;
  disclaimer: string;
  // Signatory
  signatoryName: string;
  signatoryTitle: string;
  signatoryDepartment: string;
  signatoryOrg: string;
  // Optional custom freeform paragraph overrides
  p1Title?: string;
  p1IntroText?: string;
  p1CustomParagraph?: string;
  p1CustomClosing?: string;
  p2Title?: string;
  p2CustomParagraph?: string;
}

function getRowMultiplier(
  explicitType?: 'deduction' | 'addition',
  defaultType: 'deduction' | 'addition' = 'deduction',
  label?: string
): number {
  if (explicitType === 'addition') return 1;
  if (explicitType === 'deduction') return -1;
  const l = (label || '').toLowerCase();
  if (
    l.includes('(less)') ||
    l.includes('less') ||
    l.includes('deduct') ||
    l.includes('tax') ||
    l.includes('loan') ||
    l.includes('advance') ||
    l.includes('stamp') ||
    l.includes('fine')
  ) {
    return -1;
  }
  if (
    l.includes('bonus') ||
    l.includes('over time') ||
    l.includes('overtime') ||
    l.includes('allowance') ||
    l.includes('arrear') ||
    l.includes('incentive') ||
    l.includes('reward')
  ) {
    return 1;
  }
  return defaultType === 'addition' ? 1 : -1;
}

function calculateMonthNetPayable(month: MonthBreakdown): number {
  const gross = Number(month.grossSalary) || 0;
  const pf = Number(month.pfDeduction) || 0;
  const overtime = Number(month.overtime) || 0;
  const incomeTax = Number(month.incomeTax) || 0;
  const pfMult = getRowMultiplier(month.pfType, 'deduction', month.pfLabel);
  const otMult = getRowMultiplier(month.overtimeType, 'addition', month.overtimeLabel);
  const itMult = getRowMultiplier(month.incomeTaxType, 'deduction', month.incomeTaxLabel);
  return Math.max(0, gross + pfMult * pf + otMult * overtime + itMult * incomeTax);
}

interface EditableLabelCellProps {
  value: string;
  defaultValue: string;
  onChange: (val: string) => void;
  onReset: () => void;
  highlight?: boolean;
  isBold?: boolean;
  align?: 'left' | 'right' | 'center';
}

function EditableLabelCell({
  value,
  defaultValue,
  onChange,
  onReset,
  highlight = false,
  isBold = false,
  align = 'left',
}: EditableLabelCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value || defaultValue);

  useEffect(() => {
    if (!isEditing) {
      setTempVal(value || defaultValue);
    }
  }, [value, defaultValue, isEditing]);

  const displayVal = value || defaultValue;
  const isModified = displayVal !== defaultValue;

  return (
    <div
      className={`relative group/cell flex items-center w-full min-h-[20px] px-1 py-0.5 rounded transition ${
        align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-between'
      } ${
        highlight
          ? 'custom-row-highlight bg-rose-50/40 hover:bg-rose-100/50 print:bg-transparent border-l-2 border-rose-400 print:border-l-0'
          : 'hover:bg-blue-50/50 print:hover:bg-transparent'
      }`}
    >
      {isEditing ? (
        <input
          type="text"
          autoFocus
          value={tempVal}
          onChange={(e) => {
            setTempVal(e.target.value);
            onChange(e.target.value);
          }}
          onBlur={() => {
            setIsEditing(false);
            if (!tempVal.trim()) {
              onChange(defaultValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
            } else if (e.key === 'Escape') {
              setTempVal(displayVal);
              setIsEditing(false);
            }
          }}
          className={`w-full bg-white border border-blue-500 rounded px-1 py-0.5 text-xs outline-none text-slate-900 shadow-inner ${
            isBold ? 'font-bold' : ''
          }`}
        />
      ) : (
        <span
          onClick={() => {
            setTempVal(displayVal);
            setIsEditing(true);
          }}
          className={`cursor-pointer flex-1 whitespace-nowrap overflow-visible select-none text-black ${
            isBold ? 'font-bold' : ''
          }`}
          title={highlight ? 'Customizable particulars label - Click to edit' : 'Click to edit label directly'}
        >
          {displayVal}
        </span>
      )}

      {onReset && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onReset();
            setTempVal(defaultValue);
            setIsEditing(false);
          }}
          className={`inline-reset-btn print:hidden p-0.5 rounded transition ml-1 shrink-0 ${
            isModified
              ? 'text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 opacity-90'
              : 'opacity-0 group-hover/cell:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-100/80'
          }`}
          title={`Reset label to "${defaultValue}"`}
        >
          <RotateCcw size={10} />
        </button>
      )}
    </div>
  );
}

interface EditableAmountCellProps {
  value: number;
  onChange: (val: number) => void;
  onReset?: () => void;
  defaultValue?: number;
  suffix?: string;
  isBold?: boolean;
  decimals?: number;
}

function EditableAmountCell({
  value,
  onChange,
  onReset,
  defaultValue,
  suffix = '/-',
  isBold = false,
  decimals = 0,
}: EditableAmountCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(String(value ?? 0));

  useEffect(() => {
    if (!isEditing) {
      setTempVal(String(value ?? 0));
    }
  }, [value, isEditing]);

  const formatted =
    decimals > 0
      ? Number(value || 0).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Number(value || 0).toLocaleString('en-US');

  const isModified =
    defaultValue !== undefined &&
    Math.round(Number(value || 0)) !== Math.round(Number(defaultValue || 0));

  return (
    <div className="relative group/amount flex items-center justify-end w-full min-h-[20px] px-1 py-0.5 rounded hover:bg-blue-50/50 print:hover:bg-transparent transition">
      {/* Position reset button on the LEFT so it NEVER shifts the right-aligned amount when hovered */}
      {onReset && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onReset();
            setIsEditing(false);
          }}
          className={`inline-reset-btn print:hidden p-0.5 rounded transition mr-auto shrink-0 ${
            isModified
              ? 'text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 opacity-90'
              : 'opacity-0 group-hover/amount:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-100/80'
          }`}
          title="Reset amount to default"
        >
          <RotateCcw size={10} />
        </button>
      )}

      {isEditing ? (
        <div className="flex items-center justify-end w-full max-w-[85px]">
          <input
            type="text"
            autoFocus
            value={tempVal}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, '');
              setTempVal(raw);
              const num = parseFloat(raw);
              onChange(isNaN(num) ? 0 : num);
            }}
            onBlur={() => {
              setIsEditing(false);
              const num = parseFloat(tempVal.replace(/[^0-9.]/g, ''));
              onChange(isNaN(num) ? 0 : num);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
              } else if (e.key === 'Escape') {
                setTempVal(String(value ?? 0));
                setIsEditing(false);
              }
            }}
            className={`w-full text-right bg-white border border-blue-500 rounded px-1 py-0.5 text-xs outline-none text-slate-900 shadow-inner ${
              isBold ? 'font-bold' : ''
            }`}
          />
          {suffix && <span className="ml-0.5 text-black shrink-0">{suffix}</span>}
        </div>
      ) : (
        <span
          onClick={() => {
            setTempVal(String(value ?? 0));
            setIsEditing(true);
          }}
          className={`cursor-pointer select-none text-black whitespace-nowrap overflow-visible ${isBold ? 'font-bold' : ''}`}
          title="Click to edit amount directly"
        >
          {formatted}
          {suffix}
        </span>
      )}
    </div>
  );
}

interface EditableInlineAmountProps {
  value: number;
  onChange: (val: number) => void;
  onReset?: () => void;
  defaultValue?: number;
  suffix?: string;
  isBold?: boolean;
  decimals?: number;
  className?: string;
}

function EditableInlineAmount({
  value,
  onChange,
  onReset,
  defaultValue,
  suffix = '/-',
  isBold = false,
  decimals = 0,
  className = '',
}: EditableInlineAmountProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(String(value ?? 0));

  useEffect(() => {
    if (!isEditing) {
      setTempVal(String(value ?? 0));
    }
  }, [value, isEditing]);

  const formatted =
    decimals > 0
      ? Number(value || 0).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Number(value || 0).toLocaleString('en-US');

  const isModified =
    defaultValue !== undefined &&
    Math.round(Number(value || 0)) !== Math.round(Number(defaultValue || 0));

  return (
    <span
      className={`relative inline-flex items-center group/inline-amt px-0.5 py-0.2 rounded hover:bg-blue-50/60 print:hover:bg-transparent transition align-baseline ${className}`}
    >
      {isEditing ? (
        <span className="inline-flex items-center">
          <input
            type="text"
            autoFocus
            value={tempVal}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, '');
              setTempVal(raw);
              const num = parseFloat(raw);
              onChange(isNaN(num) ? 0 : num);
            }}
            onBlur={() => {
              setIsEditing(false);
              const num = parseFloat(tempVal.replace(/[^0-9.]/g, ''));
              onChange(isNaN(num) ? 0 : num);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
              } else if (e.key === 'Escape') {
                setTempVal(String(value ?? 0));
                setIsEditing(false);
              }
            }}
            style={{ width: `${Math.max(5, tempVal.length + 2)}ch` }}
            className={`bg-white border border-blue-500 rounded px-1 py-0.5 text-inherit outline-none shadow-xs text-slate-900 ${
              isBold ? 'font-bold' : ''
            }`}
          />
          {suffix && <span className="ml-0.5 text-black shrink-0">{suffix}</span>}
        </span>
      ) : (
        <span
          onClick={() => {
            setTempVal(String(value ?? 0));
            setIsEditing(true);
          }}
          className={`cursor-pointer select-none text-black whitespace-nowrap overflow-visible ${isBold ? 'font-bold' : ''}`}
          title="Click to edit amount directly"
        >
          {formatted}{suffix}
        </span>
      )}

      {onReset && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onReset();
            setIsEditing(false);
          }}
          className={`inline-reset-btn print:hidden p-0.5 rounded transition ml-1 shrink-0 ${
            isModified
              ? 'text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 opacity-90'
              : 'opacity-0 group-hover/inline-amt:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-100/80'
          }`}
          title="Reset amount to default"
        >
          <RotateCcw size={10} />
        </button>
      )}
    </span>
  );
}

interface EditableInlineTextProps {
  value: string;
  defaultValue: string;
  onChange: (val: string) => void;
  onReset?: () => void;
  isBold?: boolean;
  isUnderline?: boolean;
  isMono?: boolean;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  renderDisplay?: (val: string) => React.ReactNode;
}

function EditableInlineText({
  value,
  defaultValue,
  onChange,
  onReset,
  isBold = false,
  isUnderline = false,
  isMono = false,
  placeholder = 'Click to edit...',
  className = '',
  multiline = false,
  renderDisplay,
}: EditableInlineTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value || defaultValue);

  useEffect(() => {
    if (!isEditing) {
      setTempVal(value || defaultValue);
    }
  }, [value, defaultValue, isEditing]);

  const displayVal = value || defaultValue;
  const isModified = displayVal !== defaultValue;

  if (multiline) {
    return (
      <div
        className={`relative group/multi w-full rounded p-1 hover:bg-blue-50/50 print:hover:bg-transparent transition ${className}`}
      >
        {isEditing ? (
          <div className="w-full space-y-1">
            <textarea
              autoFocus
              rows={3}
              value={tempVal}
              placeholder={placeholder}
              onChange={(e) => {
                setTempVal(e.target.value);
                onChange(e.target.value);
              }}
              onBlur={() => {
                setIsEditing(false);
                if (!tempVal.trim() && defaultValue) {
                  onChange(defaultValue);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setTempVal(displayVal);
                  setIsEditing(false);
                }
              }}
              className="w-full bg-white border border-blue-500 rounded p-1.5 text-xs outline-none text-slate-900 shadow-inner leading-relaxed"
            />
            <div className="flex justify-end gap-1 text-[10px] print:hidden">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsEditing(false)}
                className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              setTempVal(displayVal);
              setIsEditing(true);
            }}
            className="cursor-pointer text-justify leading-relaxed"
            title="Click to edit text directly on sheet"
          >
            {renderDisplay ? renderDisplay(displayVal) : displayVal}
          </div>
        )}

        {onReset && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              onReset();
              setTempVal(defaultValue);
              setIsEditing(false);
            }}
            className={`sheet-reset-btn print:hidden absolute top-1 right-1 p-1 rounded transition shadow-xs ${
              isModified
                ? 'text-amber-800 bg-amber-100 hover:bg-amber-200 opacity-90'
                : 'opacity-0 group-hover/multi:opacity-100 text-slate-400 hover:text-blue-600 bg-white/90 border border-slate-200'
            }`}
            title="Reset text to default"
          >
            <RotateCcw size={11} />
          </button>
        )}
      </div>
    );
  }

  return (
    <span
      className={`relative inline-flex items-center group/inline px-0.5 py-0.2 rounded hover:bg-blue-50/60 print:hover:bg-transparent transition ${className}`}
    >
      {isEditing ? (
        <input
          type="text"
          autoFocus
          value={tempVal}
          placeholder={placeholder}
          onChange={(e) => {
            setTempVal(e.target.value);
            onChange(e.target.value);
          }}
          onBlur={() => {
            setIsEditing(false);
            if (!tempVal.trim() && defaultValue) {
              onChange(defaultValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
            } else if (e.key === 'Escape') {
              setTempVal(displayVal);
              setIsEditing(false);
            }
          }}
          className={`bg-white border border-blue-500 rounded px-1.5 py-0.5 text-inherit outline-none shadow-xs text-slate-900 max-w-full ${
            isBold ? 'font-bold' : ''
          } ${isMono ? 'font-mono' : ''}`}
          style={{ width: `${Math.min(50, Math.max(6, tempVal.length + 2))}ch` }}
        />
      ) : (
        <span
          onClick={() => {
            setTempVal(displayVal);
            setIsEditing(true);
          }}
          className={`cursor-pointer ${isBold ? 'font-bold' : ''} ${isUnderline ? 'underline' : ''} ${
            isMono ? 'font-mono' : ''
          }`}
          title="Click to edit directly on sheet"
        >
          {renderDisplay ? renderDisplay(displayVal) : displayVal}
        </span>
      )}

      {onReset && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onReset();
            setTempVal(defaultValue);
            setIsEditing(false);
          }}
          className={`inline-reset-btn print:hidden p-0.5 rounded transition ml-1 shrink-0 ${
            isModified
              ? 'text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 opacity-90'
              : 'opacity-0 group-hover/inline:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-100/80'
          }`}
          title={`Reset to "${defaultValue}"`}
        >
          <RotateCcw size={10} />
        </button>
      )}
    </span>
  );
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

function formatDocDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatOrdinalDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = parseFlexibleDate(dateInput);
  if (!d) return String(dateInput);
  const day = d.getDate();
  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${day}${getOrdinalSuffix(day)} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDepartment(dept: string): string {
  const trimmed = (dept || '').trim();
  if (trimmed.toLowerCase().endsWith('department')) {
    return trimmed.slice(0, -10).trim();
  }
  return trimmed;
}

function formatWordsOnly(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Taka Only.';
  const words = numberToWords(Math.round(num));
  return `${words} Taka Only.`;
}

function renderOrdinalDateText(text: string): React.ReactNode {
  if (!text) return '';
  const match = text.match(/^(\d+)(st|nd|rd|th)(\s+.+)$/i);
  if (match) {
    return (
      <>
        {match[1]}
        <sup className="text-[10px] leading-none">{match[2].toLowerCase()}</sup>
        {match[3]}
      </>
    );
  }
  return text;
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

  // Official Letterhead Pad & Print Clearance Settings
  const [padTopMargin, setPadTopMargin] = useState<number>(38); // mm: clearance for pre-printed letterhead pad header
  const [padBottomMargin, setPadBottomMargin] = useState<number>(28); // mm: clearance for pre-printed letterhead pad footer
  const [padLeftMargin, setPadLeftMargin] = useState<number>(20); // mm
  const [padRightMargin, setPadRightMargin] = useState<number>(20); // mm
  const [logoDisplay, setLogoDisplay] = useState<'blank_space' | 'collapsed' | 'digital_logo'>('blank_space');
  const [headerMode, setHeaderMode] = useState<'company_info' | 'blank_header'>('blank_header');

  // Convert mm to pixels for screen canvas render (1mm ~= 3.7795px at 96 DPI)
  const topPaddingPx = Math.round(padTopMargin * 3.7795);
  const bottomPaddingPx = Math.round(padBottomMargin * 3.7795);
  const leftPaddingPx = Math.round(padLeftMargin * 3.7795);
  const rightPaddingPx = Math.round(padRightMargin * 3.7795);

  const currentYear = new Date().getFullYear();
  const todayFormatted = formatDocDate(new Date());

  const initialDefaultsRef = useRef<StatementData>({
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
    signatoryName: 'Md Touhiduzzaman',
    signatoryTitle: 'Assistant Manager',
    signatoryDepartment: 'HR & Admin',
    signatoryOrg: 'MEP Group.',
  });

  const [formData, setFormData] = useState<StatementData>(structuredClone(initialDefaultsRef.current));

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

    const gross = Number(worker.grossSalary) || 44000;
    const basic = Number(worker.basicSalary) || (gross > 0 ? Math.round(gross * 0.5) : 22000);
    const houseRent = Number(worker.houseRent) || (gross > 0 ? Math.round(gross * 0.3) : 13200);
    const medical = Number(worker.medicalAllowance) || (gross > 0 ? Math.round(gross * 0.1) : 4400);
    const conveyance = Number(worker.conveyanceAllowance) || (gross > 0 ? Math.max(0, gross - (basic + houseRent + medical)) : 4400);
    const totalStructure = basic + houseRent + medical + conveyance || gross;
    const words = formatWordsOnly(totalStructure);

    const isFemale = String(worker.gender || '').toUpperCase() === 'FEMALE';
    const salutation = isFemale ? 'Ms.' : 'Mr.';
    const pronoun: 'He' | 'She' = isFemale ? 'She' : 'He';

    const joinDateFormatted = worker.joinDate ? formatOrdinalDate(worker.joinDate) : '14th June 2009';
    const compName = worker.company?.name || 'Mohammadi Electric Wires and Multi Products (MEP) Limited';
    const deptName = worker.department?.name || 'HR & Admin';
    const bankName = worker.bankName || 'Prime Bank';
    const accountNo = worker.bankAccountNo || '2111212026612';
    const pfDeduct = Number(worker.pfContribution || worker.pfAmount) || 417;
    const netPayable = Math.max(0, totalStructure - pfDeduct);
    const payableWords = formatWordsOnly(netPayable);

    const newWorkerData: StatementData = {
      ...formData,
      workerId: worker.workerId || formData.workerId,
      name: worker.name || formData.name,
      salutation,
      genderPronoun: pronoun,
      designation: worker.designation || formData.designation,
      department: deptName,
      companyName: compName,
      joiningDate: joinDateFormatted,
      bankName,
      bankAccountNo: accountNo,
      p2Item2Label: 'Total deduction amount (PF purpose Tk.',
      pfDeductionPage2: pfDeduct,
      structureBasicLabel: 'Basic',
      structureBasic: basic,
      structureHouseRentLabel: 'House Rent',
      structureHouseRent: houseRent,
      structureMedicalLabel: 'Medical Allowance',
      structureMedical: medical,
      structureConveyanceLabel: 'Conveyance',
      structureConveyance: conveyance,
      structureTotalLabel: 'Total Salary',
      structureTotal: totalStructure,
      amountInWords: words,
      monthlyPayableAmount: netPayable,
      monthlyPayableInWords: payableWords,
      months: [
        {
          monthName: formData.months[0].monthName,
          grossLabel: 'Gross Salary',
          grossSalary: totalStructure,
          basicLabel: 'Basic',
          basicSalary: basic,
          houseRentLabel: 'House Rent',
          houseRent: houseRent,
          medicalLabel: 'Medical',
          medical: medical,
          conveyanceLabel: 'Conveyance',
          conveyance: conveyance,
          pfLabel: '(Less) PF',
          pfDeduction: pfDeduct,
          overtimeLabel: 'Over Time',
          overtime: 0,
          incomeTaxLabel: 'Income Tax',
          incomeTax: 0,
          netPayableLabel: 'Net Payable=',
          netPayable: Math.max(0, totalStructure - pfDeduct),
        },
        {
          monthName: formData.months[1].monthName,
          grossLabel: 'Gross Salary',
          grossSalary: totalStructure,
          basicLabel: 'Basic',
          basicSalary: basic,
          houseRentLabel: 'House Rent',
          houseRent: houseRent,
          medicalLabel: 'Medical',
          medical: medical,
          conveyanceLabel: 'Conveyance',
          conveyance: conveyance,
          pfLabel: '(Less) PF',
          pfDeduction: pfDeduct,
          overtimeLabel: 'Over Time',
          overtime: 0,
          incomeTaxLabel: 'Income Tax',
          incomeTax: 0,
          netPayableLabel: 'Net Payable=',
          netPayable: Math.max(0, totalStructure - pfDeduct),
        },
        {
          monthName: formData.months[2].monthName,
          grossLabel: 'Gross Salary',
          grossSalary: totalStructure,
          basicLabel: 'Basic',
          basicSalary: basic,
          houseRentLabel: 'House Rent',
          houseRent: houseRent,
          medicalLabel: 'Medical',
          medical: medical,
          conveyanceLabel: 'Conveyance',
          conveyance: conveyance,
          pfLabel: '(Less) PF',
          pfDeduction: pfDeduct,
          overtimeLabel: 'Over Time',
          overtime: 0,
          incomeTaxLabel: 'Income Tax',
          incomeTax: 0,
          netPayableLabel: 'Net Payable=',
          netPayable: Math.max(0, totalStructure - pfDeduct),
        },
      ],
    };

    initialDefaultsRef.current = structuredClone(newWorkerData);
    setFormData(newWorkerData);
  };

  const handleClearSelectedWorker = () => {
    setSelectedWorker(null);
    const standardDefault: StatementData = {
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
      signatoryName: 'Md Touhiduzzaman',
      signatoryTitle: 'Assistant Manager',
      signatoryDepartment: 'HR & Admin',
      signatoryOrg: 'MEP Group.',
    };
    initialDefaultsRef.current = structuredClone(standardDefault);
    setFormData(standardDefault);
  };

  // Recalculate Month row values
  const handleMonthChange = (
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
        currentMonth.netPayable = calculateMonthNetPayable(currentMonth);
      }

      updatedMonths[index] = currentMonth;
      return { ...prev, months: updatedMonths };
    });
  };

  // Toggle custom row type between addition and deduction
  const handleToggleRowType = (
    monthIdx: 0 | 1 | 2,
    typeField: 'pfType' | 'overtimeType' | 'incomeTaxType',
    defaultType: 'deduction' | 'addition'
  ) => {
    setFormData((prev) => {
      const updatedMonths = [...prev.months] as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
      const currentMonth = { ...updatedMonths[monthIdx] };
      const currentType = currentMonth[typeField] || defaultType;
      const nextType = currentType === 'deduction' ? 'addition' : 'deduction';
      currentMonth[typeField] = nextType;
      currentMonth.netPayable = calculateMonthNetPayable(currentMonth);
      updatedMonths[monthIdx] = currentMonth;
      return { ...prev, months: updatedMonths };
    });
  };

  // Reset Net Payable to calculated value
  const handleResetNetPayable = (monthIdx: 0 | 1 | 2) => {
    setFormData((prev) => {
      const updatedMonths = [...prev.months] as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
      const currentMonth = { ...updatedMonths[monthIdx] };
      currentMonth.netPayable = calculateMonthNetPayable(currentMonth);
      currentMonth.netPayableLabel = 'Net Payable=';
      updatedMonths[monthIdx] = currentMonth;
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
  };

  const handlePage2PfChange = (val: number) => {
    setFormData((prev) => {
      const net = Math.max(0, Number(prev.structureTotal || 0) - val);
      return {
        ...prev,
        pfDeductionPage2: val,
        monthlyPayableAmount: net,
        monthlyPayableInWords: formatWordsOnly(net),
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

  // Reset all 3 custom row labels ((Less) PF, Over Time, Income Tax)
  const handleResetAllCustomLabels = () => {
    setFormData((prev) => ({
      ...prev,
      months: prev.months.map((m) => ({
        ...m,
        pfLabel: '(Less) PF',
        pfType: 'deduction',
        overtimeLabel: 'Over Time',
        overtimeType: 'addition',
        incomeTaxLabel: 'Income Tax',
        incomeTaxType: 'deduction',
        netPayable: calculateMonthNetPayable({
          ...m,
          pfLabel: '(Less) PF',
          pfType: 'deduction',
          overtimeLabel: 'Over Time',
          overtimeType: 'addition',
          incomeTaxLabel: 'Income Tax',
          incomeTaxType: 'deduction',
        }),
      })) as [MonthBreakdown, MonthBreakdown, MonthBreakdown],
    }));
  };

  // Sync custom labels from Month 1 to Months 2 and 3
  const handleSyncCustomLabels = (fromIndex: 0 | 1 | 2 = 0) => {
    setFormData((prev) => {
      const src = prev.months[fromIndex];
      const pfLabel = src.pfLabel || '(Less) PF';
      const pfType = src.pfType || 'deduction';
      const overtimeLabel = src.overtimeLabel || 'Over Time';
      const overtimeType = src.overtimeType || 'addition';
      const incomeTaxLabel = src.incomeTaxLabel || 'Income Tax';
      const incomeTaxType = src.incomeTaxType || 'deduction';
      return {
        ...prev,
        months: prev.months.map((m) => {
          const updated = {
            ...m,
            pfLabel,
            pfType,
            overtimeLabel,
            overtimeType,
            incomeTaxLabel,
            incomeTaxType,
          };
          updated.netPayable = calculateMonthNetPayable(updated);
          return updated;
        }) as [MonthBreakdown, MonthBreakdown, MonthBreakdown],
      };
    });
  };

  // Reset a specific row label in a specific month
  const handleResetRowLabel = (
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
    handleMonthChange(monthIdx, field as any, defaults[field] || '');
  };

  // Reset a specific amount for a month
  const handleResetMonthAmount = (monthIdx: 0 | 1 | 2, field: keyof MonthBreakdown) => {
    const initial = initialDefaultsRef.current?.months[monthIdx][field];
    if (initial !== undefined) {
      handleMonthChange(monthIdx, field, initial);
    }
  };

  // Reset an entire single month (labels and amounts)
  const handleResetMonth = (monthIdx: 0 | 1 | 2) => {
    const initial = initialDefaultsRef.current?.months[monthIdx];
    if (initial) {
      setFormData((prev) => {
        const next = [...prev.months] as [MonthBreakdown, MonthBreakdown, MonthBreakdown];
        next[monthIdx] = { ...initial };
        return { ...prev, months: next };
      });
    }
  };

  // Reset all 3 months table
  const handleResetAllTable = () => {
    if (initialDefaultsRef.current) {
      setFormData((prev) => ({
        ...prev,
        months: structuredClone(initialDefaultsRef.current.months),
      }));
    }
  };

  // Reset a single field on StatementData
  const handleResetField = (field: keyof StatementData) => {
    if (initialDefaultsRef.current) {
      setFormData((prev) => ({
        ...prev,
        [field]: initialDefaultsRef.current[field],
      }));
    }
  };

  // Reset all employee particulars
  const handleResetEmployeeParticulars = () => {
    if (initialDefaultsRef.current) {
      const init = initialDefaultsRef.current;
      setFormData((prev) => ({
        ...prev,
        name: init.name,
        workerId: init.workerId,
        salutation: init.salutation,
        genderPronoun: init.genderPronoun,
        designation: init.designation,
        department: init.department,
        companyName: init.companyName,
        companyAddress: init.companyAddress,
        joiningDate: init.joiningDate,
        p1IntroText: undefined,
        p1CustomParagraph: undefined,
        p1CustomClosing: undefined,
        p2CustomParagraph: undefined,
      }));
    }
  };

  // Reset Page 2 structure
  const handleResetSalaryStructure = () => {
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
  };

  // Reset individual Page 2 structure row
  const handleResetStructureRow = (
    labelField: 'structureBasicLabel' | 'structureHouseRentLabel' | 'structureMedicalLabel' | 'structureConveyanceLabel' | 'structureTotalLabel',
    defaultLabel: string,
    amountField?: 'structureBasic' | 'structureHouseRent' | 'structureMedical' | 'structureConveyance' | 'structureTotal'
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
  };

  // Reset Bank Details
  const handleResetBankDetails = () => {
    if (initialDefaultsRef.current) {
      const init = initialDefaultsRef.current;
      setFormData((prev) => ({
        ...prev,
        bankName: init.bankName,
        bankAccountNo: init.bankAccountNo,
        p2Item2Label: init.p2Item2Label || 'Total deduction amount (PF purpose Tk.',
      }));
    }
  };

  // Reset Signatory Details
  const handleResetSignatory = () => {
    if (initialDefaultsRef.current) {
      const init = initialDefaultsRef.current;
      setFormData((prev) => ({
        ...prev,
        signatoryName: init.signatoryName,
        signatoryTitle: init.signatoryTitle,
        signatoryDepartment: init.signatoryDepartment,
        signatoryOrg: init.signatoryOrg,
      }));
    }
  };

  // Reset entire document to initial defaults
  const handleResetEntireDocument = () => {
    if (initialDefaultsRef.current) {
      setFormData(structuredClone(initialDefaultsRef.current));
    }
  };

  // Helper for possessive pronoun
  const getPossessivePronoun = (pronoun: 'He' | 'She' | 'He/She'): string => {
    if (pronoun === 'He') return 'his';
    if (pronoun === 'She') return 'her';
    return 'his/her';
  };

  // Download 2-Page PDF
  const handleDownloadPdf = async () => {
    if (!page1Ref.current || !page2Ref.current) return;
    setIsGeneratingPdf(true);

    // Reset horizontal scroll on page wrappers
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
      });

      const cloneSetup = (clonedDoc: Document) => {
        // Hide non-printable elements in cloned doc
        const nonPrintables = clonedDoc.querySelectorAll(
          '.print\\:hidden, header, nav, aside, footer, .on-sheet-toolbar, .inline-reset-btn, .sheet-reset-btn'
        );
        nonPrintables.forEach((el: any) => {
          el.style.display = 'none';
        });

        // Remove any custom row highlight backgrounds or borders in cloned doc
        const highlights = clonedDoc.querySelectorAll('.custom-row-highlight');
        highlights.forEach((el: any) => {
          el.style.backgroundColor = 'transparent';
          el.style.border = 'none';
          el.style.borderLeft = 'none';
          el.style.paddingLeft = '0';
        });

        // Convert any active inputs / textareas in doc pages to plain spans
        const formInputs = clonedDoc.querySelectorAll('.salary-doc-page input, .salary-doc-page textarea');
        formInputs.forEach((input: any) => {
          const span = clonedDoc.createElement('span');
          span.textContent = input.value;
          span.style.fontFamily = "'Times New Roman', Times, Georgia, serif";
          span.style.fontSize = window.getComputedStyle(input).fontSize || '13px';
          span.style.fontWeight = window.getComputedStyle(input).fontWeight || 'normal';
          span.style.textAlign = window.getComputedStyle(input).textAlign || 'left';
          span.style.color = '#000000';
          span.style.border = 'none';
          span.style.background = 'transparent';
          span.style.lineHeight = '1.35';
          if (input.tagName.toLowerCase() === 'textarea' || input.classList.contains('w-full')) {
            span.style.display = 'block';
            span.style.width = '100%';
            span.style.whiteSpace = 'pre-wrap';
          } else if (input.closest('td')) {
            span.style.display = 'inline-block';
            span.style.width = '100%';
          } else {
            span.style.display = 'inline';
            span.style.width = 'auto';
          }
          input.parentNode?.replaceChild(span, input);
        });

        const grid = clonedDoc.querySelector('.salary-statement-grid');
        if (grid) {
          (grid as HTMLElement).style.display = 'block';
          (grid as HTMLElement).style.margin = '0';
          (grid as HTMLElement).style.padding = '0';
        }

        const container = clonedDoc.getElementById('printable-pages-container');
        if (container) {
          container.style.position = 'static';
          container.style.left = '0';
          container.style.opacity = '1';
          container.style.display = 'block';
          container.style.width = '794px';
          container.style.margin = '0';
          container.style.padding = '0';
        }

        const pageWrappers = clonedDoc.querySelectorAll('.salary-page-wrapper, .salary-doc-page-wrapper');
        pageWrappers.forEach((w: any) => {
          w.style.margin = '0';
          w.style.padding = '0';
          w.style.width = '794px';
          w.style.maxWidth = '794px';
          w.style.overflow = 'visible';
          w.scrollLeft = 0;
        });

        const p1 = clonedDoc.getElementById('salary-statement-page-1');
        if (p1) {
          p1.style.margin = '0';
        }
        const p2 = clonedDoc.getElementById('salary-statement-page-2');
        if (p2) {
          p2.style.margin = '0';
        }

        // Enforce clean table cell styling in html2canvas clone
        const cells = clonedDoc.querySelectorAll('.salary-doc-page table th, .salary-doc-page table td');
        cells.forEach((cell: any) => {
          cell.style.verticalAlign = 'middle';
          cell.style.lineHeight = '1.35';
          cell.style.paddingTop = '6px';
          cell.style.paddingBottom = '6px';
          cell.style.boxSizing = 'border-box';
          cell.style.color = '#000000';
          cell.style.backgroundColor = 'transparent';
          cell.style.border = '1px solid #000000';
          cell.style.overflow = 'visible';
          cell.style.whiteSpace = 'normal';
        });

        const allDocElements = clonedDoc.querySelectorAll('.salary-doc-page, .salary-doc-page *');
        allDocElements.forEach((el: any) => {
          el.style.textRendering = 'optimizeLegibility';
          el.style.webkitFontSmoothing = 'antialiased';
          el.style.mozOsxFontSmoothing = 'grayscale';
          if (el.tagName?.toLowerCase() === 'span' || el.classList?.contains('group/cell') || el.classList?.contains('group/amount') || el.classList?.contains('group/inline-amt')) {
            el.style.overflow = 'visible';
          }
        });

        // Hide any signature spacers in cloned doc to avoid unexpected flex spacing artifacts
        const spacers = clonedDoc.querySelectorAll('.salary-signature-spacer');
        spacers.forEach((s: any) => {
          (s as HTMLElement).style.display = 'none';
        });

        // Accurately position signature blocks at the lower portion in cloned doc for html2canvas
        if (p1) {
          const clonedSig1 = p1.querySelector('.salary-signature-block') as HTMLElement;
          if (clonedSig1) {
            p1.style.position = 'relative';
            clonedSig1.style.position = 'absolute';
            clonedSig1.style.bottom = `${bottomPaddingPx}px`;
            clonedSig1.style.left = `${leftPaddingPx}px`;
            clonedSig1.style.width = `calc(100% - ${leftPaddingPx + rightPaddingPx}px)`;
          }
        }
        if (p2) {
          const clonedSig2 = p2.querySelector('.salary-signature-block') as HTMLElement;
          if (clonedSig2) {
            p2.style.position = 'relative';
            clonedSig2.style.position = 'absolute';
            clonedSig2.style.bottom = `${bottomPaddingPx}px`;
            clonedSig2.style.left = `${leftPaddingPx}px`;
            clonedSig2.style.width = `calc(100% - ${leftPaddingPx + rightPaddingPx}px)`;
          }
        }
      };

      // Render Page 1 with scale: 3 and crisp lossless PNG
      const canvas1 = await html2canvas(page1Ref.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        onclone: cloneSetup,
      });
      const img1 = canvas1.toDataURL('image/png');
      pdf.addImage(img1, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

      // Render Page 2 with scale: 3 and crisp lossless PNG
      pdf.addPage('a4', 'portrait');
      const canvas2 = await html2canvas(page2Ref.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        onclone: cloneSetup,
      });
      const img2 = canvas2.toDataURL('image/png');
      pdf.addImage(img2, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

      const sanitizedName = formData.name.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Salary_Statement_${formData.workerId}_${sanitizedName}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not generate PDF download directly. You can use the Print / Save as PDF button.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Automatically reset horizontal scroll on preview wrappers before any print event (including Ctrl+P)
  useEffect(() => {
    const handleBeforePrint = () => {
      if (page1Ref.current?.parentElement) {
        page1Ref.current.parentElement.scrollLeft = 0;
      }
      if (page2Ref.current?.parentElement) {
        page2Ref.current.parentElement.scrollLeft = 0;
      }
      document.querySelectorAll('.salary-doc-page-wrapper').forEach((el) => {
        (el as HTMLElement).scrollLeft = 0;
      });
      window.scrollTo(0, window.scrollY);
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  const handlePrint = () => {
    // Reset horizontal scroll on page wrappers before opening print dialog
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
  };

  return (
    <div className="salary-statement-root min-h-screen bg-transparent print:bg-white text-slate-900 pb-16 print:p-0 print:m-0 print:min-h-0 print:pb-0">
      {/* Print CSS styles and document table typography */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Screen document table styling */
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
          padding-left: 8px !important;
          padding-right: 8px !important;
          box-sizing: border-box !important;
          overflow: visible !important;
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
            overflow: visible !important;
            font-family: 'Times New Roman', Times, Georgia, serif !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: optimizeLegibility !important;
          }
          .print\\:hidden, header, nav, aside, footer, .on-sheet-toolbar, .inline-reset-btn, .sheet-reset-btn {
            display: none !important;
          }
          /* Reset all app layout wrappers and flex containers for print to eliminate margin clipping */
          .ambient-mesh,
          .ambient-mesh > div,
          main,
          main > div {
            display: block !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            float: none !important;
            transform: none !important;
          }
          .salary-statement-root {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            background: #ffffff !important;
            width: 210mm !important;
          }
          .salary-statement-container {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
          }
          .salary-statement-grid {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
            width: 210mm !important;
          }
          #printable-pages-container {
            display: block !important;
            position: static !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            left: 0 !important;
            top: 0 !important;
            opacity: 1 !important;
          }
          #printable-pages-container > * + * {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          .salary-page-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .salary-page-1-wrapper {
            page-break-after: always !important;
            break-after: page !important;
          }
          .salary-page-2-wrapper {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .salary-doc-page-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            width: 210mm !important;
          }
          .salary-doc-page {
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            height: 296mm !important;
            min-height: 296mm !important;
            max-height: 296.5mm !important;
            margin: 0 !important;
            padding-top: ${padTopMargin}mm !important;
            padding-bottom: ${padBottomMargin}mm !important;
            padding-left: ${padLeftMargin}mm !important;
            padding-right: ${padRightMargin}mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            position: relative !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Times New Roman', Times, Georgia, serif !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: optimizeLegibility !important;
          }
          .salary-doc-page * {
            color: #000000 !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            text-rendering: optimizeLegibility !important;
          }
          .salary-doc-page table {
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            width: 100% !important;
            border: 1px solid #000000 !important;
          }
          .salary-doc-page table th,
          .salary-doc-page table td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            vertical-align: middle !important;
            line-height: 1.35 !important;
            padding-top: 6px !important;
            padding-bottom: 6px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            white-space: normal !important;
          }
          .salary-doc-page-2 table td {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
          .salary-doc-page table td span,
          .salary-doc-page table td div,
          .salary-doc-page table th span,
          .salary-doc-page table th div {
            overflow: visible !important;
            white-space: normal !important;
            color: #000000 !important;
          }
          .salary-signature-spacer {
            flex: 1 1 0% !important;
          }
          .salary-signature-block {
            margin-top: auto !important;
          }
          .salary-doc-page-1 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .salary-doc-page-2 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `,
        }}
      />

      {/* Top Navbar & Action Bar */}
      <div className="glass-header sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/payroll"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition border border-transparent hover:border-blue-100"
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
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Salary Statement Generator</h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
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

            {/* Letterhead Pad Mode Status Badge */}
            <div className="hidden xl:flex items-center gap-2 bg-amber-50/90 text-amber-800 border border-amber-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>
                Office Pad: <strong className="font-bold">{padTopMargin}mm Top</strong> / <strong className="font-bold">{padBottomMargin}mm Btm</strong> / <strong className="font-bold">{padLeftMargin}mm L</strong> / <strong className="font-bold">{padRightMargin}mm R</strong> ({headerMode === 'blank_header' ? 'Pre-printed Header' : 'Company Info Header'})
              </span>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition hover:border-slate-300"
            >
              <Printer size={15} /> Print / Save PDF
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Compiling 2-Page PDF...
                </>
              ) : (
                <>
                  <Download size={15} /> Download 2-Page PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="salary-statement-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 print:p-0 print:m-0 print:max-w-none print:w-full">
        {/* Worker Quick Search Bar */}
        <div className="glass-card p-4 rounded-3xl shadow-sm border border-white/70 mb-6 print:hidden relative">
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
          className={`salary-statement-grid grid gap-8 print:block print:m-0 print:p-0 print:gap-0 ${
            viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* Left Column: Form Editor (Visible in 'split' or 'form') */}
          {(viewMode === 'split' || viewMode === 'form') && (
            <div className={viewMode === 'split' ? 'lg:col-span-5 space-y-6 print:hidden' : 'max-w-4xl mx-auto space-y-6 print:hidden w-full'}>
              {/* Form Navigation Tabs */}
              <div className="glass-panel rounded-2xl p-1.5 border border-white/70 shadow-xs flex items-center gap-1 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('p1')}
                  className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'p1' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <FileText size={14} /> Page 1: 3-Month Breakdown
                </button>
                <button
                  onClick={() => setActiveTab('p2')}
                  className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'p2' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <CreditCard size={14} /> Page 2: Salary Certificate
                </button>
                <button
                  onClick={() => setActiveTab('signatory')}
                  className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'signatory' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/60'
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
                            onClick={() => handleResetField('refNo')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Reference Number"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.refNo}
                          onChange={(e) => setFormData({ ...formData, refNo: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Date</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('date')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Date"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600">Certificate Purpose (Page 1 Closing)</label>
                        <button
                          type="button"
                          onClick={() => handleResetField('purpose')}
                          className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                          title="Reset Purpose"
                        >
                          <RotateCcw size={10} /> Reset
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        placeholder="e.g. personal loan from Bank"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Official Letterhead Pad & Clearance Setup */}
                  <div className="glass-card rounded-3xl p-5 border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Sliders size={16} className="text-amber-600" /> Letterhead Pad & Print Clearance
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                        Official Pad Preset
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Configure blank top and bottom clearance for printing on pre-printed office letterhead pads.
                    </p>

                    {/* Quick Presets Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-amber-200/50 pb-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPadTopMargin(38);
                          setPadBottomMargin(28);
                          setLogoDisplay('blank_space');
                          setHeaderMode('blank_header');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border ${
                          padTopMargin === 38 && padBottomMargin === 28 && headerMode === 'blank_header'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Official Pad (Blank Top Header)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPadTopMargin(38);
                          setPadBottomMargin(28);
                          setLogoDisplay('blank_space');
                          setHeaderMode('company_info');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border ${
                          padTopMargin === 38 && padBottomMargin === 28 && logoDisplay === 'blank_space' && headerMode === 'company_info'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Pad with Blank Logo Space
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPadTopMargin(16);
                          setPadBottomMargin(16);
                          setLogoDisplay('digital_logo');
                          setHeaderMode('company_info');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border ${
                          padTopMargin === 16 && padBottomMargin === 16 && logoDisplay === 'digital_logo' && headerMode === 'company_info'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Plain Paper Mode
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Header Text Option
                        </label>
                        <select
                          value={headerMode}
                          onChange={(e) => setHeaderMode(e.target.value as any)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="blank_header">Blank Top Header (For Pre-printed Letterhead Pad)</option>
                          <option value="company_info">Show Company Name & Address (For Plain Paper)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Logo / Image Spot
                        </label>
                        <select
                          value={logoDisplay}
                          onChange={(e) => setLogoDisplay(e.target.value as any)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="blank_space">Blank Space (Reserved for Pad Logo)</option>
                          <option value="collapsed">No Logo (Align Left)</option>
                          <option value="digital_logo">Show Digital Logo</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-700">Top Blank Space</label>
                          <span className="text-xs font-bold text-blue-600">{padTopMargin} mm</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={10}
                            max={70}
                            value={padTopMargin}
                            onChange={(e) => setPadTopMargin(Math.max(10, Math.min(70, Number(e.target.value) || 0)))}
                            className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center"
                          />
                          <div className="flex items-center gap-1 flex-1">
                            {[30, 38, 45].map((mm) => (
                              <button
                                key={mm}
                                type="button"
                                onClick={() => setPadTopMargin(mm)}
                                className={`flex-1 py-1 rounded text-[11px] font-bold transition border ${
                                  padTopMargin === mm
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {mm}mm
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-700">Bottom Blank Space</label>
                          <span className="text-xs font-bold text-blue-600">{padBottomMargin} mm</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={10}
                            max={60}
                            value={padBottomMargin}
                            onChange={(e) => setPadBottomMargin(Math.max(10, Math.min(60, Number(e.target.value) || 0)))}
                            className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center"
                          />
                          <div className="flex items-center gap-1 flex-1">
                            {[20, 28, 35].map((mm) => (
                              <button
                                key={mm}
                                type="button"
                                onClick={() => setPadBottomMargin(mm)}
                                className={`flex-1 py-1 rounded text-[11px] font-bold transition border ${
                                  padBottomMargin === mm
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {mm}mm
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employee Details */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <User size={16} className="text-blue-600" /> Employee Particulars
                      </h3>
                      <button
                        type="button"
                        onClick={handleResetEmployeeParticulars}
                        className="text-xs text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                        title="Reset all employee details to defaults"
                      >
                        <RotateCcw size={12} /> Reset All Details
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Salutation</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('salutation')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Salutation"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <select
                          value={formData.salutation}
                          onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                          <option value="Mr.">Mr.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Mr./Ms.">Mr./Ms.</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Pronoun</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('genderPronoun')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Pronoun"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <select
                          value={formData.genderPronoun}
                          onChange={(e) => setFormData({ ...formData, genderPronoun: e.target.value as any })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                          <option value="He">He (his)</option>
                          <option value="She">She (her)</option>
                          <option value="He/She">He/She (his/her)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Full Name</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('name')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Name"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-semibold"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Staff / Worker ID</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('workerId')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Staff ID"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.workerId}
                          onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Designation</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('designation')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Designation"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Department</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('department')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Department"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Joining Date</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('joiningDate')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Joining Date"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.joiningDate}
                          onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                          placeholder="e.g. 14th June 2009"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Parent Group Reference</label>
                        <input
                          type="text"
                          disabled
                          value="MEP GROUP (Permanent employee)"
                          className="w-full px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-600 rounded-lg text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Company / Sister Concern Name</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('companyName')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Company Name"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-600">Company Address (Plain Paper Mode)</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('companyAddress')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Company Address"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.companyAddress}
                          onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Past 3 Months Salary Table */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <DollarSign size={16} className="text-emerald-600" /> Past 3 Months Breakdown Table
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleSyncCustomLabels(0)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                          title="Copy Month 1 custom row labels to Month 2 & Month 3"
                        >
                          <Sparkles size={12} /> Sync Labels (M1 &rarr; M2/M3)
                        </button>
                        <button
                          type="button"
                          onClick={handleResetAllCustomLabels}
                          className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 hover:underline"
                          title="Reset (Less) PF, Over Time, Income Tax labels to default"
                        >
                          <RotateCcw size={12} /> Reset Labels
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncMonthsFromFirst}
                          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                          title="Copy Month 1 numbers to Month 2 & 3"
                        >
                          <Sparkles size={12} /> Copy M1 Amounts
                        </button>
                        <button
                          type="button"
                          onClick={handleResetAllTable}
                          className="text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-1 hover:underline"
                          title="Reset entire 3-month table to default values"
                        >
                          <RotateCcw size={12} /> Reset Table
                        </button>
                      </div>
                    </div>

                    {/* 3 Month Columns */}
                    {formData.months.map((m, idx) => {
                      const mIdx = idx as 0 | 1 | 2;
                      return (
                        <div key={idx} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
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
                              <button
                                type="button"
                                onClick={() => handleResetMonthAmount(mIdx, 'monthName')}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                title="Reset month name label"
                              >
                                <RotateCcw size={10} />
                              </button>
                            </div>
                          </div>

                          {/* Red-Marked Particulars Labels Editor */}
                          <div className="bg-rose-50/70 border border-rose-200/80 rounded-lg p-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                Customizable Particulars Labels (Red-Marked in Sheet)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleResetRowLabel(mIdx, 'pfLabel');
                                  handleResetRowLabel(mIdx, 'overtimeLabel');
                                  handleResetRowLabel(mIdx, 'incomeTaxLabel');
                                }}
                                className="text-[10px] text-rose-700 hover:text-rose-900 font-semibold underline flex items-center gap-0.5"
                                title="Reset Month {idx + 1} custom labels"
                              >
                                <RotateCcw size={10} /> Reset Labels
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="flex items-center justify-between mb-0.5">
                                  <label className="text-[11px] font-medium text-rose-900">
                                    Row 6 (Red Box 1)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRowType(mIdx, 'pfType', 'deduction')}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition ${
                                      (m.pfType || 'deduction') === 'addition'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-rose-100 text-rose-800 border-rose-300'
                                    }`}
                                    title="Click to toggle between Deduction (-) and Addition (+)"
                                  >
                                    {(m.pfType || 'deduction') === 'addition' ? '+ Addition' : '- Deduction'}
                                  </button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={m.pfLabel || '(Less) PF'}
                                    onChange={(e) => handleMonthChange(mIdx, 'pfLabel', e.target.value)}
                                    placeholder="(Less) PF"
                                    className="w-full px-2 py-1 border border-rose-300 rounded bg-white font-medium text-xs text-rose-950 focus:ring-1 focus:ring-rose-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleResetRowLabel(mIdx, 'pfLabel')}
                                    className="p-1 text-rose-500 hover:text-rose-800 rounded transition shrink-0"
                                    title="Reset to (Less) PF"
                                  >
                                    <RotateCcw size={10} />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-0.5">
                                  <label className="text-[11px] font-medium text-rose-900">
                                    Row 7 (Red Box 2)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRowType(mIdx, 'overtimeType', 'addition')}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition ${
                                      (m.overtimeType || 'addition') === 'deduction'
                                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    }`}
                                    title="Click to toggle between Addition (+) and Deduction (-)"
                                  >
                                    {(m.overtimeType || 'addition') === 'deduction' ? '- Deduction' : '+ Addition'}
                                  </button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={m.overtimeLabel || 'Over Time'}
                                    onChange={(e) => handleMonthChange(mIdx, 'overtimeLabel', e.target.value)}
                                    placeholder="Over Time"
                                    className="w-full px-2 py-1 border border-rose-300 rounded bg-white font-medium text-xs text-rose-950 focus:ring-1 focus:ring-rose-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleResetRowLabel(mIdx, 'overtimeLabel')}
                                    className="p-1 text-rose-500 hover:text-rose-800 rounded transition shrink-0"
                                    title="Reset to Over Time"
                                  >
                                    <RotateCcw size={10} />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-0.5">
                                  <label className="text-[11px] font-medium text-rose-900">
                                    Row 8 (Red Box 3)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRowType(mIdx, 'incomeTaxType', 'deduction')}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition ${
                                      (m.incomeTaxType || 'deduction') === 'addition'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-rose-100 text-rose-800 border-rose-300'
                                    }`}
                                    title="Click to toggle between Deduction (-) and Addition (+)"
                                  >
                                    {(m.incomeTaxType || 'deduction') === 'addition' ? '+ Addition' : '- Deduction'}
                                  </button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={m.incomeTaxLabel || 'Income Tax'}
                                    onChange={(e) => handleMonthChange(mIdx, 'incomeTaxLabel', e.target.value)}
                                    placeholder="Income Tax"
                                    className="w-full px-2 py-1 border border-rose-300 rounded bg-white font-medium text-xs text-rose-950 focus:ring-1 focus:ring-rose-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleResetRowLabel(mIdx, 'incomeTaxLabel')}
                                    className="p-1 text-rose-500 hover:text-rose-800 rounded transition shrink-0"
                                    title="Reset to Income Tax"
                                  >
                                    <RotateCcw size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Amounts Editor */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-gray-500">Gross Salary</label>
                                <button
                                  type="button"
                                  onClick={() => handleResetMonthAmount(mIdx, 'grossSalary')}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                  title="Reset gross salary"
                                >
                                  <RotateCcw size={9} />
                                </button>
                              </div>
                              <input
                                type="number"
                                value={m.grossSalary}
                                onChange={(e) => handleMonthChange(mIdx, 'grossSalary', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-gray-500">Basic</label>
                                <button
                                  type="button"
                                  onClick={() => handleResetMonthAmount(mIdx, 'basicSalary')}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                  title="Reset basic salary"
                                >
                                  <RotateCcw size={9} />
                                </button>
                              </div>
                              <input
                                type="number"
                                value={m.basicSalary}
                                onChange={(e) => handleMonthChange(mIdx, 'basicSalary', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-gray-500">House Rent</label>
                                <button
                                  type="button"
                                  onClick={() => handleResetMonthAmount(mIdx, 'houseRent')}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                  title="Reset house rent"
                                >
                                  <RotateCcw size={9} />
                                </button>
                              </div>
                              <input
                                type="number"
                                value={m.houseRent}
                                onChange={(e) => handleMonthChange(mIdx, 'houseRent', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-gray-500">Medical</label>
                                <button
                                  type="button"
                                  onClick={() => handleResetMonthAmount(mIdx, 'medical')}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                  title="Reset medical allowance"
                                >
                                  <RotateCcw size={9} />
                                </button>
                              </div>
                              <input
                                type="number"
                                value={m.medical}
                                onChange={(e) => handleMonthChange(mIdx, 'medical', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-gray-500">Conveyance</label>
                                <button
                                  type="button"
                                  onClick={() => handleResetMonthAmount(mIdx, 'conveyance')}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                  title="Reset conveyance allowance"
                                >
                                  <RotateCcw size={9} />
                                </button>
                              </div>
                              <input
                                type="number"
                                value={m.conveyance}
                                onChange={(e) => handleMonthChange(mIdx, 'conveyance', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-gray-500">{m.pfLabel || '(Less) PF'}</label>
                                <button
                                  type="button"
                                  onClick={() => handleResetMonthAmount(mIdx, 'pfDeduction')}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                  title="Reset deduction amount"
                                >
                                  <RotateCcw size={9} />
                                </button>
                              </div>
                              <input
                                type="number"
                                value={m.pfDeduction}
                                onChange={(e) => handleMonthChange(mIdx, 'pfDeduction', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-gray-500">{m.overtimeLabel || 'Over Time'}</label>
                                <button
                                  type="button"
                                  onClick={() => handleResetMonthAmount(mIdx, 'overtime')}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                  title="Reset addition amount"
                                >
                                  <RotateCcw size={9} />
                                </button>
                              </div>
                              <input
                                type="number"
                                value={m.overtime}
                                onChange={(e) => handleMonthChange(mIdx, 'overtime', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-gray-500">{m.incomeTaxLabel || 'Income Tax'}</label>
                                <button
                                  type="button"
                                  onClick={() => handleResetMonthAmount(mIdx, 'incomeTax')}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                                  title="Reset deduction amount"
                                >
                                  <RotateCcw size={9} />
                                </button>
                              </div>
                              <input
                                type="number"
                                value={m.incomeTax}
                                onChange={(e) => handleMonthChange(mIdx, 'incomeTax', Number(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-white font-medium"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-800">Net Payable =</span>
                              <button
                                type="button"
                                onClick={() => handleResetMonth(mIdx)}
                                className="text-[11px] text-slate-400 hover:text-blue-600 font-semibold flex items-center gap-0.5"
                                title="Reset Month {idx + 1} values to default"
                              >
                                <RotateCcw size={10} /> Reset Month {idx + 1}
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleResetNetPayable(mIdx)}
                                className="p-1 text-emerald-600 hover:text-emerald-800 rounded transition shrink-0"
                                title="Recalculate & Reset Net Payable"
                              >
                                <RotateCcw size={11} />
                              </button>
                              <input
                                type="number"
                                value={m.netPayable}
                                onChange={(e) => handleMonthChange(mIdx, 'netPayable', Number(e.target.value))}
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
                            onClick={() => handleResetField('structureBasic')}
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
                            onClick={() => handleResetField('structureHouseRent')}
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
                            onClick={() => handleResetField('structureMedical')}
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
                            onClick={() => handleResetField('structureConveyance')}
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
                        {formData.structureTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600">In Word (Total Salary)</label>
                        <button
                          type="button"
                          onClick={() => handleResetField('amountInWords')}
                          className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                          title="Reset In Word"
                        >
                          <RotateCcw size={10} /> Reset
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.amountInWords}
                        onChange={(e) => setFormData({ ...formData, amountInWords: e.target.value })}
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
                          handleResetField('pfDeductionPage2');
                          handleResetField('monthlyPayableAmount');
                          handleResetField('monthlyPayableInWords');
                          handleResetField('disclaimer');
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
                            onClick={() => handleResetField('bankName')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Bank Name"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="e.g. Prime Bank"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-gray-600">Account Number</label>
                          <button
                            type="button"
                            onClick={() => handleResetField('bankAccountNo')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                            title="Reset Account Number"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          value={formData.bankAccountNo}
                          onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
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
                              handleResetField('p2Item2Label');
                              handleResetField('pfDeductionPage2');
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
                            onChange={(e) => setFormData({ ...formData, p2Item2Label: e.target.value })}
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
                            onClick={() => handleResetField('monthlyPayableAmount')}
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
                            setFormData({
                              ...formData,
                              monthlyPayableAmount: Number(e.target.value),
                              monthlyPayableInWords: formatWordsOnly(Number(e.target.value)),
                            })
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
                          onClick={() => handleResetField('monthlyPayableInWords')}
                          className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                          title="Reset Payable in Words"
                        >
                          <RotateCcw size={10} /> Reset
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.monthlyPayableInWords}
                        onChange={(e) => setFormData({ ...formData, monthlyPayableInWords: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600">Item 3 Disclaimer Statement</label>
                        <button
                          type="button"
                          onClick={() => handleResetField('disclaimer')}
                          className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                          title="Reset Disclaimer"
                        >
                          <RotateCcw size={10} /> Reset
                        </button>
                      </div>
                      <textarea
                        rows={3}
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
                        onClick={() => handleResetField('signatoryName')}
                        className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                        title="Reset Name"
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.signatoryName}
                      onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                      placeholder="e.g. Md Touhiduzzaman"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-600">Signatory Title / Designation</label>
                      <button
                        type="button"
                        onClick={() => handleResetField('signatoryTitle')}
                        className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                        title="Reset Title"
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.signatoryTitle}
                      onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                      placeholder="e.g. Assistant Manager"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-600">Department</label>
                      <button
                        type="button"
                        onClick={() => handleResetField('signatoryDepartment')}
                        className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                        title="Reset Department"
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.signatoryDepartment}
                      onChange={(e) => setFormData({ ...formData, signatoryDepartment: e.target.value })}
                      placeholder="e.g. HR & Admin"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-600">Organization / Group (Page 1 line 4)</label>
                      <button
                        type="button"
                        onClick={() => handleResetField('signatoryOrg')}
                        className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition"
                        title="Reset Organization"
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.signatoryOrg}
                      onChange={(e) => setFormData({ ...formData, signatoryOrg: e.target.value })}
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
            id="printable-pages-container"
            className={
              viewMode === 'form'
                ? 'fixed -left-[99999px] top-0 pointer-events-none print:static print:opacity-100 print:left-auto print:w-full print:m-0 print:p-0 space-y-6 print:space-y-0'
                : viewMode === 'preview'
                ? 'max-w-4xl mx-auto space-y-6 w-full print:m-0 print:p-0 print:max-w-none print:w-full print:space-y-0'
                : 'lg:col-span-7 space-y-6 print:w-full print:m-0 print:p-0 print:space-y-0'
            }
          >
            {/* Official Letterhead Pad Print Settings Control Panel */}
            <div className="print:hidden bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
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
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border ${
                      padTopMargin === 38 && padBottomMargin === 28 && padLeftMargin === 20 && padRightMargin === 20 && headerMode === 'blank_header'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Office pad with pre-printed header (hides digital header completely, generous top clearance)"
                  >
                    Official Pad (Blank Top Header)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPadTopMargin(38);
                      setPadBottomMargin(28);
                      setPadLeftMargin(20);
                      setPadRightMargin(20);
                      setLogoDisplay('blank_space');
                      setHeaderMode('company_info');
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border ${
                      padTopMargin === 38 && padBottomMargin === 28 && padLeftMargin === 20 && padRightMargin === 20 && logoDisplay === 'blank_space' && headerMode === 'company_info'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Office pad with pre-printed logo space only (prints company info, leaves logo spot blank)"
                  >
                    Pad (Blank Logo Spot)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPadTopMargin(16);
                      setPadBottomMargin(16);
                      setPadLeftMargin(20);
                      setPadRightMargin(20);
                      setLogoDisplay('digital_logo');
                      setHeaderMode('company_info');
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border ${
                      padTopMargin === 16 && padBottomMargin === 16 && padLeftMargin === 20 && padRightMargin === 20 && logoDisplay === 'digital_logo' && headerMode === 'company_info'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Switch to plain A4 paper print layout with digital MEP logo"
                  >
                    Plain Paper Mode
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
                {/* Header Text Mode */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Header Text Mode
                  </label>
                  <select
                    value={headerMode}
                    onChange={(e) => setHeaderMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blank_header">Blank Top Header (Pre-printed Pad)</option>
                    <option value="company_info">Show Company Info (Plain Paper)</option>
                  </select>
                </div>

                {/* Logo Display Setting */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Logo / Image Spot
                  </label>
                  <select
                    value={logoDisplay}
                    onChange={(e) => setLogoDisplay(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blank_space">Blank Space (Reserved for Pad Logo)</option>
                    <option value="collapsed">No Logo (Align Left)</option>
                    <option value="digital_logo">Show Digital Logo</option>
                  </select>
                </div>

                {/* Top Margin Clearance */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Top Blank Space
                    </label>
                    <span className="text-[11px] font-bold text-blue-600">{padTopMargin} mm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={70}
                      value={padTopMargin}
                      onChange={(e) => setPadTopMargin(Math.max(10, Math.min(70, Number(e.target.value) || 0)))}
                      className="w-14 px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 text-center"
                    />
                    <div className="flex items-center gap-1 flex-1">
                      {[30, 38, 45].map((mm) => (
                        <button
                          key={mm}
                          type="button"
                          onClick={() => setPadTopMargin(mm)}
                          className={`flex-1 py-1 rounded text-[10px] font-bold transition border ${
                            padTopMargin === mm
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mm}mm
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Margin Clearance */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Bottom Blank Space
                    </label>
                    <span className="text-[11px] font-bold text-blue-600">{padBottomMargin} mm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={60}
                      value={padBottomMargin}
                      onChange={(e) => setPadBottomMargin(Math.max(10, Math.min(60, Number(e.target.value) || 0)))}
                      className="w-14 px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 text-center"
                    />
                    <div className="flex items-center gap-1 flex-1">
                      {[20, 28, 35].map((mm) => (
                        <button
                          key={mm}
                          type="button"
                          onClick={() => setPadBottomMargin(mm)}
                          className={`flex-1 py-1 rounded text-[10px] font-bold transition border ${
                            padBottomMargin === mm
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mm}mm
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Left Margin Clearance */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Left Margin
                    </label>
                    <span className="text-[11px] font-bold text-blue-600">{padLeftMargin} mm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={40}
                      value={padLeftMargin}
                      onChange={(e) => setPadLeftMargin(Math.max(10, Math.min(40, Number(e.target.value) || 0)))}
                      className="w-14 px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 text-center"
                    />
                    <div className="flex items-center gap-1 flex-1">
                      {[15, 20, 25].map((mm) => (
                        <button
                          key={mm}
                          type="button"
                          onClick={() => setPadLeftMargin(mm)}
                          className={`flex-1 py-1 rounded text-[10px] font-bold transition border ${
                            padLeftMargin === mm
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mm}mm
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Margin Clearance */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Right Margin
                    </label>
                    <span className="text-[11px] font-bold text-blue-600">{padRightMargin} mm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={40}
                      value={padRightMargin}
                      onChange={(e) => setPadRightMargin(Math.max(10, Math.min(40, Number(e.target.value) || 0)))}
                      className="w-14 px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-800 text-center"
                    />
                    <div className="flex items-center gap-1 flex-1">
                      {[15, 20, 25].map((mm) => (
                        <button
                          key={mm}
                          type="button"
                          onClick={() => setPadRightMargin(mm)}
                          className={`flex-1 py-1 rounded text-[10px] font-bold transition border ${
                            padRightMargin === mm
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mm}mm
                        </button>
                      ))}
                    </div>
                  </div>
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
                  onClick={handleResetAllCustomLabels}
                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                  title="Reset (Less) PF, Over Time, Income Tax labels across all 3 months"
                >
                  <RotateCcw size={11} /> Reset Red Row Labels
                </button>
                <button
                  type="button"
                  onClick={() => handleSyncCustomLabels(0)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                  title="Sync Month 1 custom row labels to Month 2 & Month 3"
                >
                  <Sparkles size={11} /> Sync Labels (M1 &rarr; M2/M3)
                </button>
                <button
                  type="button"
                  onClick={handleResetAllTable}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                  title="Reset 3-Month Breakdown Table to defaults"
                >
                  <RotateCcw size={11} /> Reset Table
                </button>
                <button
                  type="button"
                  onClick={handleResetEntireDocument}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                  title="Reset all fields, amounts, and labels to defaults"
                >
                  <RotateCcw size={11} /> Reset Entire Document
                </button>
              </div>
            </div>

            {/* PAGE 1 CONTAINER */}
            <div className="salary-page-wrapper salary-page-1-wrapper relative group print:m-0 print:p-0">
              <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-gray-500 print:hidden">
                <span className="uppercase tracking-wider">Page 1 of 2: Past 3 Months Breakdown</span>
                <span className="text-gray-400">Standard A4 Sheet (210mm x 297mm) • Verbatim Official Template</span>
              </div>

              <div className="salary-doc-page-wrapper w-full overflow-x-auto pb-4 print:p-0 print:m-0 print:overflow-visible">
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
                        defaultValue={initialDefaultsRef.current.refNo}
                        onChange={(val) => setFormData((prev) => ({ ...prev, refNo: val }))}
                        onReset={() => handleResetField('refNo')}
                        isMono={true}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Date:</span>
                      <EditableInlineText
                        value={formData.date}
                        defaultValue={todayFormatted}
                        onChange={(val) => setFormData((prev) => ({ ...prev, date: val }))}
                        onReset={() => handleResetField('date')}
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
                      defaultValue={initialDefaultsRef.current.salutation}
                      onChange={(val) => setFormData((prev) => ({ ...prev, salutation: val }))}
                      onReset={() => handleResetField('salutation')}
                    />{' '}
                    <EditableInlineText
                      value={formData.name}
                      defaultValue={initialDefaultsRef.current.name}
                      onChange={(val) => setFormData((prev) => ({ ...prev, name: val }))}
                      onReset={() => handleResetField('name')}
                      isBold={true}
                    />{' '}
                    (Staff ID:{' '}
                    <EditableInlineText
                      value={formData.workerId}
                      defaultValue={initialDefaultsRef.current.workerId}
                      onChange={(val) => setFormData((prev) => ({ ...prev, workerId: val }))}
                      onReset={() => handleResetField('workerId')}
                    />
                    ) has been employed with{' '}
                    <EditableInlineText
                      value={formData.companyName}
                      defaultValue={initialDefaultsRef.current.companyName}
                      onChange={(val) => setFormData((prev) => ({ ...prev, companyName: val }))}
                      onReset={() => handleResetField('companyName')}
                    />
                    , a sister concern of MEP GROUP since{' '}
                    <EditableInlineText
                      value={formData.joiningDate}
                      defaultValue={initialDefaultsRef.current.joiningDate}
                      onChange={(val) => setFormData((prev) => ({ ...prev, joiningDate: val }))}
                      onReset={() => handleResetField('joiningDate')}
                      renderDisplay={(val) => renderOrdinalDateText(val)}
                    />
                    .{' '}
                    <EditableInlineText
                      value={formData.genderPronoun}
                      defaultValue={initialDefaultsRef.current.genderPronoun}
                      onChange={(val) => setFormData((prev) => ({ ...prev, genderPronoun: val as any }))}
                      onReset={() => handleResetField('genderPronoun')}
                    />{' '}
                    is currently working as a{' '}
                    <EditableInlineText
                      value={formData.designation}
                      defaultValue={initialDefaultsRef.current.designation}
                      onChange={(val) => setFormData((prev) => ({ ...prev, designation: val }))}
                      onReset={() => handleResetField('designation')}
                    />{' '}
                    in the{' '}
                    <EditableInlineText
                      value={formData.department}
                      defaultValue={initialDefaultsRef.current.department}
                      onChange={(val) => setFormData((prev) => ({ ...prev, department: val }))}
                      onReset={() => handleResetField('department')}
                    />{' '}
                    Department.{' '}
                    <EditableInlineText
                      value={formData.genderPronoun}
                      defaultValue={initialDefaultsRef.current.genderPronoun}
                      onChange={(val) => setFormData((prev) => ({ ...prev, genderPronoun: val as any }))}
                      onReset={() => handleResetField('genderPronoun')}
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
                            defaultValue={initialDefaultsRef.current.months[0].monthName}
                            onChange={(val) => handleMonthChange(0, 'monthName', val)}
                            onReset={() => handleResetMonthAmount(0, 'monthName')}
                            isBold={true}
                          />
                        </th>
                        <th colSpan={2} className="border border-black py-1.5 px-2.5 text-center font-bold text-[13.5px] w-1/3 align-middle leading-normal">
                          <EditableInlineText
                            value={formData.months[1].monthName}
                            defaultValue={initialDefaultsRef.current.months[1].monthName}
                            onChange={(val) => handleMonthChange(1, 'monthName', val)}
                            onReset={() => handleResetMonthAmount(1, 'monthName')}
                            isBold={true}
                          />
                        </th>
                        <th colSpan={2} className="border border-black py-1.5 px-2.5 text-center font-bold text-[13.5px] w-1/3 align-middle leading-normal">
                          <EditableInlineText
                            value={formData.months[2].monthName}
                            defaultValue={initialDefaultsRef.current.months[2].monthName}
                            onChange={(val) => handleMonthChange(2, 'monthName', val)}
                            onReset={() => handleResetMonthAmount(2, 'monthName')}
                            isBold={true}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Row 1: Gross Salary */}
                      <tr>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal w-[20%]">
                          <EditableLabelCell
                            value={formData.months[0].grossLabel || 'Gross Salary'}
                            defaultValue="Gross Salary"
                            onChange={(val) => handleMonthChange(0, 'grossLabel', val)}
                            onReset={() => handleResetRowLabel(0, 'grossLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right w-[13.33%]">
                          <EditableAmountCell
                            value={formData.months[0].grossSalary}
                            onChange={(val) => handleMonthChange(0, 'grossSalary', val)}
                            onReset={() => handleResetMonthAmount(0, 'grossSalary')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal w-[20%]">
                          <EditableLabelCell
                            value={formData.months[1].grossLabel || 'Gross Salary'}
                            defaultValue="Gross Salary"
                            onChange={(val) => handleMonthChange(1, 'grossLabel', val)}
                            onReset={() => handleResetRowLabel(1, 'grossLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right w-[13.33%]">
                          <EditableAmountCell
                            value={formData.months[1].grossSalary}
                            onChange={(val) => handleMonthChange(1, 'grossSalary', val)}
                            onReset={() => handleResetMonthAmount(1, 'grossSalary')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal w-[20%]">
                          <EditableLabelCell
                            value={formData.months[2].grossLabel || 'Gross Salary'}
                            defaultValue="Gross Salary"
                            onChange={(val) => handleMonthChange(2, 'grossLabel', val)}
                            onReset={() => handleResetRowLabel(2, 'grossLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right w-[13.34%]">
                          <EditableAmountCell
                            value={formData.months[2].grossSalary}
                            onChange={(val) => handleMonthChange(2, 'grossSalary', val)}
                            onReset={() => handleResetMonthAmount(2, 'grossSalary')}
                          />
                        </td>
                      </tr>

                      {/* Row 2: Basic */}
                      <tr>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[0].basicLabel || 'Basic'}
                            defaultValue="Basic"
                            onChange={(val) => handleMonthChange(0, 'basicLabel', val)}
                            onReset={() => handleResetRowLabel(0, 'basicLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[0].basicSalary}
                            onChange={(val) => handleMonthChange(0, 'basicSalary', val)}
                            onReset={() => handleResetMonthAmount(0, 'basicSalary')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[1].basicLabel || 'Basic'}
                            defaultValue="Basic"
                            onChange={(val) => handleMonthChange(1, 'basicLabel', val)}
                            onReset={() => handleResetRowLabel(1, 'basicLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[1].basicSalary}
                            onChange={(val) => handleMonthChange(1, 'basicSalary', val)}
                            onReset={() => handleResetMonthAmount(1, 'basicSalary')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[2].basicLabel || 'Basic'}
                            defaultValue="Basic"
                            onChange={(val) => handleMonthChange(2, 'basicLabel', val)}
                            onReset={() => handleResetRowLabel(2, 'basicLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[2].basicSalary}
                            onChange={(val) => handleMonthChange(2, 'basicSalary', val)}
                            onReset={() => handleResetMonthAmount(2, 'basicSalary')}
                          />
                        </td>
                      </tr>

                      {/* Row 3: House Rent */}
                      <tr>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[0].houseRentLabel || 'House Rent'}
                            defaultValue="House Rent"
                            onChange={(val) => handleMonthChange(0, 'houseRentLabel', val)}
                            onReset={() => handleResetRowLabel(0, 'houseRentLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[0].houseRent}
                            onChange={(val) => handleMonthChange(0, 'houseRent', val)}
                            onReset={() => handleResetMonthAmount(0, 'houseRent')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[1].houseRentLabel || 'House Rent'}
                            defaultValue="House Rent"
                            onChange={(val) => handleMonthChange(1, 'houseRentLabel', val)}
                            onReset={() => handleResetRowLabel(1, 'houseRentLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[1].houseRent}
                            onChange={(val) => handleMonthChange(1, 'houseRent', val)}
                            onReset={() => handleResetMonthAmount(1, 'houseRent')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[2].houseRentLabel || 'House Rent'}
                            defaultValue="House Rent"
                            onChange={(val) => handleMonthChange(2, 'houseRentLabel', val)}
                            onReset={() => handleResetRowLabel(2, 'houseRentLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[2].houseRent}
                            onChange={(val) => handleMonthChange(2, 'houseRent', val)}
                            onReset={() => handleResetMonthAmount(2, 'houseRent')}
                          />
                        </td>
                      </tr>

                      {/* Row 4: Medical */}
                      <tr>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[0].medicalLabel || 'Medical'}
                            defaultValue="Medical"
                            onChange={(val) => handleMonthChange(0, 'medicalLabel', val)}
                            onReset={() => handleResetRowLabel(0, 'medicalLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[0].medical}
                            onChange={(val) => handleMonthChange(0, 'medical', val)}
                            onReset={() => handleResetMonthAmount(0, 'medical')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[1].medicalLabel || 'Medical'}
                            defaultValue="Medical"
                            onChange={(val) => handleMonthChange(1, 'medicalLabel', val)}
                            onReset={() => handleResetRowLabel(1, 'medicalLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[1].medical}
                            onChange={(val) => handleMonthChange(1, 'medical', val)}
                            onReset={() => handleResetMonthAmount(1, 'medical')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[2].medicalLabel || 'Medical'}
                            defaultValue="Medical"
                            onChange={(val) => handleMonthChange(2, 'medicalLabel', val)}
                            onReset={() => handleResetRowLabel(2, 'medicalLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[2].medical}
                            onChange={(val) => handleMonthChange(2, 'medical', val)}
                            onReset={() => handleResetMonthAmount(2, 'medical')}
                          />
                        </td>
                      </tr>

                      {/* Row 5: Conveyance */}
                      <tr>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[0].conveyanceLabel || 'Conveyance'}
                            defaultValue="Conveyance"
                            onChange={(val) => handleMonthChange(0, 'conveyanceLabel', val)}
                            onReset={() => handleResetRowLabel(0, 'conveyanceLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[0].conveyance}
                            onChange={(val) => handleMonthChange(0, 'conveyance', val)}
                            onReset={() => handleResetMonthAmount(0, 'conveyance')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[1].conveyanceLabel || 'Conveyance'}
                            defaultValue="Conveyance"
                            onChange={(val) => handleMonthChange(1, 'conveyanceLabel', val)}
                            onReset={() => handleResetRowLabel(1, 'conveyanceLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[1].conveyance}
                            onChange={(val) => handleMonthChange(1, 'conveyance', val)}
                            onReset={() => handleResetMonthAmount(1, 'conveyance')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[2].conveyanceLabel || 'Conveyance'}
                            defaultValue="Conveyance"
                            onChange={(val) => handleMonthChange(2, 'conveyanceLabel', val)}
                            onReset={() => handleResetRowLabel(2, 'conveyanceLabel')}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[2].conveyance}
                            onChange={(val) => handleMonthChange(2, 'conveyance', val)}
                            onReset={() => handleResetMonthAmount(2, 'conveyance')}
                          />
                        </td>
                      </tr>

                      {/* Row 6: [RED-MARKED] Deduction 1 (Default: (Less) PF) */}
                      <tr>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[0].pfLabel || '(Less) PF'}
                            defaultValue="(Less) PF"
                            onChange={(val) => handleMonthChange(0, 'pfLabel', val)}
                            onReset={() => handleResetRowLabel(0, 'pfLabel')}
                            highlight={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[0].pfDeduction}
                            onChange={(val) => handleMonthChange(0, 'pfDeduction', val)}
                            onReset={() => handleResetMonthAmount(0, 'pfDeduction')}
                            defaultValue={initialDefaultsRef.current.months[0].pfDeduction}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[1].pfLabel || '(Less) PF'}
                            defaultValue="(Less) PF"
                            onChange={(val) => handleMonthChange(1, 'pfLabel', val)}
                            onReset={() => handleResetRowLabel(1, 'pfLabel')}
                            highlight={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[1].pfDeduction}
                            onChange={(val) => handleMonthChange(1, 'pfDeduction', val)}
                            onReset={() => handleResetMonthAmount(1, 'pfDeduction')}
                            defaultValue={initialDefaultsRef.current.months[1].pfDeduction}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[2].pfLabel || '(Less) PF'}
                            defaultValue="(Less) PF"
                            onChange={(val) => handleMonthChange(2, 'pfLabel', val)}
                            onReset={() => handleResetRowLabel(2, 'pfLabel')}
                            highlight={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[2].pfDeduction}
                            onChange={(val) => handleMonthChange(2, 'pfDeduction', val)}
                            onReset={() => handleResetMonthAmount(2, 'pfDeduction')}
                            defaultValue={initialDefaultsRef.current.months[2].pfDeduction}
                          />
                        </td>
                      </tr>

                      {/* Row 7: [RED-MARKED] Addition (Default: Over Time) */}
                      <tr>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[0].overtimeLabel || 'Over Time'}
                            defaultValue="Over Time"
                            onChange={(val) => handleMonthChange(0, 'overtimeLabel', val)}
                            onReset={() => handleResetRowLabel(0, 'overtimeLabel')}
                            highlight={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[0].overtime}
                            onChange={(val) => handleMonthChange(0, 'overtime', val)}
                            onReset={() => handleResetMonthAmount(0, 'overtime')}
                            defaultValue={initialDefaultsRef.current.months[0].overtime}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[1].overtimeLabel || 'Over Time'}
                            defaultValue="Over Time"
                            onChange={(val) => handleMonthChange(1, 'overtimeLabel', val)}
                            onReset={() => handleResetRowLabel(1, 'overtimeLabel')}
                            highlight={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[1].overtime}
                            onChange={(val) => handleMonthChange(1, 'overtime', val)}
                            onReset={() => handleResetMonthAmount(1, 'overtime')}
                            defaultValue={initialDefaultsRef.current.months[1].overtime}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[2].overtimeLabel || 'Over Time'}
                            defaultValue="Over Time"
                            onChange={(val) => handleMonthChange(2, 'overtimeLabel', val)}
                            onReset={() => handleResetRowLabel(2, 'overtimeLabel')}
                            highlight={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[2].overtime}
                            onChange={(val) => handleMonthChange(2, 'overtime', val)}
                            onReset={() => handleResetMonthAmount(2, 'overtime')}
                            defaultValue={initialDefaultsRef.current.months[2].overtime}
                          />
                        </td>
                      </tr>

                      {/* Row 8: [RED-MARKED] Deduction 2 (Default: Income Tax) */}
                      <tr>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[0].incomeTaxLabel || 'Income Tax'}
                            defaultValue="Income Tax"
                            onChange={(val) => handleMonthChange(0, 'incomeTaxLabel', val)}
                            onReset={() => handleResetRowLabel(0, 'incomeTaxLabel')}
                            highlight={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[0].incomeTax}
                            onChange={(val) => handleMonthChange(0, 'incomeTax', val)}
                            onReset={() => handleResetMonthAmount(0, 'incomeTax')}
                            defaultValue={initialDefaultsRef.current.months[0].incomeTax}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[1].incomeTaxLabel || 'Income Tax'}
                            defaultValue="Income Tax"
                            onChange={(val) => handleMonthChange(1, 'incomeTaxLabel', val)}
                            onReset={() => handleResetRowLabel(1, 'incomeTaxLabel')}
                            highlight={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[1].incomeTax}
                            onChange={(val) => handleMonthChange(1, 'incomeTax', val)}
                            onReset={() => handleResetMonthAmount(1, 'incomeTax')}
                            defaultValue={initialDefaultsRef.current.months[1].incomeTax}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[2].incomeTaxLabel || 'Income Tax'}
                            defaultValue="Income Tax"
                            onChange={(val) => handleMonthChange(2, 'incomeTaxLabel', val)}
                            onReset={() => handleResetRowLabel(2, 'incomeTaxLabel')}
                            highlight={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[2].incomeTax}
                            onChange={(val) => handleMonthChange(2, 'incomeTax', val)}
                            onReset={() => handleResetMonthAmount(2, 'incomeTax')}
                            defaultValue={initialDefaultsRef.current.months[2].incomeTax}
                          />
                        </td>
                      </tr>

                      {/* Row 9: Net Payable= */}
                      <tr className="font-bold">
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[0].netPayableLabel || 'Net Payable='}
                            defaultValue="Net Payable="
                            onChange={(val) => handleMonthChange(0, 'netPayableLabel', val)}
                            onReset={() => handleResetRowLabel(0, 'netPayableLabel')}
                            isBold={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[0].netPayable}
                            onChange={(val) => handleMonthChange(0, 'netPayable', val)}
                            onReset={() => handleResetNetPayable(0)}
                            isBold={true}
                            defaultValue={initialDefaultsRef.current.months[0].netPayable}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[1].netPayableLabel || 'Net Payable='}
                            defaultValue="Net Payable="
                            onChange={(val) => handleMonthChange(1, 'netPayableLabel', val)}
                            onReset={() => handleResetRowLabel(1, 'netPayableLabel')}
                            isBold={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[1].netPayable}
                            onChange={(val) => handleMonthChange(1, 'netPayable', val)}
                            onReset={() => handleResetNetPayable(1)}
                            isBold={true}
                            defaultValue={initialDefaultsRef.current.months[1].netPayable}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal">
                          <EditableLabelCell
                            value={formData.months[2].netPayableLabel || 'Net Payable='}
                            defaultValue="Net Payable="
                            onChange={(val) => handleMonthChange(2, 'netPayableLabel', val)}
                            onReset={() => handleResetRowLabel(2, 'netPayableLabel')}
                            isBold={true}
                          />
                        </td>
                        <td className="border border-black py-1 px-1.5 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.months[2].netPayable}
                            onChange={(val) => handleMonthChange(2, 'netPayable', val)}
                            onReset={() => handleResetNetPayable(2)}
                            isBold={true}
                            defaultValue={initialDefaultsRef.current.months[2].netPayable}
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
                      defaultValue={initialDefaultsRef.current.purpose}
                      onChange={(val) => setFormData((prev) => ({ ...prev, purpose: val }))}
                      onReset={() => handleResetField('purpose')}
                    />
                    , for which Company or undersigned has no responsibility or liability at all.
                  </p>

                  {/* Spacer to push signature section gracefully down to the bottom of the letterhead page */}
                  <div className="salary-signature-spacer flex-1 min-h-[48px]" />

                  {/* Signatory Section (Left aligned, with underline separator, positioned at lower portion) */}
                  <div className="salary-signature-block mt-auto pt-6 text-[14px] leading-snug shrink-0">
                    <div className="w-52 border-b border-black mb-1.5" />
                    <div className="font-bold">
                      <EditableInlineText
                        value={formData.signatoryName}
                        defaultValue={initialDefaultsRef.current.signatoryName}
                        onChange={(val) => setFormData((prev) => ({ ...prev, signatoryName: val }))}
                        onReset={() => handleResetField('signatoryName')}
                        isBold={true}
                      />
                    </div>
                    <div>
                      <EditableInlineText
                        value={formData.signatoryTitle}
                        defaultValue={initialDefaultsRef.current.signatoryTitle}
                        onChange={(val) => setFormData((prev) => ({ ...prev, signatoryTitle: val }))}
                        onReset={() => handleResetField('signatoryTitle')}
                      />
                    </div>
                    <div>
                      <EditableInlineText
                        value={formData.signatoryDepartment}
                        defaultValue={initialDefaultsRef.current.signatoryDepartment}
                        onChange={(val) => setFormData((prev) => ({ ...prev, signatoryDepartment: val }))}
                        onReset={() => handleResetField('signatoryDepartment')}
                      />
                    </div>
                    <div>
                      <EditableInlineText
                        value={formData.signatoryOrg}
                        defaultValue={initialDefaultsRef.current.signatoryOrg}
                        onChange={(val) => setFormData((prev) => ({ ...prev, signatoryOrg: val }))}
                        onReset={() => handleResetField('signatoryOrg')}
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

              <div className="salary-doc-page-wrapper w-full overflow-x-auto pb-4 print:p-0 print:m-0 print:overflow-visible">
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
                        defaultValue={initialDefaultsRef.current.refNo}
                        onChange={(val) => setFormData((prev) => ({ ...prev, refNo: val }))}
                        onReset={() => handleResetField('refNo')}
                        isMono={true}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Date:</span>
                      <EditableInlineText
                        value={formData.date}
                        defaultValue={todayFormatted}
                        onChange={(val) => setFormData((prev) => ({ ...prev, date: val }))}
                        onReset={() => handleResetField('date')}
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
                      defaultValue={initialDefaultsRef.current.salutation}
                      onChange={(val) => setFormData((prev) => ({ ...prev, salutation: val }))}
                      onReset={() => handleResetField('salutation')}
                    />{' '}
                    <EditableInlineText
                      value={formData.name}
                      defaultValue={initialDefaultsRef.current.name}
                      onChange={(val) => setFormData((prev) => ({ ...prev, name: val }))}
                      onReset={() => handleResetField('name')}
                      isBold={true}
                    />{' '}
                    (Staff ID:{' '}
                    <EditableInlineText
                      value={formData.workerId}
                      defaultValue={initialDefaultsRef.current.workerId}
                      onChange={(val) => setFormData((prev) => ({ ...prev, workerId: val }))}
                      onReset={() => handleResetField('workerId')}
                    />
                    ) has been employed with{' '}
                    <EditableInlineText
                      value={formData.companyName}
                      defaultValue={initialDefaultsRef.current.companyName}
                      onChange={(val) => setFormData((prev) => ({ ...prev, companyName: val }))}
                      onReset={() => handleResetField('companyName')}
                    />
                    , a sister concern of MEP GROUP since{' '}
                    <EditableInlineText
                      value={formData.joiningDate}
                      defaultValue={initialDefaultsRef.current.joiningDate}
                      onChange={(val) => setFormData((prev) => ({ ...prev, joiningDate: val }))}
                      onReset={() => handleResetField('joiningDate')}
                      renderDisplay={(val) => renderOrdinalDateText(val)}
                    />
                    .{' '}
                    <EditableInlineText
                      value={formData.genderPronoun}
                      defaultValue={initialDefaultsRef.current.genderPronoun}
                      onChange={(val) => setFormData((prev) => ({ ...prev, genderPronoun: val as any }))}
                      onReset={() => handleResetField('genderPronoun')}
                    />{' '}
                    is currently working as a{' '}
                    <EditableInlineText
                      value={formData.designation}
                      defaultValue={initialDefaultsRef.current.designation}
                      onChange={(val) => setFormData((prev) => ({ ...prev, designation: val }))}
                      onReset={() => handleResetField('designation')}
                    />{' '}
                    in the{' '}
                    <EditableInlineText
                      value={formData.department}
                      defaultValue={initialDefaultsRef.current.department}
                      onChange={(val) => setFormData((prev) => ({ ...prev, department: val }))}
                      onReset={() => handleResetField('department')}
                    />{' '}
                    Department.{' '}
                    <EditableInlineText
                      value={formData.genderPronoun}
                      defaultValue={initialDefaultsRef.current.genderPronoun}
                      onChange={(val) => setFormData((prev) => ({ ...prev, genderPronoun: val as any }))}
                      onReset={() => handleResetField('genderPronoun')}
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
                            onReset={() => handleResetStructureRow('structureBasicLabel', 'Basic')}
                          />
                        </td>
                        <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right w-[35%]">
                          <EditableAmountCell
                            value={formData.structureBasic}
                            onChange={(val) => handleStructureChange('structureBasic', val)}
                            onReset={() => handleResetStructureRow('structureBasicLabel', 'Basic', 'structureBasic')}
                            defaultValue={initialDefaultsRef.current.structureBasic}
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
                            onReset={() => handleResetStructureRow('structureHouseRentLabel', 'House Rent')}
                          />
                        </td>
                        <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.structureHouseRent}
                            onChange={(val) => handleStructureChange('structureHouseRent', val)}
                            onReset={() => handleResetStructureRow('structureHouseRentLabel', 'House Rent', 'structureHouseRent')}
                            defaultValue={initialDefaultsRef.current.structureHouseRent}
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
                            onReset={() => handleResetStructureRow('structureMedicalLabel', 'Medical Allowance')}
                          />
                        </td>
                        <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.structureMedical}
                            onChange={(val) => handleStructureChange('structureMedical', val)}
                            onReset={() => handleResetStructureRow('structureMedicalLabel', 'Medical Allowance', 'structureMedical')}
                            defaultValue={initialDefaultsRef.current.structureMedical}
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
                            onReset={() => handleResetStructureRow('structureConveyanceLabel', 'Conveyance')}
                          />
                        </td>
                        <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.structureConveyance}
                            onChange={(val) => handleStructureChange('structureConveyance', val)}
                            onReset={() => handleResetStructureRow('structureConveyanceLabel', 'Conveyance', 'structureConveyance')}
                            defaultValue={initialDefaultsRef.current.structureConveyance}
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
                            onReset={() => handleResetStructureRow('structureTotalLabel', 'Total Salary')}
                            isBold={true}
                          />
                        </td>
                        <td className="border border-black py-1.5 px-3 align-middle leading-normal text-right">
                          <EditableAmountCell
                            value={formData.structureTotal}
                            onChange={(val) => setFormData((prev) => ({ ...prev, structureTotal: val }))}
                            onReset={handleResetSalaryStructure}
                            isBold={true}
                            defaultValue={initialDefaultsRef.current.structureTotal}
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
                      defaultValue={initialDefaultsRef.current.amountInWords}
                      onChange={(val) => setFormData((prev) => ({ ...prev, amountInWords: val }))}
                      onReset={() => handleResetField('amountInWords')}
                      isBold={true}
                    />
                  </div>

                  {/* Monthly salary details heading */}
                  <div className="font-bold underline text-[14px] mt-3 mb-2">
                    Monthly salary details:
                  </div>

                  {/* Numbered Items List */}
                  <div className="space-y-2 text-[14px] leading-relaxed">
                    <p className="leading-relaxed">
                      <span>1. </span>
                      <EditableInlineText
                        value={formData.bankName}
                        defaultValue={initialDefaultsRef.current.bankName}
                        onChange={(val) => setFormData((prev) => ({ ...prev, bankName: val }))}
                        onReset={() => handleResetField('bankName')}
                      />
                      <span> (A/C No. </span>
                      <EditableInlineText
                        value={formData.bankAccountNo}
                        defaultValue={initialDefaultsRef.current.bankAccountNo}
                        onChange={(val) => setFormData((prev) => ({ ...prev, bankAccountNo: val }))}
                        onReset={() => handleResetField('bankAccountNo')}
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
                        onReset={() => handleResetField('monthlyPayableAmount')}
                        defaultValue={initialDefaultsRef.current.monthlyPayableAmount}
                        suffix="/-"
                      />
                      <span> (In Word: - </span>
                      <EditableInlineText
                        value={(formData.monthlyPayableInWords || '').replace(/^\(?In Word:\s*-?\s*/i, '').replace(/\)?\s*$/, '').trim()}
                        defaultValue={initialDefaultsRef.current.monthlyPayableInWords}
                        onChange={(val) => setFormData((prev) => ({ ...prev, monthlyPayableInWords: val }))}
                        onReset={() => handleResetField('monthlyPayableInWords')}
                      />
                      <span>)</span>
                    </p>
                    <p className="leading-relaxed">
                      <span>2. </span>
                      <EditableInlineText
                        value={formData.p2Item2Label || 'Total deduction amount (PF purpose Tk.'}
                        defaultValue="Total deduction amount (PF purpose Tk."
                        onChange={(val) => setFormData((prev) => ({ ...prev, p2Item2Label: val }))}
                        onReset={() => handleResetField('p2Item2Label')}
                      />
                      {' '}
                      <EditableInlineAmount
                        value={formData.pfDeductionPage2}
                        onChange={(val) => handlePage2PfChange(val)}
                        onReset={() => handleResetField('pfDeductionPage2')}
                        defaultValue={initialDefaultsRef.current.pfDeductionPage2}
                        suffix="/-"
                      />
                      <span>)</span>
                    </p>
                    <div className="flex items-start gap-1">
                      <span className="shrink-0 mt-0.5">3.</span>
                      <div className="flex-1 min-w-0">
                        <EditableInlineText
                          value={formData.disclaimer}
                          defaultValue={initialDefaultsRef.current.disclaimer}
                          onChange={(val) => setFormData((prev) => ({ ...prev, disclaimer: val }))}
                          onReset={() => handleResetField('disclaimer')}
                          multiline={true}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Spacer to push signature section gracefully down to the bottom of the letterhead page */}
                  <div className="salary-signature-spacer flex-1 min-h-[36px]" />

                  {/* Signatory Section (Left aligned, with underline separator, positioned at lower portion) */}
                  <div className="salary-signature-block mt-auto pt-6 text-[14px] leading-snug shrink-0">
                    <div className="w-52 border-b border-black mb-1.5" />
                    <div className="font-bold">
                      <EditableInlineText
                        value={formData.signatoryName}
                        defaultValue={initialDefaultsRef.current.signatoryName}
                        onChange={(val) => setFormData((prev) => ({ ...prev, signatoryName: val }))}
                        onReset={() => handleResetField('signatoryName')}
                        isBold={true}
                      />
                    </div>
                    <div>
                      <EditableInlineText
                        value={formData.signatoryTitle}
                        defaultValue={initialDefaultsRef.current.signatoryTitle}
                        onChange={(val) => setFormData((prev) => ({ ...prev, signatoryTitle: val }))}
                        onReset={() => handleResetField('signatoryTitle')}
                      />
                    </div>
                    <div>
                      <EditableInlineText
                        value={formData.signatoryDepartment}
                        defaultValue={initialDefaultsRef.current.signatoryDepartment}
                        onChange={(val) => setFormData((prev) => ({ ...prev, signatoryDepartment: val }))}
                        onReset={() => handleResetField('signatoryDepartment')}
                      />
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
