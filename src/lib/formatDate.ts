export function parseFlexibleDate(
  dateStr: string | Date | null | undefined,
  options?: { isBirthDate?: boolean; pivotYear?: number }
): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  
  const trimmed = String(dateStr).trim();
  if (!trimmed) return null;

  // Standard ISO timestamp with time/zone component (e.g. 2026-10-14T18:00:00.000Z)
  if (trimmed.includes('T') || trimmed.endsWith('Z')) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // Extract optional time component if string contains spaces (e.g. "15/08/24 14:30:00")
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let datePart = trimmed;

  if (trimmed.includes(' ')) {
    const spaceParts = trimmed.split(/\s+/);
    datePart = spaceParts[0];
    const timePart = spaceParts.slice(1).join(' ');
    const timeMatch = timePart.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10) || 0;
      minutes = parseInt(timeMatch[2], 10) || 0;
      seconds = parseInt(timeMatch[3], 10) || 0;
      if (/pm/i.test(timePart) && hours < 12) hours += 12;
      if (/am/i.test(timePart) && hours === 12) hours = 0;
    }
  }

  const resolveYear = (rawYear: number): number => {
    if (rawYear >= 100) return rawYear;
    const currentYear = new Date().getFullYear();
    const pivot = options?.pivotYear ?? 50;

    if (options?.isBirthDate) {
      // For birth dates:
      // A 2-digit year (e.g. 24 -> 2024, 04 -> 2004) cannot be in the future.
      // If 2000 + rawYear <= currentYear and rawYear < pivot, it's 2000s; otherwise 1900s (e.g. 95 -> 1995).
      if (2000 + rawYear <= currentYear && rawYear < pivot) {
        return 2000 + rawYear;
      }
      return 1900 + rawYear;
    }

    // Standard pivot for general dates (e.g. Joining Date):
    // 00-49 -> 2000-2049 (e.g. 24 -> 2024, 00 -> 2000)
    // 50-99 -> 1950-1999 (e.g. 95 -> 1995, 75 -> 1975)
    return rawYear < pivot ? 2000 + rawYear : 1900 + rawYear;
  };

  // 1. Standard ISO date-only format (YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD)
  const isoMatch = datePart.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day, hours, minutes, seconds);
      d.setFullYear(year);
      if (
        !isNaN(d.getTime()) &&
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
      ) {
        return d;
      }
    }
    return null;
  }

  // 2. Day-first formats (DD/MM/YY, DD/MM/YYYY, DD-MM-YY, DD-MM-YYYY, DD.MM.YY, DD.MM.YYYY)
  const dmyMatch = datePart.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    const rawYear = parseInt(dmyMatch[3], 10);
    const year = resolveYear(rawYear);

    // Fallback swap: If month > 12 but day <= 12, the input was likely MM/DD/YY(YY)
    if (month > 12 && day <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day, hours, minutes, seconds);
      d.setFullYear(year);
      if (
        !isNaN(d.getTime()) &&
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
      ) {
        return d;
      }
    }
    return null;
  }

  // 3. Optional Excel numeric serial date fallback (e.g. 45519)
  if (/^\d{5}$/.test(datePart)) {
    const serial = parseInt(datePart, 10);
    if (serial >= 10000 && serial <= 99999) {
      const utcMs = (serial - 25569) * 86400 * 1000;
      const d = new Date(utcMs);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateToInput(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = parseFlexibleDate(dateInput);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const MONTH_NAMES_BN = MONTH_NAMES_EN;

/**
 * Calculates payroll cycle days where a month is counted from the 26th of previous month to the 25th of current month.
 * e.g. 26-09-2026 to 25-10-2026 = 30 days (September has 30 days), Month Name = October
 *      26-10-2026 to 25-11-2026 = 31 days (October has 31 days), Month Name = November
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

export function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
  };

  return convert(num).trim();
}
