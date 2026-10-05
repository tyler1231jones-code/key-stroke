// npm run check
//
// Reads the rendered text of the built pages (text nodes only: not markup,
// scripts or styles) and the built CSS, and fails on:
//   - a banned word outside an approved copy bank line
//   - an exclamation mark or an emoji in text
//   - font-style: italic, a radius above 6px, or a colour value that is not a token
//   - a keystroke or dollar figure in text that does not match a value in a
//     content file or one computed from the ledger
//   - text written for the builder, not the customer: TODO, demo labels, the
//     old audience limit, internal terms (ledger, baseline, unit and practice
//     numbers) anywhere but the counting page
//   - a dollar figure on any page but /savers, the one place prices are shown
//   - a disabled control
//   - a crew card without the tag "AI agent"
// Text inside [data-artefact] is skipped for the figure checks: artefacts show
// invented sample rows. The dollar rule has no exceptions and reads them too.
// Colours and radii inside a service demonstration are --demo-* properties
// (src/styles/demos.css); those declarations are the one place a colour that
// is not a token is allowed.
// Warns, without failing, on any TODO left in site.json. Whether the content
// is fit to publish is a separate question, answered by tools/predeploy.mjs.
//
// Run after `npm run build`.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { total, totalWeekAgo, accrual, clearedPerYear, roundDownHundred } from '../src/lib/ledger.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const content = join(root, 'src', 'content');
const json = (name) => JSON.parse(readFileSync(join(content, name), 'utf8'));

const failures = [];
const warnings = [];
const fail = (where, what) => failures.push(`${where}: ${what}`);

if (!existsSync(dist)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

/* ---------- What is allowed ---------- */

// The approved copy bank, as written. A banned word inside one of these lines is permitted.
const APPROVED = [
  'Let us push the buttons for you.',
  "We don't sell transformation. We sell a smaller number than the one you've got.",
  'Somebody in your office types the same invoice details three times. We counted.',
  'Your quote lives in four places. It should live in one and tell the other three.',
  'We rebuilt the intake so the form writes the job. Nobody retypes the address.',
  'The crew runs at 4am. Nobody types anything.',
  'An agent does not get bored on the four hundredth invoice, which is the entire point.',
  "We quote the build. We don't quote the transformation, because there isn't one.",
  "We counted. Here's the number.",
];

// Three copy bank lines the brief excludes. They must not appear at all.
const EXCLUDED = [/seven agents/i, /you don.t pay for the month/i, /812,000/];

const BANNED = [
  /\bAI[- ]powered\b/i, /\bseamless/i, /\bnext[- ]generation\b/i, /\bsolutions that scale\b/i, /\bunlock/i,
  /\bdigital experiences?\b/i, /\btransformation/i, /\bjourney/i, /\bempower/i, /\bleverag/i, /\brobust/i,
  /\binnovati/i, /\bcutting[- ]edge\b/i, /\bgame[- ]changing\b/i, /\bbest[- ]in[- ]class\b/i, /\bsynerg/i,
  /\bstreamlin/i, /\bsupercharg/i, /\brevolutioni[sz]/i, /\breimagin/i,
];

// Wording that was for the builder or the principals, not for a customer.
const NOT_FOR_CUSTOMERS = [
  [/\bTODO\b/, 'prints TODO'],
  [/demonstration (figure|build)/i, 'carries a demo label'],
  [/figures illustrative/i, 'carries a demo label'],
  [/not a person/i, 'carries the old "Not a person." line'],
  [/stand in for a photo shoot/i, 'carries the stand-in notice'],
  [/not connected yet/i, 'says a control is not connected'],
  [/\b5\s*(?:–|-|to)\s*50\b/, 'limits who the service is for (5 to 50 staff)'],
];
// Internal terms stay off customer pages. The counting page is where they are explained.
const INTERNAL = [
  [/\bledger\b/i, 'ledger'],
  [/\bbaseline\b/i, 'baseline'],
  [/\bUnit \d\d\b/, 'a unit number'],
  [/\bPractice \d\d\b/i, 'a practice number'],
  [/\bCase \d{3}\b/, 'a case number'],
];
// The design system rationed the word "automation" to once a page. Revision 2
// names a service and a product after it and asks for it in titles, so that
// ration is no longer checked.

// Example figures quoted in the published counting method. They illustrate the method; they are not claims.
const METHOD_EXAMPLES = [1920, 14600];

const TOKENS = ['base-000', 'base-100', 'base-900', 'rule', 'hairline', 'ink', 'ink-muted', 'ink-inverse', 'readout', 'live', 'signal', 'signal-inverse', 'focus', 'shadow-rest', 'shadow-press'];

const NAMED_COLOURS = new Set('black white red green blue yellow orange purple pink brown gray grey silver gold navy teal aqua cyan magenta maroon olive lime fuchsia beige ivory tan coral salmon khaki crimson indigo violet turquoise orchid plum lavender azure snow linen wheat tomato sienna peru chocolate firebrick whitesmoke gainsboro lightgray lightgrey darkgray darkgrey dimgray dimgrey slategray slategrey rebeccapurple steelblue royalblue skyblue'.split(' '));

/* ---------- Figures the site may state ---------- */

function numbersIn(value, out) {
  if (typeof value === 'number') out.add(value);
  else if (Array.isArray(value)) value.forEach((v) => numbersIn(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => numbersIn(v, out));
}
function stringsIn(value, out) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => stringsIn(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => stringsIn(v, out));
}

const site = json('site.json');
const ledgerAll = json('ledger.json');
const casesAll = json('cases.json');
const live = (rows) => (site.demo ? rows : rows.filter((r) => !r.demo));
const ledger = live(ledgerAll);
const cases = live(casesAll);
const sources = ['site.json', 'cases.json', 'ledger.json', 'crew.json', 'products.json', 'prices.json', 'shiftReport.json', 'quiz.json', 'services.json', 'faqs.json'].map(json);

function allowedFor(date) {
  const numbers = new Set([0]);
  sources.forEach((s) => numbersIn(s, numbers));
  METHOD_EXAMPLES.forEach((n) => numbers.add(n));
  // Computed from the ledger.
  for (const row of ledger) {
    numbers.add(clearedPerYear(row));
    numbers.add(roundDownHundred(accrual(row, date)));
  }
  const today = total(ledger, date);
  const weekAgo = totalWeekAgo(ledger, date);
  numbers.add(today).add(weekAgo).add(today - weekAgo);
  for (const unit of new Set(ledger.map((r) => r.crewUnit))) numbers.add(total(ledger.filter((r) => r.crewUnit === unit), date));
  for (const service of new Set(cases.map((c) => c.service))) {
    const rows = ledger.filter((r) => cases.find((c) => c.id === r.caseId)?.service === service);
    numbers.add(rows.reduce((t, r) => t + clearedPerYear(r), 0));
    numbers.add(rows.reduce((t, r) => t + r.baselinePerYear, 0));
    numbers.add(rows.reduce((t, r) => t + r.remainingPerYear, 0));
  }
  return numbers;
}

const strings = [];
sources.forEach((s) => stringsIn(s, strings));
const allowedDollars = new Set();
for (const s of strings) for (const m of s.matchAll(/\$\d[\d,]*(?:\.\d+)?/g)) allowedDollars.add(m[0]);

/* ---------- Reading the built pages ---------- */

function walk(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

const BLOCK = new Set('address article aside blockquote body br caption dd details div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr html label legend li main nav ol p section summary table tbody td tfoot th thead title tr ul option button'.split(' '));
const SKIP = new Set(['script', 'style', 'template', 'svg']);
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const hasClass = (node, cls) => (attr(node, 'class') ?? '').split(/\s+/).includes(cls);

function readPage(html) {
  const doc = parse(html, { scriptingEnabled: false });
  const page = { text: '', all: '', counters: [], h1: 0, robots: null, buildDate: null, redirect: false, disabled: 0, crewCards: 0, crewCardsMarked: 0, styles: [], inline: [] };
  const textOf = (node) => {
    if (node.nodeName === '#text') return node.value;
    return (node.childNodes ?? []).map(textOf).join('');
  };
  const visit = (node) => {
    const tag = node.tagName;
    if (tag === 'style') page.styles.push(textOf(node));
    if (tag === 'meta') {
      if (attr(node, 'name') === 'robots') page.robots = attr(node, 'content');
      if (attr(node, 'name') === 'ks-build-date') page.buildDate = attr(node, 'content');
      if (attr(node, 'name') === 'description') page.text += `\n${attr(node, 'content')}\n`;
      if ((attr(node, 'http-equiv') ?? '').toLowerCase() === 'refresh') page.redirect = true;
    }
    if (node.attrs) {
      for (const a of node.attrs) {
        if (a.name === 'style' || a.name === 'fill' || a.name === 'stroke') page.inline.push(`${a.name}:${a.value}`);
        if (a.name === 'aria-label' || a.name === 'alt') page.text += `\n${a.value}\n`;
        if (a.name === 'disabled' || (a.name === 'aria-disabled' && a.value === 'true')) page.disabled++;
      }
    }
    if (tag && SKIP.has(tag)) return;
    if (node.attrs && attr(node, 'data-artefact') !== undefined) {
      page.all += ` ${textOf(node)} `; // sample data: read only by the dollar rule
      return;
    }
    if (tag === 'h1') page.h1++;
    if (tag && hasClass(node, 'crew-card')) {
      page.crewCards++;
      // The tag itself, as its own element: not the words somewhere in the card's copy.
      const tagged = (n) => (n.tagName && hasClass(n, 'tag') && textOf(n).trim() === 'AI agent') || (n.childNodes ?? []).some(tagged);
      if (tagged(node)) page.crewCardsMarked++;
    }
    if (tag && hasClass(node, 'ctr') && attr(node, 'data-figure') !== 'other') {
      page.counters.push(textOf(node).replace(/\s+/g, ''));
    }
    if (node.nodeName === '#text') {
      page.text += node.value;
      page.all += node.value;
    }
    if (tag && BLOCK.has(tag)) page.text += '\n';
    for (const child of node.childNodes ?? []) visit(child);
    if (tag && BLOCK.has(tag)) page.text += '\n';
  };
  visit(doc);
  page.text = page.text.replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n');
  return page;
}

const toNumber = (s) => Number(s.replace(/,/g, ''));

for (const file of walk(dist, '.html')) {
  const where = relative(dist, file).replace(/\\/g, '/');
  const page = readPage(readFileSync(file, 'utf8'));
  if (page.redirect) continue; // a redirect written by Astro: no content of its own
  const allowed = allowedFor(page.buildDate ?? new Date().toISOString().slice(0, 10));

  // Words.
  let text = page.text;
  for (const line of EXCLUDED) if (line.test(text)) fail(where, `uses a copy bank line the brief excludes (${line})`);
  for (const line of APPROVED) text = text.split(line).join(' ').split(line.toUpperCase()).join(' ');
  for (const word of BANNED) {
    const m = text.match(word);
    if (m) fail(where, `banned word "${m[0]}" outside an approved copy bank line`);
  }
  for (const [pattern, what] of NOT_FOR_CUSTOMERS) {
    const m = page.text.match(pattern);
    if (m) fail(where, `${what}: "${page.text.split('\n').find((l) => pattern.test(l))?.trim().slice(0, 80)}"`);
  }
  if (!/^counting(\.html|\/|$)/.test(where)) {
    for (const [pattern, what] of INTERNAL) {
      if (pattern.test(page.text)) fail(where, `uses ${what}, an internal term: "${page.text.split('\n').find((l) => pattern.test(l))?.trim().slice(0, 80)}"`);
    }
  }
  if (page.disabled) fail(where, `${page.disabled} disabled control(s); a control that cannot be used is left off the page`);
  if (text.includes('!')) fail(where, `exclamation mark in text: "${text.split('\n').find((l) => l.includes('!'))?.trim().slice(0, 80)}"`);
  // The copyright, registered and trade mark signs are text, not emoji.
  const emoji = text.replace(/[©®™]/g, '').match(/\p{Extended_Pictographic}/u);
  if (emoji) fail(where, `emoji in text: ${emoji[0]}`);

  // Figures. Prices are shown on the Savers page and nowhere else.
  const savers = /^savers(\.html|\/|$)/.test(where);
  for (const m of page.all.matchAll(/\$\s?\d[\d,]*(?:\.\d+)?/g)) {
    if (!savers) fail(where, `dollar figure ${m[0]}: prices appear on /savers and nowhere else`);
    else if (!allowedDollars.has(m[0])) fail(where, `dollar figure ${m[0]} is not in a content file`);
  }
  for (const m of page.text.matchAll(/(?<![$\d,.])(\d{1,3}(?:,\d{3})+)(?![\d,]*\.\d)/g)) {
    if (!allowed.has(toNumber(m[1]))) fail(where, `figure ${m[1]} is not in a content file and is not computed from the ledger`);
  }
  // Same line only: a year at the end of one block is not a figure for the next.
  // Not in capitals: "2026 KEYSTROKE" in the copyright line is the firm's name.
  for (const m of page.text.matchAll(/(?<![$\d,.])(\d[\d,]*) +[kK]eystrokes?\b/g)) {
    if (!allowed.has(toNumber(m[1]))) fail(where, `keystroke figure ${m[1]} is not in a content file and is not computed from the ledger`);
  }
  for (const c of page.counters) {
    if (c !== '' && !allowed.has(toNumber(c))) fail(where, `counter shows ${c}, which is not in a content file and is not computed from the ledger`);
  }

  // Structure the brief asks for.
  if (page.h1 !== 1) fail(where, `${page.h1} h1 elements; there must be one`);
  if (site.demo && !/noindex/.test(page.robots ?? '')) fail(where, 'demo mode is on but the page does not carry noindex');
  if (page.crewCards !== page.crewCardsMarked) fail(where, 'a crew card is missing the tag "AI agent"');

  checkCss(where, page.styles.join('\n'));
  checkCss(`${where} (inline)`, page.inline.map((d) => `x{${d}}`).join('\n'));
}

/* ---------- Reading the built CSS ---------- */

function checkCss(where, cssText) {
  if (!cssText.trim()) return;
  let css = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/font-style\s*:\s*(italic|oblique)/i.test(css)) fail(where, 'font-style: italic');
  for (const m of css.matchAll(/border(?:-[a-z]+)*-radius\s*:\s*([^;}]+)/gi)) {
    for (const v of m[1].matchAll(/(-?[\d.]+)(px|%|em|rem|vw|vh)?/g)) {
      const n = Number(v[1]);
      if (!n) continue;
      if (v[2] !== 'px' || n > 6) fail(where, `radius above 6px: border-radius: ${m[1].trim()}`);
    }
  }
  // Token declarations are where colour values live. Everything else must use them.
  css = css.replace(new RegExp(`--(?:${TOKENS.join('|')})\\s*:[^;}]+`, 'g'), '');
  // So are the --demo-* declarations: colour inside a demonstration stage.
  css = css.replace(/--demo-[a-z0-9-]+\s*:[^;}]+/g, '');
  for (const m of css.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
    if (/^#0{4}$|^#0{8}$/i.test(m[0])) continue; // "transparent", as a minifier writes it
    fail(where, `colour ${m[0]} is not a token`);
  }
  for (const m of css.matchAll(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)/gi)) fail(where, `colour ${m[0]} is not a token`);
  for (const m of css.matchAll(/(?:^|[;{\s])((?:background|border|outline|text-decoration|column-rule|caret|accent|fill|stroke|color|box-shadow)[a-z-]*)\s*:\s*([^;}]+)/gi)) {
    // A custom property's own name may contain a colour word; its use is not a named colour.
    for (const word of m[2].toLowerCase().replace(/var\(--[a-z0-9-]+\)/g, ' ').match(/[a-z]+/g) ?? []) {
      if (NAMED_COLOURS.has(word)) fail(where, `named colour "${word}" in ${m[1]}: ${m[2].trim()}`);
    }
  }
}

for (const file of walk(dist, '.css')) checkCss(relative(dist, file).replace(/\\/g, '/'), readFileSync(file, 'utf8'));

/* ---------- Config ---------- */

for (const [key, value] of Object.entries(site)) {
  if (value === 'TODO') warnings.push(`site.json: "${key}" is still TODO. Whatever needs it is left off the page.`);
}

for (const w of warnings) console.warn(`warn  ${w}`);
if (failures.length) {
  for (const f of [...new Set(failures)]) console.error(`FAIL  ${f}`);
  console.error(`\n${new Set(failures).size} problem(s).`);
  process.exit(1);
}
console.log(`check passed: ${walk(dist, '.html').length} pages, ${walk(dist, '.css').length} stylesheets.`);
