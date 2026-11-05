// The product catalogue: src/content/catalogue.json, from the handoff pack
// (its products.json; the site already had a products.json for the quiz and
// Savers). Edited on 5 November 2026 at the principals' request: no business
// sizes, times as 07:00 AEST, Systems link-up's works-with line. Pages render
// product copy and prices from it and nowhere else; nothing here rewrites it.
//
//   - Only products marked "live": true appear, get a page or reach the sitemap.
//   - Order: the practices in their own order (count, clear, build, face), then
//     each product's `order`.
//   - `proof`, `standardPrice` and hour figures are never shown.
import data from '../content/catalogue.json';
import { services, serviceHref } from './data';

export type Practice = (typeof data.practices)[number];
export type Product = (typeof data.products)[number];

export const practices: Practice[] = data.practices;
const rank = (id: string) => practices.findIndex((p) => p.id === id);

export const products: Product[] = data.products
  .filter((p) => p.live)
  .sort((a, b) => rank(a.practice) - rank(b.practice) || a.order - b.order);

export const practiceOf = (product: Product): Practice => practices.find((p) => p.id === product.practice)!;
export const productsIn = (practiceId: string): Product[] => products.filter((p) => p.practice === practiceId);
export const productHref = (product: Product): string => `/products/${product.slug}`;
export const productBySlug = (slug: string): Product | undefined => products.find((p) => p.slug === slug);

/** "01 COUNT": a practice's number and name, the small label the site keeps for them. */
export const practiceLabel = (p: Practice): string => `${p.number} ${p.name}`;

/** The customer-facing service a practice belongs to (services.json names them). */
export function serviceOf(p: Practice) {
  const s = services.find((x) => x.practice === p.id);
  return s ? { name: s.name, href: serviceHref(s) } : null;
}

/** "launch · ex GST" or "fixed · ex GST". */
export const priceKind = (p: Product): string => `${p.priceType === 'fixed' ? 'fixed' : 'launch'} · ex GST`;

// Words that start a proper noun keep their capital when a works-with line is
// lowered into a sentence ("Works with your Microsoft 365 ...").
const PROPER = /^(Microsoft|Excel|Xero|MYOB|Google|Office|Teams|SharePoint|Outlook|Gmail|WordPress)\b/;

/** The card's line: "Works with your accounting system (Xero or MYOB)." Null when the product needs none of the client's systems. */
export function worksWithLine(p: Product): string | null {
  const w = p.worksWith.trim();
  if (!w) return null;
  const lowered = PROPER.test(w) ? w : w.charAt(0).toLowerCase() + w.slice(1);
  return `Works with your ${lowered.replace(/\.$/, '')}.`;
}

/** The first sentence of a passage, for meta descriptions. */
export const firstSentence = (text: string): string => (text.match(/^.*?[.?!](\s|$)/)?.[0] ?? text).trim();

/** Previous and next products in catalogue order, wrapping at the ends. */
export function neighbours(product: Product): { prev: Product; next: Product } {
  const i = products.indexOf(product);
  return { prev: products[(i - 1 + products.length) % products.length], next: products[(i + 1) % products.length] };
}

/**
 * Quiz items (src/content/products.json, `items`) to the product whose loop
 * and page sit beside them on a quiz result. Matched on the item's id, which
 * the quiz result carries whether Claude wrote it or the page's own rules did.
 * `integration` has no product of its own in the catalogue mapping, so it
 * shows no loop.
 */
export const QUIZ_PRODUCT: Record<string, string> = {
  'reporting-pack': 'reporting-pack',
  'job-costing': 'job-costing',
  're-entry': 'job-to-invoice',
  application: 'quote-booking-form',
  identity: 'website-build',
};

/** The systems note, said once on the listing and on each product page that depends on the client's systems. */
export const SYSTEMS_NOTE =
  'Some products depend on the software and systems you already use. We confirm scope and price once we have seen them, and we may suggest improvements to those systems as part of the work.';

/** Practice -> product count, for the homepage service cards. */
export const countByPractice: Record<string, number> = Object.fromEntries(practices.map((p) => [p.id, productsIn(p.id).length]));
