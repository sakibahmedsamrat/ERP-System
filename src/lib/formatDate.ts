export function parseFlexibleDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  
  const trimmed = String(dateStr).trim();
  if (!trimmed) return null;

  // Standard ISO or YYYY-MM-DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split(/[-/.]/);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const parts = trimmed.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = parseFlexibleDate(dateStr);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = parseFlexibleDate(dateStr);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  
  return `${day}-${month}-${year} ${strTime}`;
}

export function calculateServiceAge(
  startDateInput: string | Date | null | undefined,
  endDateInput: string | Date | null | undefined
): {
  text: string;
  years: number;
  months: number;
  days: number;
  isInverted: boolean;
  isValid: boolean;
} {
  const start = parseFlexibleDate(startDateInput);
  const end = parseFlexibleDate(endDateInput);

  if (!start || !end) {
    return { text: '', years: 0, months: 0, days: 0, isInverted: false, isValid: false };
  }

  let s = start;
  let e = end;
  let isInverted = false;

  if (e < s) {
    isInverted = true;
    // Swap so we compute duration gracefully instead of crashing or showing Invalid Date
    s = end;
    e = start;
  }

  let years = e.getFullYear() - s.getFullYear();
  let months = e.getMonth() - s.getMonth();
  let days = e.getDate() - s.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(e.getFullYear(), e.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Years`);
  if (months > 0) parts.push(`${months} Months`);
  if (days > 0 || parts.length === 0) parts.push(`${days} Days`);

  return {
    text: parts.join(', '),
    years,
    months,
    days,
    isInverted,
    isValid: true
  };
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

/**
 * Calculates payroll cycle days where a month is counted from the 26th of previous month to the 25th of current month.
 * e.g. 26-09-2026 to 25-10-2026 = 30 days (September has 30 days), Month Name = October (অক্টোবর)
 *      26-10-2026 to 25-11-2026 = 31 days (October has 31 days), Month Name = November (নভেম্বর)
 */
export function getPayrollCycleDays(dateInput: string | Date | null | undefined): {
  daysInCycle: number;
  cycleStart: Date;
  cycleEnd: Date;
  monthName: string;
  monthNameBn: string;
  cycleYear: number;
  monthYear: string;
  monthYearBn: string;
  cycleText: string;
} {
  const d = parseFlexibleDate(dateInput) || new Date();
  const day = d.getDate();
  const month = d.getMonth(); // 0-11
  const year = d.getFullYear();

  let startYear = year;
  let startMonth = month;
  let endYear = year;
  let endMonth = month;

  if (day >= 26) {
    // Current cycle starts on 26th of this month, ends on 25th of next month
    startMonth = month;
    startYear = year;
    endMonth = month + 1;
    if (endMonth > 11) {
      endMonth = 0;
      endYear = year + 1;
    }
  } else {
    // Current cycle started on 26th of previous month, ends on 25th of this month
    endMonth = month;
    endYear = year;
    startMonth = month - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = year - 1;
    }
  }

  const cycleStart = new Date(startYear, startMonth, 26);
  const cycleEnd = new Date(endYear, endMonth, 25);

  // Total days in the starting month: month M has K days, so (K - 26 + 1) + 25 = K days
  const daysInCycle = new Date(startYear, startMonth + 1, 0).getDate();
  
  // Month name is determined by the ending month of the cycle (25th of endMonth)
  const monthName = MONTH_NAMES_EN[endMonth];
  const monthNameBn = MONTH_NAMES_BN[endMonth];
  const cycleYear = endYear;
  const monthYear = `${monthName} ${cycleYear}`;
  const monthYearBn = `${monthNameBn} ${cycleYear}`;
  const cycleText = `${monthName} (${daysInCycle} Days: ${formatDate(cycleStart)} to ${formatDate(cycleEnd)})`;

  return {
    daysInCycle,
    cycleStart,
    cycleEnd,
    monthName,
    monthNameBn,
    cycleYear,
    monthYear,
    monthYearBn,
    cycleText,
  };
}
