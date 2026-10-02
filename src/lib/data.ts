// One place that applies demo mode. Templates read content through here,
// never from the JSON files directly.
import siteJson from '../content/site.json';
import casesJson from '../content/cases.json';
import ledgerJson from '../content/ledger.json';
import crewJson from '../content/crew.json';
import productsJson from '../content/products.json';
import shiftReportJson from '../content/shiftReport.json';
import practicesJson from '../content/practices.json';
import { accrual, clearedPerYear, roundDownHundred, total, totalWeekAgo, type LedgerRow } from './ledger';

export const site = siteJson;

/** While site.demo is true everything shows. Once it is false, demo records are gone. */
function live<T extends { demo?: boolean }>(rows: T[]): T[] {
  return site.demo ? rows : rows.filter((row) => !row.demo);
}

export type Case = (typeof casesJson)[number];
export type CrewUnit = (typeof crewJson)[number];
export type Practice = (typeof practicesJson)[number];

export const cases: Case[] = live(casesJson);
export const ledger: LedgerRow[] = live(ledgerJson as LedgerRow[]);
export const crew: CrewUnit[] = live(crewJson);
export const crewSize: number = crewJson.length;
export const shiftReport = site.demo || !shiftReportJson.demo ? shiftReportJson : null;
export const practices: Practice[] = practicesJson;

export const products = {
  audit: productsJson.audit,
  builds: productsJson.builds,
  items: live(productsJson.items),
  estimates: site.demo || !productsJson.estimates.demo ? productsJson.estimates : null,
  savers: productsJson.savers,
};

export function practice(key: string): Practice {
  return practices.find((p) => p.key === key)!;
}

export function unit(id: string | null): CrewUnit | undefined {
  return id ? crew.find((u) => u.unit === id) : undefined;
}

export function ledgerRowFor(caseId: string): LedgerRow | undefined {
  return ledger.find((row) => row.caseId === caseId);
}

export function caseById(id: string): Case | undefined {
  return cases.find((c) => c.id === id);
}

/** True while any row feeding a figure is demo: the figure is then labelled as a demonstration. */
export function anyDemo(rows: { demo?: boolean }[]): boolean {
  return rows.some((row) => row.demo);
}

export function homepageTotal(onDate: string) {
  return {
    today: total(ledger, onDate),
    weekAgo: totalWeekAgo(ledger, onDate),
    rows: ledger.length,
    demo: anyDemo(ledger),
  };
}

export function unitTotal(unitId: string, onDate: string) {
  const rows = ledger.filter((row) => row.crewUnit === unitId);
  return { value: total(rows, onDate), rows: rows.length, demo: anyDemo(rows) };
}

/** The largest cleared-per-year figures in the ledger. */
export function largestCleared(n = 4) {
  return [...ledger]
    .sort((a, b) => clearedPerYear(b) - clearedPerYear(a))
    .slice(0, n)
    .map((row) => ({ row, cleared: clearedPerYear(row), case: caseById(row.caseId) }));
}

export function rowAccrued(row: LedgerRow, onDate: string): number {
  return roundDownHundred(accrual(row, onDate));
}

/** Tally bar: cleared share rounded down to a whole segment, so anything left to type never shows a full bar. */
export function tallySegments(before: number, after: number, segments = 20): number {
  if (before <= 0) return 0;
  return Math.floor(((before - after) / before) * segments);
}

export const businessTypes: string[] = [...new Set(cases.map((c) => c.businessType))];
export const todos: string[] = Object.entries(site)
  .filter(([, v]) => v === 'TODO')
  .map(([k]) => k);
export const has = (key: 'email' | 'bookingUrl' | 'domain'): boolean => site[key] !== 'TODO' && site[key] !== '';

/** Before and after, a year, summed across the ledger rows of one practice. */
export function practiceTotals(key: string) {
  const rows = ledger.filter((row) => caseById(row.caseId)?.practice === key);
  return {
    before: rows.reduce((t, row) => t + row.baselinePerYear, 0),
    after: rows.reduce((t, row) => t + row.remainingPerYear, 0),
    rows: rows.length,
    demo: anyDemo(rows),
  };
}
