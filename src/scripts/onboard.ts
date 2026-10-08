// The onboarding forms (/onboard/<service>). One step at a time; questions
// show and hide as earlier answers change; what is typed is kept in this
// browser until it is sent; the last step shows every answer, then the terms.
//
// Sending builds one Formspree submission that reads well as an email:
//   Service, Business, Contact, email, Phone
//   Access checklist   every access block and where the client is up to
//   01. <step title>   that step's questions and answers, one field per step
//   the agreement      who accepted, the date, the time sent, the address
//   the files          as Formspree links
//
// Development mode: while the Formspree onboarding id is TODO in site.json,
// nothing is sent. The page prints what it would have sent to the console and
// shows the thank-you, as the other forms on the site do.
import './page';
import { tokenFor } from './forms';

interface SubDef { id: string; label: string; type: string }
interface FieldDef { id: string; type: string; label: string; item?: string; fields?: SubDef[] }
interface StepDef { id: string; title: string; fields: FieldDef[] }
interface Definition {
  id: string;
  name: string;
  formId: string;
  live: boolean;
  files: { maxFiles: number; maxFileMb: number; maxTotalMb: number };
  termsVersion: string;
  terms: string[];
  steps: StepDef[];
}
interface When { field: string; is?: string[]; has?: string[]; filled?: boolean; ticked?: boolean }
type Answer = string | string[] | boolean;
type Input = HTMLInputElement | HTMLTextAreaElement;

const MB = 1024 * 1024;
/** Something that looks like a password typed into an answer. */
const SECRET = /\b(password|passwd|passcode|pwd|pin)\b\s*(is|[:=-])\s*\S+/i;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- /onboard: copy a form's link ---------- */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy ?? '');
      button.textContent = 'Copied';
    } catch {
      const text = button.parentElement?.querySelector('[data-link]');
      if (text) getSelection()?.selectAllChildren(text);
      button.textContent = 'Press Ctrl+C to copy';
    }
    setTimeout(() => (button.textContent = 'Copy link'), 2000);
  });
});

const root = document.querySelector<HTMLElement>('[data-onboard]');
const definitionEl = document.getElementById('ob-definition');
if (root && definitionEl?.textContent) init(root, JSON.parse(definitionEl.textContent) as Definition);

function init(root: HTMLElement, def: Definition): void {
  const form = root.querySelector<HTMLFormElement>('[data-onboard-form]')!;
  const steps = Array.from(form.querySelectorAll<HTMLFieldSetElement>('.ob-step'));
  const intro = root.querySelector<HTMLElement>('.ob-intro')!;
  const progress = root.querySelector<HTMLElement>('[data-progress]')!;
  const progressText = root.querySelector<HTMLElement>('[data-progress-text]')!;
  const strip = root.querySelector<HTMLElement>('[data-strip]')!;
  const back = form.querySelector<HTMLButtonElement>('[data-back]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const send = form.querySelector<HTMLButtonElement>('[data-send]')!;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const done = root.querySelector<HTMLElement>('[data-done]')!;
  const review = form.querySelector<HTMLElement>('[data-review]')!;
  const storeKey = `ks-onboard:${def.id}`;
  let current = 0;
  let sending = false;

  /* ---------- Reading answers ---------- */
  const wrapperOf = (id: string) => form.querySelector<HTMLElement>(`[data-field="${CSS.escape(id)}"]`);
  const kindOf = (wrapper: HTMLElement) => wrapper.dataset.kind ?? wrapper.querySelector<HTMLElement>('[data-kind]')?.dataset.kind ?? 'text';
  /** Hidden by a show-if rule, on the field or on its step. */
  const isHidden = (el: Element) => Boolean(el.closest('[data-show-if][hidden]'));
  const named = (name: string) => Array.from(form.querySelectorAll<Input>(`[name="${CSS.escape(name)}"]`));
  const textOf = (name: string) => (named(name)[0]?.value ?? '').trim();

  function answer(id: string): Answer {
    const wrapper = wrapperOf(id);
    if (!wrapper || isHidden(wrapper)) return '';
    const kind = kindOf(wrapper);
    if (kind === 'choice' || kind === 'access') return named(id).find((i) => (i as HTMLInputElement).checked)?.value ?? '';
    if (kind === 'multi') return named(id).filter((i) => (i as HTMLInputElement).checked).map((i) => i.value);
    if (kind === 'tick') return Boolean((named(id)[0] as HTMLInputElement | undefined)?.checked);
    if (kind === 'file') return Array.from((named(id)[0] as HTMLInputElement | undefined)?.files ?? []).map((f) => f.name);
    if (kind === 'group') return groupItems(wrapper).some((item) => itemValues(item).length) ? ['filled'] : [];
    if (kind === 'colour') {
      const input = named(id)[0];
      return input?.dataset.touched ? input.value : '';
    }
    return textOf(id);
  }

  function passes(conditions: When[]): boolean {
    return conditions.every((c) => {
      const v = answer(c.field);
      if (c.is) return typeof v === 'string' && c.is.includes(v);
      if (c.has) return Array.isArray(v) && v.some((x) => c.has!.includes(x));
      if (c.filled) return Array.isArray(v) ? v.length > 0 : v === true || (typeof v === 'string' && v !== '');
      if (c.ticked) return v === true;
      return true;
    });
  }

  /** Apply every show-if rule, in page order, so a hidden answer hides what depends on it. */
  function applyRules(): void {
    form.querySelectorAll<HTMLElement>('[data-show-if]').forEach((el) => {
      el.hidden = !passes(JSON.parse(el.dataset.showIf!) as When[]);
    });
    form.querySelectorAll<HTMLElement>('[data-other-for]').forEach((box) => {
      const id = box.dataset.otherFor!;
      const v = answer(id);
      box.hidden = !(v === 'Other' || (Array.isArray(v) && v.includes('Other')));
    });
  }

  /* ---------- Repeatable groups ---------- */
  const groupItems = (wrapper: HTMLElement) => Array.from(wrapper.querySelectorAll<HTMLElement>('.ob-item'));
  const itemValues = (item: HTMLElement) =>
    Array.from(item.querySelectorAll<Input>('input, textarea'))
      .filter((i) => (i.type === 'color' ? i.dataset.touched : i.value.trim()))
      .map((i) => i.value.trim());

  function addItem(wrapper: HTMLElement, index?: number): HTMLElement | null {
    const template = wrapper.querySelector<HTMLTemplateElement>('template[data-item-template]');
    const holder = wrapper.querySelector<HTMLElement>('.ob-items');
    if (!template || !holder) return null;
    const used = groupItems(wrapper).map((i) => Number(i.dataset.itemIndex));
    const n = index ?? Math.max(-1, ...used) + 1;
    const html = template.innerHTML.replaceAll('__n__', String(n)).replaceAll('__label__', String(groupItems(wrapper).length + 1));
    holder.insertAdjacentHTML('beforeend', html);
    const item = groupItems(wrapper).at(-1)!;
    renumber(wrapper);
    return item;
  }

  function renumber(wrapper: HTMLElement): void {
    const items = groupItems(wrapper);
    items.forEach((item, i) => {
      const label = item.querySelector('.ob-item-label .fig');
      if (label) label.textContent = String(i + 1);
    });
    const add = wrapper.querySelector<HTMLElement>('[data-add]');
    if (add) add.hidden = items.length >= Number(wrapper.dataset.max ?? 99);
  }

  form.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const add = target.closest<HTMLElement>('[data-add]');
    if (add) {
      const wrapper = add.closest<HTMLElement>('.ob-group')!;
      addItem(wrapper)?.querySelector<HTMLElement>('input, textarea')?.focus();
      save();
      return;
    }
    const remove = target.closest<HTMLElement>('[data-remove]');
    if (remove) {
      const wrapper = remove.closest<HTMLElement>('.ob-group')!;
      remove.closest('.ob-item')?.remove();
      renumber(wrapper);
      wrapper.querySelector<HTMLElement>('[data-add]')?.focus();
      save();
      return;
    }
    const goto = target.closest<HTMLElement>('[data-goto]');
    if (goto) show(Number(goto.dataset.goto));
  });

  /* ---------- Files ---------- */
  const fileInputs = () =>
    Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]')).filter((i) => !isHidden(i));
  const sizeMb = (bytes: number) => (bytes / MB < 0.1 ? '0.1' : (bytes / MB).toFixed(1));

  function checkFiles(input: HTMLInputElement): string {
    const wrapper = input.closest<HTMLElement>('.ob-file')!;
    const files = Array.from(input.files ?? []);
    const max = Number(wrapper.dataset.max ?? 1);
    if (files.length > max) return `Choose up to ${max} ${max === 1 ? 'file' : 'files'} here.`;
    const big = files.find((f) => f.size > def.files.maxFileMb * MB);
    if (big) return `${big.name} is over ${def.files.maxFileMb} MB. Put it in a shared folder and paste the link instead.`;
    const all = fileInputs().flatMap((i) => Array.from(i.files ?? []));
    if (all.length > def.files.maxFiles) return `The whole form can carry ${def.files.maxFiles} files. Use a shared-folder link for the rest.`;
    const total = all.reduce((t, f) => t + f.size, 0);
    if (total > def.files.maxTotalMb * MB) return `All the files together come to more than ${def.files.maxTotalMb} MB. Use a shared-folder link for the larger ones.`;
    return '';
  }

  function listFiles(input: HTMLInputElement): void {
    const list = input.closest('.ob-file')?.querySelector('.ob-filelist');
    if (!list) return;
    list.replaceChildren(
      ...Array.from(input.files ?? []).map((f) => {
        const li = document.createElement('li');
        li.append(`${f.name} `);
        const size = document.createElement('span');
        size.className = 'fig';
        size.textContent = `${sizeMb(f.size)} MB`;
        li.append(size);
        return li;
      }),
    );
  }

  /* ---------- Checking a step ---------- */
  function setError(wrapper: HTMLElement, message: string): void {
    const out = Array.from(wrapper.querySelectorAll<HTMLElement>('.field-error')).at(-1);
    if (out) {
      out.textContent = message;
      out.hidden = !message;
    }
    wrapper.querySelectorAll<HTMLElement>('input, textarea').forEach((el) => {
      if (message) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    });
  }

  function problemWith(wrapper: HTMLElement): string {
    const kind = kindOf(wrapper);
    const required = wrapper.hasAttribute('data-required') || wrapper.querySelector('[data-required]') !== null;
    const id = wrapper.dataset.field!;
    if (kind === 'choice' || kind === 'access' || kind === 'multi') {
      const v = answer(id);
      const empty = Array.isArray(v) ? v.length === 0 : v === '';
      if (required && empty) return kind === 'multi' ? 'Choose at least one.' : kind === 'access' ? 'Choose where you are up to.' : 'Choose one.';
      const other = Array.isArray(v) ? v.includes('Other') : v === 'Other';
      if (other && !textOf(`${id}_other`)) return 'Say what "Other" means here.';
      return '';
    }
    if (kind === 'tick') return required && !answer(id) ? 'Tick this to carry on.' : '';
    if (kind === 'group') return required && !(answer(id) as string[]).length ? 'Add at least one.' : '';
    if (kind === 'file') {
      const input = named(id)[0] as HTMLInputElement | undefined;
      return input ? checkFiles(input) : '';
    }
    const input = named(id)[0];
    if (!input) return '';
    const value = input.value.trim();
    if (required && !value) return 'Please fill this in.';
    if (value && kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a full email address.';
    if (value && kind === 'url' && !/\.[a-z]{2,}/i.test(value)) return 'Enter a full web address, such as yourbusiness.com.au.';
    return '';
  }

  /** Check the visible fields of one step. Returns the first that needs attention. */
  function checkStep(step: HTMLElement): HTMLElement | null {
    let first: HTMLElement | null = null;
    step.querySelectorAll<HTMLElement>('.ob-field').forEach((wrapper) => {
      if (isHidden(wrapper) || wrapper.closest('template')) return;
      const message = problemWith(wrapper);
      setError(wrapper, message);
      if (message && !first) first = wrapper;
    });
    return first;
  }

  form.addEventListener('input', (event) => {
    const el = event.target as Input;
    if (el.type === 'color') el.dataset.touched = '1';
    const wrapper = el.closest<HTMLElement>('.ob-field');
    if (wrapper && wrapper.querySelector('[aria-invalid="true"]') && !problemWith(wrapper)) setError(wrapper, '');
    queueSave();
  });
  form.addEventListener('change', (event) => {
    const el = event.target as HTMLInputElement;
    if (el.type === 'file') {
      const message = checkFiles(el);
      setError(el.closest<HTMLElement>('.ob-field')!, message);
      listFiles(el);
    }
    applyRules();
    queueSave();
  });

  /* ---------- Steps ---------- */
  const visibleSteps = () => steps.filter((s) => !s.hidden);
  const isFinal = (step: HTMLElement) => step.dataset.step === 'send';

  function show(index: number, focus = true): void {
    applyRules();
    if (steps[index]?.hidden) index = steps.indexOf(visibleSteps().find((s) => steps.indexOf(s) > index) ?? visibleSteps().at(-1)!);
    current = index;
    const step = steps[index];
    steps.forEach((s, i) => s.classList.toggle('on', i === index));
    const shown = visibleSteps();
    const position = shown.indexOf(step);
    back.hidden = position <= 0;
    next.hidden = isFinal(step);
    send.hidden = !isFinal(step);
    intro.hidden = position > 0;
    status.hidden = true;

    progress.hidden = false;
    progressText.replaceChildren(
      'Step ', fig(String(position + 1)), ' of ', fig(String(shown.length)), `: ${step.querySelector('legend')?.textContent?.replace(/\.$/, '') ?? ''}`,
    );
    strip.replaceChildren(...shown.map((_, i) => {
      const li = document.createElement('li');
      if (i < position) li.className = 'done';
      if (i === position) li.className = 'on';
      return li;
    }));

    if (isFinal(step)) buildReview();
    const date = named('agree_date')[0];
    if (isFinal(step) && date && !date.value) date.value = today();
    if (focus) {
      progress.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
      step.querySelector<HTMLElement>('legend')?.focus({ preventScroll: true });
    }
    save();
  }

  const fig = (text: string) => {
    const span = document.createElement('span');
    span.className = 'fig';
    span.textContent = text;
    return span;
  };

  function goNext(): void {
    const problem = checkStep(steps[current]);
    if (problem) {
      problem.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      problem.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true });
      return;
    }
    const shown = visibleSteps();
    const after = shown[shown.indexOf(steps[current]) + 1];
    if (after) show(steps.indexOf(after));
  }

  function goBack(): void {
    const shown = visibleSteps();
    const before = shown[shown.indexOf(steps[current]) - 1];
    if (before) show(steps.indexOf(before));
  }

  next.addEventListener('click', goNext);
  back.addEventListener('click', goBack);

  /* ---------- Answers, for the review and the email ---------- */
  function answersOf(stepDef: StepDef): { label: string; value: string }[] {
    const out: { label: string; value: string }[] = [];
    for (const f of stepDef.fields) {
      const wrapper = wrapperOf(f.id);
      if (!wrapper || isHidden(wrapper)) continue;
      let value = '';
      if (f.type === 'choice' || f.type === 'multi') {
        const v = answer(f.id);
        const list = (Array.isArray(v) ? v : v ? [v] : []).map((x) => (x === 'Other' ? `Other: ${textOf(`${f.id}_other`)}` : x));
        value = list.join('; ');
      } else if (f.type === 'access') {
        const v = answer(f.id) as string;
        const note = textOf(`${f.id}_note`);
        value = [v, note && `(${note})`].filter(Boolean).join(' ');
      } else if (f.type === 'tick') {
        value = answer(f.id) ? 'Yes' : 'No';
      } else if (f.type === 'file') {
        const names = answer(f.id) as string[];
        value = names.length ? `${names.join(', ')} (attached)` : '';
      } else if (f.type === 'group') {
        value = groupItems(wrapper)
          .map((item, i) => {
            const parts = (f.fields ?? [])
              .map((g) => {
                const input = item.querySelector<Input>(`[name$=".${CSS.escape(g.id)}"]`);
                const v = input ? (input.type === 'color' ? (input.dataset.touched ? input.value : '') : input.value.trim()) : '';
                return v ? `${g.label}: ${v}` : '';
              })
              .filter(Boolean);
            return parts.length ? `${f.item} ${i + 1}: ${parts.join('; ')}` : '';
          })
          .filter(Boolean)
          .join('\n');
      } else {
        value = answer(f.id) as string;
      }
      if (value) out.push({ label: f.label, value });
    }
    return out;
  }

  function buildReview(): void {
    review.replaceChildren(
      ...def.steps
        .map((s) => ({ s, el: steps.find((x) => x.dataset.step === s.id)! }))
        .filter(({ el }) => !el.hidden)
        .map(({ s, el }) => {
          const section = document.createElement('section');
          section.className = 'ob-review-step';
          const head = document.createElement('div');
          head.className = 'ob-review-head';
          const h = document.createElement('h3');
          h.className = 'display-s';
          h.textContent = s.title;
          const change = document.createElement('button');
          change.type = 'button';
          change.className = 'ob-link';
          change.dataset.goto = String(steps.indexOf(el));
          change.textContent = `Change ${s.title.toLowerCase()}`;
          head.append(h, change);
          const dl = document.createElement('dl');
          const answers = answersOf(s);
          if (!answers.length) {
            const p = document.createElement('p');
            p.className = 'body-s ob-muted';
            p.textContent = 'Nothing entered.';
            section.append(head, p);
            return section;
          }
          for (const a of answers) {
            const row = document.createElement('div');
            const dt = document.createElement('dt');
            dt.textContent = a.label;
            const dd = document.createElement('dd');
            dd.textContent = a.value;
            row.append(dt, dd);
            dl.append(row);
          }
          section.append(head, dl);
          return section;
        }),
    );
  }

  /* ---------- Keeping answers on this device ---------- */
  let saveTimer = 0;
  const queueSave = () => {
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(save, 400);
  };

  function save(): void {
    const data: Record<string, string | string[]> = {};
    for (const el of Array.from(form.elements) as Input[]) {
      if (!el.name || el.type === 'file' || el.name === '_gotcha' || el.closest('template')) continue;
      if (el.type === 'radio' || el.type === 'checkbox') {
        if ((el as HTMLInputElement).checked) data[el.name] = el.type === 'radio' ? el.value : [...((data[el.name] as string[]) ?? []), el.value];
      } else if (el.type === 'color') {
        if (el.dataset.touched) data[el.name] = el.value;
      } else if (el.value) {
        data[el.name] = el.value;
      }
    }
    const groups: Record<string, number[]> = {};
    form.querySelectorAll<HTMLElement>('.ob-group').forEach((g) => (groups[g.dataset.field!] = groupItems(g).map((i) => Number(i.dataset.itemIndex))));
    try {
      localStorage.setItem(storeKey, JSON.stringify({ at: Date.now(), step: steps[current]?.dataset.step, data, groups }));
    } catch {
      /* Private browsing or storage turned off: the form still works, it just cannot be resumed. */
    }
  }

  function restore(): boolean {
    let saved: { at: number; step?: string; data: Record<string, string | string[]>; groups: Record<string, number[]> } | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(storeKey) ?? 'null');
    } catch {
      saved = null;
    }
    if (!saved || !saved.data || !Object.keys(saved.data).length) return false;
    for (const [id, indexes] of Object.entries(saved.groups ?? {})) {
      const wrapper = wrapperOf(id);
      if (!wrapper) continue;
      for (const n of indexes) if (!groupItems(wrapper).some((i) => Number(i.dataset.itemIndex) === n)) addItem(wrapper, n);
    }
    for (const [name, value] of Object.entries(saved.data)) {
      for (const el of named(name)) {
        if (el.type === 'radio' || el.type === 'checkbox') (el as HTMLInputElement).checked = Array.isArray(value) ? value.includes(el.value) : value === el.value;
        else {
          el.value = String(value);
          if (el.type === 'color') el.dataset.touched = '1';
        }
      }
    }
    applyRules();
    const when = new Date(saved.at);
    const resume = root.querySelector<HTMLElement>('[data-resume]');
    const text = root.querySelector<HTMLElement>('[data-resume-text]');
    if (resume && text) {
      text.textContent = `Your answers from ${when.toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })} at ${when.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })} are back. Add any files again before you send. `;
      resume.hidden = false;
    }
    const at = steps.findIndex((s) => s.dataset.step === saved!.step);
    show(at >= 0 ? at : 0, false);
    return true;
  }

  root.querySelector('[data-restart]')?.addEventListener('click', () => {
    try {
      localStorage.removeItem(storeKey);
    } catch {
      /* nothing kept */
    }
    location.reload();
  });

  /* ---------- Sending ---------- */
  function busy(on: boolean, label = 'Sending'): void {
    sending = on;
    send.disabled = on;
    send.setAttribute('aria-busy', String(on));
    send.textContent = on ? label : (send.dataset.label ?? 'Send');
  }

  function fail(message: string): void {
    status.textContent = message;
    status.hidden = false;
    status.scrollIntoView({ block: 'nearest' });
  }

  /** The time and address the acceptance came from, recorded by the site's Worker. */
  async function stamp(): Promise<{ at?: string; ip?: string }> {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const response = await fetch('/api/stamp', { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(timer);
      return response.ok ? await response.json() : {};
    } catch {
      return {};
    }
  }

  function payload(meta: { at?: string; ip?: string }): FormData {
    const data = new FormData();
    const business = textOf('business_name');
    const contact = textOf('contact_name');
    data.set('_subject', `Onboarding: ${def.name}${business ? `, ${business}` : ''}`);
    data.set('Service', def.name);
    if (business) data.set('Business', business);
    if (contact) data.set('Contact', contact);
    const email = textOf('contact_email');
    if (email) data.set('email', email);
    const phone = textOf('contact_phone');
    if (phone) data.set('Phone', phone);

    const access = def.steps
      .flatMap((s) => s.fields.filter((f) => f.type === 'access'))
      .filter((f) => !isHidden(wrapperOf(f.id)!))
      .map((f) => `${f.label}: ${answer(f.id) || 'Not answered'}${textOf(`${f.id}_note`) ? ` (${textOf(`${f.id}_note`)})` : ''}`);
    if (access.length) data.set('Access checklist', access.join('\n'));

    def.steps.forEach((s, i) => {
      const el = steps.find((x) => x.dataset.step === s.id);
      if (!el || el.hidden) return;
      const answers = answersOf(s);
      if (!answers.length) return;
      data.set(`${String(i + 1).padStart(2, '0')}. ${s.title}`, answers.map((a) => `${a.label}\n  ${a.value.replace(/\n/g, '\n  ')}`).join('\n\n'));
    });

    data.set('Agreement', 'Accepted');
    data.set('Accepted by', [textOf('agree_name'), textOf('agree_position')].filter(Boolean).join(', '));
    data.set('Agreement date', textOf('agree_date'));
    const sentAt = new Date(meta.at ?? Date.now());
    const brisbane = sentAt.toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    data.set('Sent at', `${brisbane} AEST (${sentAt.toISOString()})`);
    data.set('Sent from', meta.ip ? `IP address ${meta.ip}` : 'Not recorded');
    data.set('Terms version', def.termsVersion);
    data.set('Terms', def.terms.join('\n'));

    for (const s of def.steps) {
      for (const f of s.fields) {
        if (f.type !== 'file') continue;
        const input = named(f.id)[0] as HTMLInputElement | undefined;
        if (!input || isHidden(input)) continue;
        Array.from(input.files ?? []).forEach((file, k) => data.append(`${f.label} ${k + 1}`, file, file.name));
      }
    }
    data.set('Page', location.pathname);
    return data;
  }

  /** Answers that look like a password. The form never asks for one. */
  function secretsTyped(): string[] {
    const found: string[] = [];
    for (const el of Array.from(form.querySelectorAll<Input>('input[type="text"], input:not([type]), textarea'))) {
      if (isHidden(el) || el.closest('template') || !SECRET.test(el.value)) continue;
      const label = el.closest('.field')?.querySelector('label, legend')?.textContent?.replace(/\s*optional$/, '').trim();
      if (label) found.push(label);
    }
    return found;
  }

  function finish(): void {
    try {
      localStorage.removeItem(storeKey);
    } catch {
      /* nothing kept */
    }
    form.hidden = true;
    progress.hidden = true;
    intro.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
    done.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isFinal(steps[current])) {
      goNext();
      return;
    }
    if (sending) return;
    status.hidden = true;
    const problem = checkStep(steps[current]);
    if (problem) {
      problem.querySelector<HTMLElement>('input, textarea')?.focus();
      return;
    }
    const secrets = secretsTyped();
    if (secrets.length) {
      fail(`It looks like a password has been typed into: ${secrets.join('; ')}. Please take it out before sending. We never need your passwords; we tell you how to give us access instead.`);
      return;
    }
    if ((form.querySelector<HTMLInputElement>('[name="_gotcha"]')?.value ?? '') !== '') {
      finish();
      return;
    }
    const files = fileInputs().flatMap((i) => Array.from(i.files ?? []));
    busy(true, files.length ? `Sending ${files.length} ${files.length === 1 ? 'file' : 'files'}` : 'Sending');
    try {
      const data = payload(await stamp());
      if (!def.live) {
        data.set('g-recaptcha-response', '(a reCAPTCHA v3 token for the action "onboarding" goes here)');
        console.info(
          '[KEYSTROKE onboarding: development mode] Nothing was sent. With forms.formspreeOnboardId set in site.json, this would POST to https://formspree.io/f/{formspreeOnboardId}:',
          Object.fromEntries(Array.from(data.entries()).map(([k, v]) => [k, v instanceof File ? `(file) ${v.name}, ${sizeMb(v.size)} MB` : v])),
        );
        await new Promise((ok) => setTimeout(ok, 400));
        finish();
        return;
      }
      data.set('g-recaptcha-response', await tokenFor('onboarding'));
      const response = await fetch(`https://formspree.io/f/${def.formId}`, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Formspree answered ${response.status}`);
      finish();
    } catch (err) {
      console.warn('The onboarding form did not send.', err);
      busy(false);
      fail(
        `That did not send. Nothing you entered has been lost. Try again in a minute${files.length ? ', or take the files off and paste a shared-folder link instead' : ''}. If it keeps failing, reply to the email we sent you with this link.`,
      );
    }
  });

  /* ---------- Start ---------- */
  form.querySelectorAll<HTMLElement>('.ob-group').forEach(renumber);
  applyRules();
  if (!restore()) show(0, false);
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
