// /llms.txt and /llms-full.txt: the site in plain Markdown for AI tools
// (the llms.txt proposal, llmstxt.org). Written at build from the same
// content files as the pages, so they never drift from the site.
//
// Rules this file keeps:
//   - Nothing still marked demo is described: the crew, the counter figures
//     and the sample report stay out until the principals mark them real.
//   - No prices. They are on /savers and nowhere else; these files point there.
//   - Contact details, location and service area appear only once they are
//     set in site.json.
import casesJson from '../content/cases.json';
import { site, services, products, has, serviceHref, type Service } from './data';
import { abs, faqsFor } from './seo';
import { num, sentenceCase } from './format';

const realCases = casesJson.filter((c) => !c.demo);
const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? '';
const caseUrl = (id: string) => abs(`/cases/${id}`);
const figure = (f: { value: number; unit: string }) => `${num(f.value)} ${f.unit}`;

function facts(): string[] {
  return [
    `- Services: ${services.map((s) => s.name).join('; ')}.`,
    `- ${products.audit.free} ${products.audit.lead}`,
    `- ${products.quoteLine} Published prices: ${abs('/savers')}`,
    `- Website: ${abs('/')}`,
    ...(has('email') ? [`- Email: ${site.email}`] : []),
    ...(has('location') ? [`- Based in: ${site.location}`] : []),
    ...(has('serviceArea') ? [`- Works across: ${site.serviceArea}`] : []),
  ];
}

const head = () => [`# ${site.name}`, '', `> ${site.origin} ${site.description}`, '', ...facts()];

/** /llms.txt: what the site is, and where each thing is explained. */
export function llmsIndex(): string {
  return [
    ...head(),
    '',
    '## Services',
    '',
    ...services.map((s) => `- [${s.name}](${abs(serviceHref(s))}): ${s.line} ${s.what}`),
    '',
    '## Getting started',
    '',
    `- [Book a free consultation](${abs('/contact')}): tell us what you need help with. ${products.audit.free}`,
    `- [${products.audit.name}](${abs('/audit')}): ${products.audit.what}`,
    `- [Keystroke Savers and prices](${abs('/savers')}): ${products.savers.what} The page lists every published price.`,
    `- [The quiz](${abs('/quiz')}): nine questions that suggest what your business should fix first.`,
    '',
    '## Case studies',
    '',
    `- [All cases](${abs('/cases')}): what was built for each business, and what it changed.`,
    ...realCases.map((c) => `- [${sentenceCase(c.headline)}](${caseUrl(c.id)}): ${c.descriptor}. ${c.summary} Before: ${figure(c.before)}. After: ${figure(c.after)}.`),
    '',
    '## Optional',
    '',
    `- [Everything in one file](${abs('/llms-full.txt')}): every service, its products and questions, the audit, Savers and each case in full.`,
    `- [How we count keystrokes](${abs('/counting')}): the published counting method.`,
    `- [Privacy policy](${abs('/privacy')})`,
    `- [Website terms of use](${abs('/terms')})`,
    '',
  ].join('\n');
}

function qa(page: string): string[] {
  const list = faqsFor(page);
  return list.length ? ['', '### Questions people ask', '', ...list.flatMap((f) => [`**${f.q}**`, f.a, ''])] : [];
}

function serviceFull(s: Service): string[] {
  return [
    `## ${s.name}`,
    '',
    `${abs(serviceHref(s))}`,
    '',
    `${s.line} ${s.what}`,
    '',
    '### What we offer',
    '',
    ...s.products.map((p) => `- ${p.name}: ${p.line}`),
    ...qa(s.id),
    '',
  ];
}

/** /llms-full.txt: the substance of every public page that is real, in one file. */
export function llmsFull(): string {
  const audit = products.audit;
  const savers = products.savers;
  return [
    ...head(),
    '',
    ...services.flatMap(serviceFull),
    `## ${audit.name}`,
    '',
    abs('/audit'),
    '',
    audit.what,
    '',
    `${audit.free} ${audit.lead} The report takes ${audit.delivery}.`,
    '',
    '### How it works',
    '',
    ...audit.steps.map((step, i) => `${i + 1}. ${step.title} ${step.text}`),
    ...qa('audit'),
    '',
    '## Keystroke Savers',
    '',
    abs('/savers'),
    '',
    savers.what,
    '',
    'Every plan includes:',
    '',
    ...savers.includes.map((line) => `- ${line}`),
    `- A reply within ${savers.response}`,
    '',
    savers.scope,
    '',
    `Prices for every plan, website care, the website builds and the audits are published at ${abs('/savers')}.`,
    ...qa('savers'),
    '',
    '## Case studies',
    '',
    ...realCases.flatMap((c) => [
      `### ${sentenceCase(c.headline)}`,
      '',
      caseUrl(c.id),
      '',
      `${c.descriptor}. Service: ${serviceName(c.service)}.`,
      '',
      `What was wrong: ${c.wrong}`,
      '',
      `What we built: ${c.built}`,
      '',
      `Before: ${figure(c.before)}. ${c.before.note}`,
      `After: ${figure(c.after)}. ${c.after.note}`,
      '',
    ]),
    '## Contact',
    '',
    `Book a free consultation: ${abs('/contact')}`,
    ...(has('email') ? [`Email: ${site.email}`] : []),
    '',
  ].join('\n');
}
