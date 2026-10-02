// The cases pages. On the list: one row of filters by service. On a case:
// the artefact runs once, as it comes into view.
import { gsap } from 'gsap';
import { refreshFigures } from './live';
import { initSite } from './site';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Filter ---------- */
function initFilter(): void {
  const bar = document.getElementById('case-filter');
  const list = document.getElementById('case-list');
  if (!bar || !list) return;
  const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-service]'));
  const chips = Array.from(bar.querySelectorAll<HTMLButtonElement>('[data-value]'));
  const status = document.getElementById('filter-status');

  function show(value: string, announce: boolean): void {
    let shown = 0;
    cards.forEach((card) => {
      const on = value === 'all' || card.dataset.service === value;
      card.hidden = !on;
      if (on) shown++;
    });
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.value === value)));
    if (announce && status) status.textContent = `${shown} ${shown === 1 ? 'case' : 'cases'} shown.`;
  }

  bar.addEventListener('click', (event) => {
    const chip = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-value]');
    if (!chip) return;
    const value = chip.dataset.value ?? 'all';
    show(value, true);
    const url = new URL(location.href);
    if (value === 'all') url.searchParams.delete('service');
    else url.searchParams.set('service', value);
    history.replaceState(null, '', url);
  });

  // Service pages link here with their service already chosen.
  const wanted = new URLSearchParams(location.search).get('service');
  if (wanted && chips.some((chip) => chip.dataset.value === wanted)) show(wanted, false);
}

/* ---------- Artefact ---------- */
function typeOn(el: HTMLElement): void {
  const chars = Math.max(1, (el.textContent ?? '').length);
  el.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: chars * 24, easing: `steps(${chars})` });
}

/** Reveal an artefact's steps in order: the thing running. Once. */
function initArtefact(art: HTMLElement): void {
  if (reduced || !('IntersectionObserver' in window)) return;
  const els = Array.from(art.querySelectorAll<HTMLElement>('[data-step]'));
  if (!els.length) return;
  const steps = els.map((el) => Number(el.dataset.step));
  const max = Math.max(...steps);
  els.forEach((el) => el.classList.add('is-off'));
  const o = { n: 0 };
  let last = 0;
  const run = gsap.to(o, {
    n: max,
    duration: max * 0.07,
    ease: `steps(${max})`,
    paused: true,
    onUpdate: () => {
      const n = Math.round(o.n);
      if (n === last) return;
      last = n;
      els.forEach((el, i) => {
        if (steps[i] > n || !el.classList.contains('is-off')) return;
        el.classList.remove('is-off');
        if (el.hasAttribute('data-type')) typeOn(el);
      });
    },
  });
  const seen = new IntersectionObserver(
    (records) => {
      if (!records.some((r) => r.isIntersecting)) return;
      run.play();
      seen.disconnect();
    },
    { rootMargin: '0px 0px -20% 0px' },
  );
  seen.observe(art);
}

refreshFigures();
initFilter();
document.querySelectorAll<HTMLElement>('.artefact').forEach(initArtefact);
initSite();
document.documentElement.classList.add('run');
