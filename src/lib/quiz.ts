// The quiz interpreter: deterministic rules over quiz.json and products.json.
// No model call here. This is the result the page can always work out itself;
// when /api/quiz answers, Claude's read of the same answers is shown in its
// place (src/worker.ts, src/scripts/quiz.ts). It recommends only from the product list, never more than
// three items, never a price beyond the published ranges, and nothing the
// answers do not support. When no item qualifies it says buy nothing yet.
import quiz from '../content/quiz.json';
import { products, cases, serviceOfPractice, type Case } from './data';

export type Answers = Record<string, string[]>;

export interface Recommendation {
  id: string;
  name: string;
  /** The service the item belongs to, by name. */
  service: string;
  serviceSlug: string;
  range: string;
  case: Case | null;
}

export interface Result {
  /** The read: what the answers say, in two or three short sentences. */
  read: string[];
  buyNothing: boolean;
  estimate: { hours: string; label: string; admission: string } | null;
  items: Recommendation[];
  order: string | null;
  /** One or two sentences on what was stopping them, said before the next step. */
  next: string;
  showBook: boolean;
}

export const questions = quiz.questions;

/** The line under the list of items: where to start. */
export const orderLine = (count: number): string => (count > 1 ? quiz.order.many : quiz.order.one);

function option(qid: string, oid: string) {
  return questions.find((q) => q.id === qid)?.options.find((o) => o.id === oid) as Record<string, unknown> | undefined;
}

function qualifies(rule: (typeof quiz.rules)[number], a: Answers): boolean {
  return rule.any.some((cond) => {
    const given = a[cond.q] ?? [];
    const wanted = ('includes' in cond ? cond.includes : cond.in) ?? [];
    return given.some((g) => wanted.includes(g));
  });
}

function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

type Item = (typeof products.items)[number];

function businessTypeOf(a: Answers): string | null {
  return (option('q1', a.q1?.[0] ?? '')?.businessType as string | null) ?? null;
}

/** A product as the result shows it: its name, its service, its range and a case from the same kind of business. */
function recommendation(item: Item, businessType: string | null): Recommendation {
  const band = products.builds.find((b) => b.band === item.band);
  const linked =
    item.cases.map((id) => cases.find((c) => c.id === id)).find((c) => c && c.businessType === businessType) ??
    item.cases.map((id) => cases.find((c) => c.id === id)).find(Boolean) ??
    null;
  const s = serviceOfPractice(item.practice);
  return { id: item.id, name: item.name, service: s.name, serviceSlug: s.slug, range: band?.range ?? '', case: linked };
}

/** The same, for a product chosen by id (the picks that come back from /api/quiz). */
export function recommendationFor(id: string, a: Answers): Recommendation | null {
  const item = products.items.find((x) => x.id === id);
  return item ? recommendation(item, businessTypeOf(a)) : null;
}

export function interpret(a: Answers): Result {
  const businessType = businessTypeOf(a);

  // The evidence, in their own answers.
  const evidence: string[] = [];
  for (const qid of quiz.read.evidenceOrder) {
    for (const oid of a[qid] ?? []) {
      const e = option(qid, oid)?.evidence as string | null | undefined;
      if (e) evidence.push(e);
    }
  }

  const qualified = quiz.rules
    .filter((rule) => qualifies(rule, a))
    .map((rule) => products.items.find((item) => item.id === rule.item))
    .filter((item): item is (typeof products.items)[number] => Boolean(item))
    .sort((x, y) => x.order - y.order);

  const buyNothing = qualified.length === 0;

  const read: string[] = [];
  if (evidence.length > 0) {
    read.push(quiz.read.lead.replace('{evidence}', joinList(evidence)));
    if (!buyNothing) read.push(evidence.length === 1 ? quiz.read.one : quiz.read.many.replaceAll('{n}', String(evidence.length)));
  } else {
    read.push(quiz.read.none);
  }
  const payoff = option('q8', a.q8?.[0] ?? '')?.payoff as string | undefined;
  if (buyNothing) read.push(quiz.read.buyNothing);
  else if (payoff) read.push(payoff);

  const next = (quiz.closing as Record<string, string>)[a.q9?.[0] ?? ''] ?? '';

  if (buyNothing) {
    return { read, buyNothing, estimate: null, items: [], order: null, next, showBook: false };
  }

  const items: Recommendation[] = qualified.slice(0, quiz.sizing.maxItems).map((item) => recommendation(item, businessType));

  // The estimate is a figure about typing things twice, so it shows only when
  // that item qualifies, and only for a size of business that has one.
  let estimate: Result['estimate'] = null;
  const band = option('q2', a.q2?.[0] ?? '')?.band as string | null | undefined;
  const reEntry = qualified.some((item) => item.id === quiz.sizing.estimateItem);
  const hours = band && products.estimates ? (products.estimates.bands as Record<string, string>)[band] : undefined;
  if (reEntry && hours) estimate = { hours, label: quiz.estimate.label, admission: quiz.estimate.admission };

  return {
    read,
    buyNothing,
    estimate,
    items,
    order: orderLine(items.length),
    next,
    showBook: true,
  };
}

/** Answers in a URL hash: one group per question, option indexes as letters. */
export function encode(a: Answers): string {
  return questions
    .map((q) => (a[q.id] ?? []).map((oid) => String.fromCharCode(97 + q.options.findIndex((o) => o.id === oid))).join(''))
    .join('.');
}

export function decode(code: string): Answers | null {
  const groups = code.split('.');
  if (groups.length !== questions.length) return null;
  const a: Answers = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const ids = groups[i].split('').map((ch) => q.options[ch.charCodeAt(0) - 97]?.id);
    if (ids.length === 0 || ids.some((id) => !id)) return null;
    if (q.type === 'single' && ids.length !== 1) return null;
    a[q.id] = ids as string[];
  }
  return a;
}
