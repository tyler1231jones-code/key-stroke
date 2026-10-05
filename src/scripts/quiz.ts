// The quiz. One question per screen; each screen advances like a counter
// indexing. The result is worked out by deterministic rules (src/lib/quiz.ts)
// and has its own URL, with the answers in the hash. The result says three
// things: the read, the recommended items, and the next step.
//
// The result is shown without asking for anything. Beneath it sits one form,
// "Send me this and get in touch", which carries the answers and the result
// with the visitor's details. Nothing leaves the browser unless that form is
// sent (src/scripts/forms.ts).
import { gsap } from 'gsap';
import { interpret, encode, decode, type Answers, type Result } from '../lib/quiz';
import { products } from '../lib/data';
import { figureRuns, withArticle } from '../lib/format';
import { counter } from './counter';
import { questions } from '../lib/quiz';
import { initForms } from './forms';
import { initSite, initReveal } from './site';

const ROLL = 0.18;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const form = document.getElementById('quiz-form') as HTMLFormElement | null;
const frame = document.getElementById('quiz-frame');
const resultEl = document.getElementById('quiz-result');
const top = document.getElementById('quiz-top');
const next = document.getElementById('quiz-next') as HTMLButtonElement | null;
const back = document.getElementById('quiz-back') as HTMLButtonElement | null;
const stepEl = document.getElementById('quiz-step');
const enquiry = document.getElementById('quiz-enquiry');
const screens = form ? Array.from(form.querySelectorAll<HTMLFieldSetElement>('.quiz-screen')) : [];
const step = stepEl ? counter(stepEl) : null;
let current = 0;
let rolling = false;

/* ---------- Small DOM helpers ---------- */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) figured(node, text);
  return node;
}

/** Set copy with every numeral in the data family. */
function figured(node: HTMLElement, text: string): void {
  for (const run of figureRuns(text)) {
    if (run.fig) {
      const s = document.createElement('span');
      s.className = 'fig';
      s.textContent = run.text;
      node.appendChild(s);
    } else {
      node.appendChild(document.createTextNode(run.text));
    }
  }
}

/* ---------- Answers ---------- */
function answersOf(screen: HTMLFieldSetElement): string[] {
  return Array.from(screen.querySelectorAll<HTMLInputElement>('input:checked')).map((i) => i.value);
}

function allAnswers(): Answers {
  const a: Answers = {};
  screens.forEach((s) => (a[s.dataset.q ?? ''] = answersOf(s)));
  return a;
}

/** "Next" is shown once the question has an answer. It is never shown disabled. */
function sync(): void {
  if (!next || !back) return;
  next.hidden = answersOf(screens[current]).length === 0;
  next.textContent = current === screens.length - 1 ? 'See the result' : 'Next';
  back.hidden = current === 0;
}

/* ---------- Moving between screens ---------- */
function go(to: number): void {
  if (rolling || to === current || to < 0 || to >= screens.length || !frame) return;
  const dir = to > current ? 1 : -1;
  const from = screens[current];
  const into = screens[to];
  current = to;
  into.hidden = false;
  step?.roll(to + 1, { dir });
  sync();
  const done = () => {
    from.hidden = true;
    gsap.set([from, into], { clearProps: 'transform' });
    frame.classList.remove('is-rolling');
    rolling = false;
    into.querySelector<HTMLElement>('legend')?.focus({ preventScroll: true });
  };
  if (reduced) {
    done();
    return;
  }
  rolling = true;
  frame.classList.add('is-rolling');
  gsap.fromTo(from, { yPercent: 0 }, { yPercent: -100 * dir, duration: ROLL * 1.5, ease: 'none' });
  gsap.fromTo(into, { yPercent: 100 * dir }, { yPercent: 0, duration: ROLL * 1.5, ease: 'none', onComplete: done });
}

function finish(): void {
  const a = allAnswers();
  if (screens.some((s) => answersOf(s).length === 0)) return;
  const code = encode(a);
  history.replaceState(null, '', `#r=${code}`);
  show(interpret(a), code, a);
}

/* ---------- The result ---------- */
/** The answers as a person would read them, for the enquiry that goes with the result. */
function answersAsText(a: Answers): string {
  return questions
    .map((q) => `${q.text} ${(a[q.id] ?? []).map((id) => q.options.find((o) => o.id === id)?.label ?? id).join(', ')}`)
    .join('\n');
}

function show(r: Result, code: string, a: Answers): void {
  if (!resultEl) return;
  if (form) form.hidden = true;
  if (top) top.hidden = true;
  resultEl.textContent = '';
  const url = `${location.origin}${location.pathname}#r=${code}`;

  // 1. The read.
  const read = el('div', 'result-read');
  const h = el('h2', 'display-l', r.buyNothing ? 'Buy nothing yet.' : 'What your answers say.');
  h.tabIndex = -1;
  read.appendChild(h);
  read.appendChild(el('p', 'lede', r.read.join(' ')));
  if (r.estimate) {
    const fig = el('p', 'result-estimate');
    fig.appendChild(el('span', 'counter-m', r.estimate.hours));
    const label = el('span', 'unit');
    label.textContent = `${r.estimate.label}. ${r.estimate.admission}`;
    fig.appendChild(label);
    read.appendChild(fig);
  }
  resultEl.appendChild(read);

  // 2. The recommended items, in the order to do them.
  if (r.items.length) {
    const block = el('div', 'result-block');
    block.setAttribute('data-reveal', '');
    block.appendChild(el('h3', 'display-m', r.items.length === 1 ? 'What we would fix' : 'What we would fix, in order'));
    const list = el('ol', 'result-items');
    r.items.forEach((item, i) => {
      const li = el('li', 'result-item');
      li.setAttribute('data-reveal', 'card');
      li.style.setProperty('--i', String(i));
      li.appendChild(el('span', 'n', String(i + 1)));
      const body = el('div', 'result-item-body');
      body.appendChild(el('p', 'display-s', item.name));
      if (products.display.quiz) {
        const cost = el('p', 'result-cost');
        cost.appendChild(el('span', 'figure', item.range));
        const what = el('span', 'unit');
        what.textContent = 'is the usual cost';
        cost.appendChild(what);
        body.appendChild(cost);
      }
      if (item.case) {
        const link = el('a', 'body-s');
        link.href = `/cases/${item.case.id}`;
        link.textContent = `See one we built for ${withArticle(item.case.descriptor.split(' · ')[0].toLowerCase())}`;
        body.appendChild(link);
      }
      li.appendChild(body);
      list.appendChild(li);
    });
    block.appendChild(list);
    if (r.order) block.appendChild(el('p', 'body', r.order));
    if (!products.display.quiz) block.appendChild(el('p', 'body-s muted', products.quoteLine));
    resultEl.appendChild(block);
  }

  // 3. The next step.
  const exits = el('div', 'result-block');
  exits.setAttribute('data-reveal', '');
  exits.appendChild(el('h3', 'display-m', 'The next step'));
  if (r.next) exits.appendChild(el('p', 'body', r.next));
  resultEl.appendChild(exits);

  // The form under the result carries the answers and the result with it.
  if (enquiry) {
    const set = (name: string, value: string) => {
      const field = enquiry.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (field) field.value = value;
    };
    set('quiz_answers', answersAsText(a));
    set('quiz_recommended', r.buyNothing ? 'Buy nothing yet' : r.items.map((item, i) => `${i + 1}. ${item.name} (${item.service})`).join('\n'));
    set('quiz_result', url);
    enquiry.hidden = false;
  }

  resultEl.hidden = false;
  h.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  // The blocks below the first screen arrive as they are reached.
  initReveal(resultEl.parentElement ?? resultEl);
}

function restart(): void {
  history.replaceState(null, '', location.pathname);
  form?.reset();
  screens.forEach((s, i) => (s.hidden = i > 0));
  current = 0;
  step?.show(1);
  if (resultEl) resultEl.hidden = true;
  if (enquiry) {
    enquiry.hidden = true;
    // A result already sent starts again with a fresh form.
    const sent = enquiry.querySelector<HTMLFormElement>('form');
    const thanks = enquiry.querySelector<HTMLElement>('.form-thanks');
    if (sent) sent.hidden = false;
    if (thanks) thanks.hidden = true;
  }
  if (form) form.hidden = false;
  if (top) top.hidden = false;
  sync();
}

/* ---------- Wiring ---------- */
function fromHash(): boolean {
  const m = location.hash.match(/^#r=([a-z.]+)$/);
  const a = m ? decode(m[1]) : null;
  if (!m || !a) return false;
  // Put the answers back in the form, so "Back" and "Start again" behave.
  screens.forEach((s) => {
    const given = a[s.dataset.q ?? ''] ?? [];
    s.querySelectorAll<HTMLInputElement>('input').forEach((i) => (i.checked = given.includes(i.value)));
  });
  show(interpret(a), m[1], a);
  return true;
}

if (form && next && back) {
  form.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    const screen = input.closest<HTMLFieldSetElement>('.quiz-screen');
    // "None of these" clears the others, and choosing any other clears it.
    const exclusive = screen?.dataset.exclusive;
    if (screen && exclusive && input.checked) {
      screen.querySelectorAll<HTMLInputElement>('input').forEach((i) => {
        if (i !== input && (input.value === exclusive || i.value === exclusive)) i.checked = false;
      });
    }
    sync();
  });
  // A tap on a single-choice answer advances. Keyboard users choose, then press Next.
  form.addEventListener('click', (event) => {
    const input = event.target as HTMLInputElement;
    if (input.type !== 'radio' || event.detail === 0) return;
    window.setTimeout(() => (current === screens.length - 1 ? finish() : go(current + 1)), ROLL * 1000);
  });
  next.addEventListener('click', () => (current === screens.length - 1 ? finish() : go(current + 1)));
  back.addEventListener('click', () => go(current - 1));
  document.getElementById('quiz-again')?.addEventListener('click', restart);
  form.addEventListener('submit', (event) => event.preventDefault());
  window.addEventListener('hashchange', () => {
    if (!fromHash() && resultEl && !resultEl.hidden) restart();
  });
  if (!fromHash()) sync();
}
initForms();
initSite();
document.documentElement.classList.add('run');
