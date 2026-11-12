import React from 'react';
import { numberToWords, parseFlexibleDate } from '@/lib/formatDate';

export interface StatementCustomRow {
  id: string;
  labels: [string, string, string];
  types: [('deduction' | 'addition'), ('deduction' | 'addition'), ('deduction' | 'addition')];
  amounts: [number, number, number];
}

export interface MonthBreakdown {
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

export interface StatementData {
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
  customRows?: StatementCustomRow[];
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

export function getRowMultiplier(
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

export function createDefaultCustomRows(): StatementCustomRow[] {
  return [
    {
      id: 'pf',
      labels: ['(Less) PF', '(Less) PF', '(Less) PF'],
      types: ['deduction', 'deduction', 'deduction'],
      amounts: [1848, 1848, 1848],
    },
    {
      id: 'overtime',
      labels: ['Over Time', 'Over Time', 'Over Time'],
      types: ['addition', 'addition', 'addition'],
      amounts: [2933, 14986, 4400],
    },
    {
      id: 'incomeTax',
      labels: ['Income Tax', 'Income Tax', 'Income Tax'],
      types: ['deduction', 'deduction', 'deduction'],
      amounts: [1000, 1000, 417],
    },
  ];
}

export function computeNetPayable(
  gross: number,
  mIdx: 0 | 1 | 2,
  customRows?: StatementCustomRow[]
): number {
  if (customRows && customRows.length > 0) {
    let net = Number(gross) || 0;
    for (const r of customRows) {
      const amt = Number(r.amounts[mIdx]) || 0;
      const type = r.types[mIdx] || 'deduction';
      if (type === 'addition') {
        net += amt;
      } else {
        net -= amt;
      }
    }
    return Math.max(0, net);
  }
  return Math.max(0, Number(gross) || 0);
}

export function calculateMonthNetPayable(
  month: MonthBreakdown,
  mIdx?: 0 | 1 | 2,
  customRows?: StatementCustomRow[]
): number {
  const gross = Number(month.grossSalary) || 0;
  if (customRows && customRows.length > 0 && mIdx !== undefined) {
    return computeNetPayable(gross, mIdx, customRows);
  }
  const pf = Number(month.pfDeduction) || 0;
  const overtime = Number(month.overtime) || 0;
  const incomeTax = Number(month.incomeTax) || 0;
  const pfMult = getRowMultiplier(month.pfType, 'deduction', month.pfLabel);
  const otMult = getRowMultiplier(month.overtimeType, 'addition', month.overtimeLabel);
  const itMult = getRowMultiplier(month.incomeTaxType, 'deduction', month.incomeTaxLabel);
  return Math.max(0, gross + pfMult * pf + otMult * overtime + itMult * incomeTax);
}

export function getDefault3Months(): [string, string, string] {
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

export function formatDocDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatOrdinalDate(dateInput: string | Date | null | undefined): string {
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
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${day}${getOrdinalSuffix(day)} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDepartment(dept: string): string {
  const trimmed = (dept || '').trim();
  if (trimmed.toLowerCase().endsWith('department')) {
    return trimmed.slice(0, -10).trim();
  }
  return trimmed;
}

export function formatWordsOnly(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Taka Only.';
  const words = numberToWords(Math.round(num));
  return `${words} Taka Only.`;
}

export function renderOrdinalDateText(text: string): React.ReactNode {
  if (!text) return '';
  const match = text.match(/^(\d+)(st|nd|rd|th)(\s+.+)$/i);
  if (match) {
    return React.createElement(
      React.Fragment,
      null,
      match[1],
      React.createElement('sup', { className: 'text-[10px] leading-none' }, match[2].toLowerCase()),
      match[3]
    );
  }
  return text;
}
