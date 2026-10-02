// The counting maths, following the published counting method.
// Runs at build time (Astro), on load (client) and in tools/check.mjs.

export interface LedgerRow {
  id: string;
  caseId: string;
  crewUnit: string;
  baselinePerYear: number;
  remainingPerYear: number;
  frequency: string;
  goLive: string;
  confirmed: string;
  stopped: string | null;
  demo: boolean;
}

/** The date in the given zone, as YYYY-MM-DD. */
export function dateInZone(zone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function shiftDays(iso: string, days: number): string {
  return new Date((dayNumber(iso) + days) * 86_400_000).toISOString().slice(0, 10);
}

/** Keystrokes a row clears in a full year. */
export function clearedPerYear(row: LedgerRow): number {
  return row.baselinePerYear - row.remainingPerYear;
}

/**
 * The accrual of one row in the calendar year of `onDate`, unrounded.
 * Nothing before the confirmed date; then the weekly rate for every completed
 * 7-day period since the later of the confirmed date and 1 January.
 */
export function accrual(row: LedgerRow, onDate: string): number {
  const yearStart = `${onDate.slice(0, 4)}-01-01`;
  const end = row.stopped && row.stopped < onDate ? row.stopped : onDate;
  if (end < row.confirmed) return 0;
  const start = row.confirmed > yearStart ? row.confirmed : yearStart;
  const days = dayNumber(end) - dayNumber(start);
  if (days < 0) return 0;
  return Math.floor(days / 7) * (clearedPerYear(row) / 52);
}

/** Add first, then round down to the nearest hundred, once. */
export function roundDownHundred(n: number): number {
  return Math.floor(n / 100) * 100;
}

export function total(rows: LedgerRow[], onDate: string): number {
  return roundDownHundred(rows.reduce((sum, row) => sum + accrual(row, onDate), 0));
}

/**
 * The total as it stood seven days before `onDate`: the same maths run for
 * that date, and 0 if that date falls in the previous year.
 */
export function totalWeekAgo(rows: LedgerRow[], onDate: string): number {
  const then = shiftDays(onDate, -7);
  if (then.slice(0, 4) !== onDate.slice(0, 4)) return 0;
  return total(rows, then);
}
