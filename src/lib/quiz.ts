// The quiz interpreter: deterministic rules over quiz.json and products.json.
// No model call. It recommends only from the product list, never more than
// three items, never a price beyond the published ranges, and nothing the
// answers do not support. Too small or too simple: it says buy nothing yet.
import quiz from '../content/quiz.json';
import { products, cases, type Case } from './data';

export type Answers = Record<string, string[]>;

export interface Recommendation {
  id: string;
  name: string;
  practice: string;
  bandName: string;
  range: string;
  case: Case | null;
}

export interface Result {
  read: string[];
  buyNothing: boolean;
  tooLarge: boolean;
  estimate: { label: string; text: string; admission: string } | null;
  items: Recommendation[];
  order: string | null;
  closing: string;
  businessType: string | null;
  showBook: boolean;
}

export const questions = quiz.questions;

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

export function interpret(a: Answers): Result {
  const size = a.q2?.[0];
  const tooSmall = size === quiz.sizing.tooSmall;
  const tooLarge = size === quiz.sizing.tooLarge;
  const businessType = (option('q1', a.q1?.[0] ?? '')?.businessType as string | null) ?? null;

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

  const buyNothing = tooSmall || qualified.length === 0;

  const read: string[] = [];
  if (evidence.length > 0) {
    read.push(quiz.read.lead.replace('{evidence}', joinList(evidence)));
    if (!buyNothing) read.push(evidence.length === 1 ? quiz.read.one : quiz.read.many.replaceAll('{n}', String(evidence.length)));
  } else {
    read.push(quiz.read.none);
  }
  if (tooSmall) read.push(quiz.read.tooSmall);
  if (tooLarge && !buyNothing) read.push(quiz.read.tooLarge);
  const payoff = option('q8', a.q8?.[0] ?? '')?.payoff as string | undefined;
  if (buyNothing) read.push(quiz.read.buyNothing);
  else if (payoff) read.push(payoff);

  const closing = (quiz.closing as Record<string, string>)[a.q9?.[0] ?? ''] ?? '';

  if (buyNothing) {
    return { read, buyNothing, tooLarge, estimate: null, items: [], order: null, closing, businessType, showBook: false };
  }

  const items: Recommendation[] = qualified.slice(0, quiz.sizing.maxItems).map((item) => {
    const band = products.builds.find((b) => b.band === item.band);
    const linked =
      item.cases.map((id) => cases.find((c) => c.id === id)).find((c) => c && c.businessType === businessType) ??
      item.cases.map((id) => cases.find((c) => c.id === id)).find(Boolean) ??
      null;
    return { id: item.id, name: item.name, practice: item.practice, bandName: band?.name ?? '', range: band?.range ?? '', case: linked };
  });

  // The estimate is a figure about re-entry, so it shows only when re-entry qualifies,
  // only for a size band that has one, and never for a business over 50.
  let estimate: Result['estimate'] = null;
  const band = option('q2', size ?? '')?.band as string | null | undefined;
  const reEntry = qualified.some((item) => item.id === quiz.sizing.estimateItem);
  const hours = band && products.estimates ? (products.estimates.bands as Record<string, string>)[band] : undefined;
  if (reEntry && !tooLarge && band && hours) {
    estimate = {
      label: quiz.estimate.label,
      text: quiz.estimate.text.replace('{band}', band).replace('{hours}', hours),
      admission: quiz.estimate.admission,
    };
  }

  return {
    read,
    buyNothing,
    tooLarge,
    estimate,
    items,
    order: items.length > 1 ? quiz.order.many : quiz.order.one,
    closing,
    businessType,
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
