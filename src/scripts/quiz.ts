// The quiz. One question per screen; each screen advances like a counter
// indexing. The result is worked out by deterministic rules (src/lib/quiz.ts)
// and has its own URL, with the answers in the hash.
//
// "Ask a question about it" is a mail link for now. The bounded conversation
// in the business plan would attach here: a Worker route (say POST /api/ask)
// that receives the result code and the question, and returns an answer.
import { gsap } from 'gsap';
import { interpret, encode, decode, type Answers, type Result } from '../lib/quiz';
import { site, products, practice, has } from '../lib/data';
import { figureRuns, slug } from '../lib/format';
import { counter } from './counter';

const ROLL = 0.18;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const form = document.getElementById('quiz-form') as HTMLFormElement | null;
const frame = document.getElementById('quiz-frame');
const resultEl = document.getElementById('quiz-result');
const top = document.getElementById('quiz-top');
const next = document.getElementById('quiz-next') as HTMLButtonElement | null;
const back = document.getElementById('quiz-back') as HTMLButtonElement | null;
const stepEl = document.getElementById('quiz-step');
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

function sync(): void {
  if (!next || !back) return;
  next.disabled = answersOf(screens[current]).length === 0;
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
  const code = encode(a);
  history.replaceState(null, '', `#r=${code}`);
  show(interpret(a), code);
}

/* ---------- The result ---------- */
function show(r: Result, code: string): void {
  if (!resultEl) return;
  if (form) form.hidden = true;
  if (top) top.hidden = true;
  resultEl.textContent = '';
  const url = `${location.origin}${location.pathname}#r=${code}`;

  const read = el('div', 'result-read');
  read.appendChild(el('p', 'eyebrow', 'The read'));
  const h = el('h2', 'display-l', r.buyNothing ? 'Buy nothing yet.' : 'What your answers say.');
  h.tabIndex = -1;
  read.appendChild(h);
  read.appendChild(el('p', 'lede', r.read.join(' ')));
  resultEl.appendChild(read);

  if (r.estimate) {
    const block = el('div', 'result-block result-estimate');
    block.appendChild(el('p', 'plate muted', products.estimates?.demo ? `${r.estimate.label} / demonstration figure` : r.estimate.label));
    block.appendChild(el('p', 'body', `${r.estimate.text} ${r.estimate.admission}`));
    resultEl.appendChild(block);
  }

  if (r.items.length) {
    const block = el('div', 'result-block');
    block.appendChild(el('p', 'plate muted', r.items.length === 1 ? 'What we would recommend' : 'What we would recommend, in the order to do it'));
    const list = el('ol', 'result-items');
    r.items.forEach((item, i) => {
      const li = el('li', 'result-item');
      li.appendChild(el('span', 'n', String(i + 1)));
      const body = el('div');
      body.appendChild(el('h3', 'display-s', item.name));
      const dl = el('dl');
      const field = (label: string, value: HTMLElement | string) => {
        const wrap = el('div');
        wrap.appendChild(el('dt', 'plate muted', label));
        const dd = el('dd', 'figure');
        if (typeof value === 'string') dd.textContent = value;
        else dd.appendChild(value);
        wrap.appendChild(dd);
        dl.appendChild(wrap);
      };
      const p = practice(item.practice);
      field('Practice', `${p.n} / ${p.name}`);
      field(item.bandName, item.range);
      if (item.case) {
        const link = el('a', 'body-s');
        link.href = `/#case-${item.case.id}`;
        figured(link, `Case ${item.case.id}: ${item.case.descriptor.split(' · ')[0]}`);
        field('A build like it', link);
      }
      body.appendChild(dl);
      li.appendChild(body);
      list.appendChild(li);
    });
    block.appendChild(list);
    if (r.order) block.appendChild(el('p', 'body', r.order));
    resultEl.appendChild(block);
  }

  if (r.closing) {
    const block = el('div', 'result-block');
    block.appendChild(el('p', 'plate muted', 'On what is stopping you'));
    block.appendChild(el('p', 'body', r.closing));
    resultEl.appendChild(block);
  }

  // Three exits at equal weight. No pressure hierarchy.
  const exits = el('div', 'result-block');
  exits.appendChild(el('p', 'plate muted', 'From here'));
  const row = el('div', 'result-exits');
  const exit = (label: string, href: string | null, note: string) => {
    if (href) {
      const a = el('a', 'key', label);
      a.href = href;
      row.appendChild(a);
    } else {
      const wrap = el('span', 'key-wrap');
      const b = el('button', 'key', label);
      b.type = 'button';
      b.disabled = true;
      b.setAttribute('aria-disabled', 'true');
      wrap.appendChild(b);
      wrap.appendChild(el('span', 'plate key-note', note));
      row.appendChild(wrap);
    }
  };
  const subject = encodeURIComponent(`${site.name}: my nine answers`);
  const body = encodeURIComponent(url);
  exit('Email me this', `mailto:?subject=${subject}&body=${body}`, '');
  exit('Ask a question about it', has('email') ? `mailto:${site.email}?subject=${subject}&body=${body}` : null, 'Contact address not connected yet');
  if (r.showBook) exit('Book the audit', has('bookingUrl') ? site.bookingUrl : null, 'Booking link not connected yet');
  exits.appendChild(row);
  resultEl.appendChild(exits);

  const tail = el('div', 'result-block result-back');
  const cases = el('a', 'plate');
  cases.href = r.businessType ? `/?type=${slug(r.businessType)}#cases` : '/#cases';
  cases.textContent = r.businessType ? `The cases, ${r.businessType} first >` : 'The cases >';
  tail.appendChild(cases);
  const again = el('button', 'plate quiz-back', 'Start again');
  again.type = 'button';
  again.addEventListener('click', restart);
  tail.appendChild(again);
  resultEl.appendChild(tail);

  resultEl.hidden = false;
  h.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

function restart(): void {
  history.replaceState(null, '', location.pathname);
  form?.reset();
  screens.forEach((s, i) => (s.hidden = i > 0));
  current = 0;
  step?.show(1);
  if (resultEl) resultEl.hidden = true;
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
  show(interpret(a), m[1]);
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
  form.addEventListener('submit', (event) => event.preventDefault());
  window.addEventListener('hashchange', () => {
    if (!fromHash() && resultEl && !resultEl.hidden) restart();
  });
  if (!fromHash()) sync();
}
document.documentElement.classList.add('run');
