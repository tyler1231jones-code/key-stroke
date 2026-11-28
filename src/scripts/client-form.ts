// A client form (/onboard/client/#<id>). Asks for the passcode, sends it with
// the id to the Worker (POST /api/client), and draws the form that comes
// back. From there the form works exactly as a service form does
// (onboard.ts): steps, the draft kept on this device, the review, the send.
//
// Nothing about the client is in this script or the page; it arrives only
// with the right passcode, and is held in memory, not stored.
import { init } from './onboard';
import { definitionOf, fig, steps, type Settings } from '../onboarding/render';
import type { ClientForm } from '../onboarding/types';

const page = document.querySelector<HTMLElement>('[data-client-form]');
const settingsEl = document.getElementById('ob-client-settings');
if (page && settingsEl?.textContent) start(page, JSON.parse(settingsEl.textContent) as Settings);

function start(page: HTMLElement, settings: Settings): void {
  const lock = page.querySelector<HTMLElement>('[data-lock]')!;
  const lockForm = lock.querySelector<HTMLFormElement>('[data-lock-form]')!;
  const passcode = lockForm.querySelector<HTMLInputElement>('input[name="passcode"]')!;
  const button = lockForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const status = lockForm.querySelector<HTMLElement>('[data-lock-status]')!;
  const id = decodeURIComponent(location.hash.slice(1)).trim();

  const say = (message: string) => {
    status.textContent = message;
    status.hidden = !message;
    if (message) passcode.setAttribute('aria-invalid', 'true');
    else passcode.removeAttribute('aria-invalid');
  };

  if (!/^[a-z0-9-]{6,64}$/.test(id)) {
    lockForm.hidden = true;
    const p = document.createElement('p');
    p.className = 'body';
    p.textContent = 'This link is missing its last part. Open the link from our email again, the whole of it.';
    lock.prepend(p);
    return;
  }

  lockForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const typed = passcode.value.trim();
    if (!typed) {
      say('Enter the passcode from our email.');
      passcode.focus();
      return;
    }
    say('');
    button.disabled = true;
    button.textContent = 'Opening';
    try {
      const response = await fetch('/api/client', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, passcode: typed }),
        cache: 'no-store',
      });
      if (response.ok) {
        const { form } = (await response.json()) as { form: ClientForm };
        open(page, form, settings);
        return;
      }
      say(
        response.status === 403
          ? 'That passcode does not match this form. Check it against our email and try again.'
          : response.status === 429
            ? 'That is a lot of tries in a short time. Wait a minute, then try again.'
            : 'The form cannot open just now. Try again in a few minutes, or reply to our email.',
      );
    } catch {
      say('The form cannot open just now. Check your connection and try again.');
    }
    button.disabled = false;
    button.textContent = button.dataset.label ?? 'Open the form';
    passcode.focus();
  });
}

/** Draw the opened form into the page and start it. */
function open(page: HTMLElement, form: ClientForm, settings: Settings): void {
  const root = page.querySelector<HTMLElement>('[data-onboard]')!;
  const accessEmail = form.accessEmail ?? settings.accessEmail;
  const text = (sel: string, value: string) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) el.textContent = value;
  };

  text('[data-byline]', form.byline);
  text('[data-title]', `${form.name}.`);
  text('[data-summary]', form.summary);
  document.title = `${form.client}: onboarding`;
  if (form.brand?.accent) page.style.setProperty('--client-accent', form.brand.accent);
  if (form.brand?.logo?.startsWith('data:image/')) {
    const img = document.createElement('img');
    img.className = 'ob-client-logo';
    img.src = form.brand.logo;
    img.alt = form.brand.logoAlt ?? form.client;
    document.querySelector('[data-byline]')?.before(img);
  }

  root.querySelector<HTMLElement>('[data-time]')!.innerHTML = fig(form.time);
  root.querySelector<HTMLElement>('[data-bring]')!.replaceChildren(
    ...form.bring.map((b) => {
      const li = document.createElement('li');
      li.textContent = b;
      return li;
    }),
  );
  root.querySelector<HTMLElement>('[data-steps]')!.outerHTML = steps(form, accessEmail, settings.files);
  if (!form.agreement) {
    root.querySelector('[data-agreement]')?.remove();
  } else {
    text('[data-final-intro]', 'Read through your answers. Change anything that is wrong, then accept the terms and send.');
  }
  const next = root.querySelector<HTMLElement>('[data-next-list]')!;
  if (form.next.length === 1) {
    const p = document.createElement('p');
    p.className = 'body';
    p.textContent = form.next[0];
    next.replaceChildren(p);
  } else {
    const ol = document.createElement('ol');
    ol.className = 'ticks';
    ol.append(...form.next.map((n) => Object.assign(document.createElement('li'), { textContent: n })));
    next.replaceChildren(ol);
  }
  const formEl = root.querySelector<HTMLFormElement>('[data-onboard-form]')!;
  if (settings.live) formEl.action = `https://formspree.io/f/${settings.formId}`;

  page.querySelector<HTMLElement>('[data-lock]')!.remove();
  root.hidden = false;
  init(root, definitionOf(form, settings));
  root.querySelector<HTMLElement>('.ob-step.on legend, .ob-step:not([hidden]) legend')?.focus({ preventScroll: true });
}
