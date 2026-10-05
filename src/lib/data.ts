// One place that applies demo mode and reads site settings. Templates read
// content through here, never from the JSON files directly.
import siteJson from '../content/site.json';
import casesJson from '../content/cases.json';
import ledgerJson from '../content/ledger.json';
import crewJson from '../content/crew.json';
import productsJson from '../content/products.json';
import shiftReportJson from '../content/shiftReport.json';
import servicesJson from '../content/services.json';
import { clearedPerYear, total, totalWeekAgo, accrual, roundDownHundred, type LedgerRow } from './ledger';

export const site = siteJson;

/** While site.demo is true everything shows. Once it is false, demo records are gone. */
function live<T extends { demo?: boolean }>(rows: T[]): T[] {
  return site.demo ? rows : rows.filter((row) => !row.demo);
}

export type Case = (typeof casesJson)[number];
export type CrewAgent = (typeof crewJson)[number];
export type Service = (typeof servicesJson)[number];

export const cases: Case[] = live(casesJson);
export const ledger: LedgerRow[] = live(ledgerJson as LedgerRow[]);
export const crew: CrewAgent[] = live(crewJson);
export const shiftReport = site.demo || !shiftReportJson.demo ? shiftReportJson : null;
export const services: Service[] = servicesJson;

export const products = {
  /** Which prices are shown. Savers is the only one on. Turning one back on is a one-word change in products.json. */
  display: productsJson.display,
  /** Said wherever a price used to sit and a visitor would expect one. */
  quoteLine: productsJson.quoteLine,
  audit: productsJson.audit,
  builds: productsJson.builds,
  items: live(productsJson.items),
  estimates: site.demo || !productsJson.estimates.demo ? productsJson.estimates : null,
  savers: productsJson.savers,
  /** The published price list. Shown on /savers only. */
  priceList: productsJson.priceList,
};

/** A service by its id: the value a case carries in `service`. */
export function service(id: string): Service {
  return services.find((s) => s.id === id)!;
}

/** Quiz items still name a practice; every practice is one service. */
export function serviceOfPractice(key: string): Service {
  return services.find((s) => s.practice === key)!;
}

export const serviceHref = (s: Service): string => `/services/${s.slug}`;

export function caseById(id: string): Case | undefined {
  return cases.find((c) => c.id === id);
}

export function casesOf(serviceId: string): Case[] {
  return cases.filter((c) => c.service === serviceId);
}

/** The three cases on the homepage, named in site.json. */
export const featuredCases: Case[] = site.featuredCases.map(caseById).filter((c): c is Case => Boolean(c));

export function homepageTotal(onDate: string) {
  return { today: total(ledger, onDate), weekAgo: totalWeekAgo(ledger, onDate) };
}

/** What one crew agent has cleared this year, from the ledger rows it runs. */
export function agentTotal(unitId: string, onDate: string): number {
  return total(ledger.filter((row) => row.crewUnit === unitId), onDate);
}

/** The largest cleared-per-year figures in the ledger, each with the business it belongs to. */
export function proofFigures(n = 4) {
  return [...ledger]
    .sort((a, b) => clearedPerYear(b) - clearedPerYear(a))
    .slice(0, n)
    .map((row) => ({ cleared: clearedPerYear(row), who: (caseById(row.caseId)?.descriptor ?? '').split(' · ')[0].toLowerCase() }))
    .filter((f) => f.who);
}

export function rowAccrued(row: LedgerRow, onDate: string): number {
  return roundDownHundred(accrual(row, onDate));
}

const isSet = (value: unknown): value is string => typeof value === 'string' && value !== '' && value !== 'TODO';

/** A value in site.json that the principals have set. Anything still TODO is left off the page. */
export const has = (key: 'email' | 'domain' | 'location' | 'serviceArea' | 'analyticsToken'): boolean => isSet(site[key]);

/** The forms post for real only when both Formspree ids and the reCAPTCHA site key are set. */
export const forms = {
  ...site.forms,
  ready: isSet(site.forms.formspreeContactId) && isSet(site.forms.formspreeQuizId) && isSet(site.forms.recaptchaSiteKey),
};

/** "https://example.com.au", with no trailing slash, or null until the domain is set. */
export const origin: string | null = isSet(site.domain) ? `https://${site.domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')}` : null;

/** Shown only when yearsExperience is a number. */
export const experienceLine: string | null = (() => {
  const years: unknown = site.yearsExperience;
  const n = typeof years === 'number' ? years : typeof years === 'string' && /^\d+$/.test(years) ? Number(years) : null;
  return n === null ? null : site.experienceLine.replace('{years}', String(n));
})();

/** Every "Book a free consultation" control goes to the form on the contact page. */
export const BOOK_HREF = '/contact';
export const BOOK_LABEL = 'Book a free consultation';
export const QUIZ_HREF = '/quiz';

/** Cases in an order that shows the range of work first: one from each service in turn. */
export const casesMixed: Case[] = (() => {
  const groups = services.map((s) => casesOf(s.id));
  const out: Case[] = [];
  for (let i = 0; groups.some((g) => i < g.length); i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
})();
