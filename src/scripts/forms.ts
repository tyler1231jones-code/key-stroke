// Every enquiry form on the site. One submission works like this:
//
//   1. Validate in the page, with a message beside each field that needs one.
//   2. Ask reCAPTCHA v3 for a token, at submit time (a token lasts two
//      minutes), with an action named after the form.
//   3. POST to https://formspree.io/f/{id} with Accept: application/json and
//      the token in a field named g-recaptcha-response.
//   4. Show the result in place: a sending state on the button, then the
//      thank-you, or an error that keeps what was typed.
//
// The reCAPTCHA script is not part of any page load. It is fetched when a
// form comes near the viewport or takes focus.
//
// Development mode: while either Formspree id or the reCAPTCHA site key is
// still TODO in site.json, nothing is sent. The form validates, prints the
// payload it would have sent to the console, and shows the thank-you.
import { forms } from '../lib/data';

interface Grecaptcha {
  ready(cb: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
}
declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let recaptcha: Promise<void> | null = null;

/** Fetch the reCAPTCHA script once, the first time a form is approached. */
function loadRecaptcha(): Promise<void> {
  if (!forms.ready) return Promise.resolve();
  if (!recaptcha) {
    recaptcha = new Promise<void>((ok, fail) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(forms.recaptchaSiteKey)}`;
      script.async = true;
      script.onload = () => ok();
      script.onerror = () => {
        recaptcha = null; // let the next attempt try again
        fail(new Error('reCAPTCHA did not load'));
      };
      document.head.appendChild(script);
    });
  }
  return recaptcha;
}

async function tokenFor(action: string): Promise<string> {
  await loadRecaptcha();
  const g = window.grecaptcha;
  if (!g) throw new Error('reCAPTCHA is not available');
  return new Promise<string>((ok, fail) => g.ready(() => g.execute(forms.recaptchaSiteKey, { action }).then(ok, fail)));
}

/* ---------- Validation ---------- */
type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function errorOf(field: Field): HTMLElement | null {
  const id = field.getAttribute('aria-describedby');
  return id ? document.getElementById(id) : null;
}

function setError(field: Field, message: string): void {
  const out = errorOf(field);
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
  if (out) {
    out.textContent = message;
    out.hidden = !message;
  }
}

/** Check every required field. Returns the first one that needs attention. */
function validate(form: HTMLFormElement): Field | null {
  let first: Field | null = null;
  form.querySelectorAll<Field>('input[required], select[required], textarea[required]').forEach((field) => {
    field.value = field.value.trim();
    const ok = field.checkValidity();
    setError(field, ok ? '' : (field.dataset.error ?? 'Check this field.'));
    if (!ok && !first) first = field;
  });
  return first;
}

/* ---------- One form ---------- */
function wire(form: HTMLFormElement): void {
  const wrap = form.closest<HTMLElement>('[data-form-wrap]');
  const button = form.querySelector<HTMLButtonElement>('.form-submit');
  const status = form.querySelector<HTMLElement>('.form-status');
  const thanks = wrap?.querySelector<HTMLElement>('.form-thanks');
  const action = form.dataset.form ?? 'consultation';
  if (!button) return;
  let sending = false;

  // A message goes as soon as the field is put right.
  form.addEventListener('input', (event) => {
    const field = event.target as Field;
    if (field.getAttribute('aria-invalid') === 'true' && field.checkValidity()) setError(field, '');
  });

  // reCAPTCHA is fetched when the form is approached or touched, not before.
  const approach = () => {
    loadRecaptcha().catch(() => {});
    near?.disconnect();
  };
  const near = 'IntersectionObserver' in window ? new IntersectionObserver((records) => records.some((r) => r.isIntersecting) && approach(), { rootMargin: '600px 0px' }) : null;
  near?.observe(form);
  form.addEventListener('focusin', approach, { once: true });

  const busy = (on: boolean) => {
    sending = on;
    button.disabled = on;
    button.setAttribute('aria-busy', String(on));
    button.textContent = on ? 'Sending' : (button.dataset.label ?? 'Send');
  };

  const done = () => {
    form.hidden = true;
    if (thanks) {
      thanks.hidden = false;
      thanks.focus({ preventScroll: true });
      thanks.scrollIntoView({ block: 'nearest' });
    }
    form.dispatchEvent(new CustomEvent('ks:sent', { bubbles: true, detail: { form: action } }));
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    if (status) status.hidden = true;
    const invalid = validate(form);
    if (invalid) {
      invalid.focus();
      return;
    }
    const data = new FormData(form);
    // A filled honeypot is a bot. Say thank you and send nothing.
    if (data.get('_gotcha')) {
      done();
      return;
    }
    busy(true);
    try {
      if (!forms.ready) {
        data.set('g-recaptcha-response', `(a reCAPTCHA v3 token for the action "${action}" goes here)`);
        console.info(
          `[KEYSTROKE form: development mode] Nothing was sent. With the Formspree ids and the reCAPTCHA site key set in site.json, this would POST to https://formspree.io/f/{${action === 'quiz' ? 'formspreeQuizId' : 'formspreeContactId'}} with Accept: application/json:`,
          Object.fromEntries(data.entries()),
        );
        await new Promise((ok) => setTimeout(ok, 400));
        done();
        return;
      }
      data.set('g-recaptcha-response', await tokenFor(action));
      const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Formspree answered ${response.status}`);
      done();
    } catch (err) {
      console.warn('The form did not send.', err);
      busy(false);
      if (status) {
        status.hidden = false;
        status.scrollIntoView({ block: 'nearest' });
      }
      return;
    }
    busy(false);
  });
}

/** Arriving from a service page: /contact?service=automation chooses that service. */
function preselect(): void {
  const wanted = new URLSearchParams(location.search).get('service');
  if (!wanted) return;
  document.querySelectorAll<HTMLSelectElement>('form[data-form] select[name="service"]').forEach((select) => {
    const option = Array.from(select.options).find((o) => o.dataset.id === wanted);
    if (option) select.value = option.value;
  });
}

/** On the Savers page, a plan's button starts an enquiry about that plan. */
function plans(): void {
  document.querySelectorAll<HTMLElement>('[data-plan]').forEach((button) => {
    button.addEventListener('click', () => {
      const plan = button.dataset.plan ?? '';
      document.querySelectorAll<HTMLInputElement>('form[data-form] input[name="plan"]').forEach((field) => (field.value = plan));
      const note = document.querySelector<HTMLElement>('[data-plan-note]');
      if (note) note.textContent = `You are asking about the ${plan} plan. Tell us what we built for you, or what you want built.`;
    });
  });
}

export function initForms(): void {
  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach(wire);
  preselect();
  plans();
}
