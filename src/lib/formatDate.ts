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
