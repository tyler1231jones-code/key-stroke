// Run again on load: the homepage counter and every running total are
// computed from the ledger at build time for the HTML and again here, so a
// page built yesterday still states today's figure. Also decides the running
// mark, which is never shown while a unit's data is demo.
import { site, crew, ledger, homepageTotal, unitTotal } from '../lib/data';
import { dateInZone } from '../lib/ledger';
import { dateShort, num } from '../lib/format';
import { isRunning } from '../lib/crew';
import { counter } from './counter';

export interface LiveFigures {
  today: number;
  weekAgo: number;
}

export function refreshFigures(): LiveFigures | null {
  const today = dateInZone(site.timezone);
  const built = document.querySelector<HTMLMetaElement>('meta[name="ks-build-date"]')?.content;

  if (today !== built) {
    document.querySelectorAll<HTMLElement>('[data-as-at]').forEach((el) => (el.textContent = dateShort(today)));
    document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => (el.textContent = today.slice(0, 4)));
    document.querySelectorAll<HTMLElement>('[data-unit-total]').forEach((el) => {
      counter(el).show(unitTotal(el.dataset.unitTotal ?? '', today).value);
    });
  }

  // The running mark: a 9px square, shown only while a unit is actually running.
  const running = crew.filter((u) => isRunning(u, site.timezone));
  document.querySelectorAll<HTMLElement>('.crew-card').forEach((card) => {
    const on = running.some((u) => u.unit === card.dataset.unit);
    card.querySelector('.crew-live')?.classList.toggle('is-running', on);
  });
  document.querySelector('[data-any-unit]')?.classList.toggle('is-running', running.length > 0);

  const home = document.getElementById('home-counter');
  if (!home || ledger.length === 0) return null;
  const figures = homepageTotal(today);
  if (today !== built) {
    counter(home).show(figures.today);
    home.dataset.weekAgo = String(figures.weekAgo);
    const delta = document.getElementById('home-delta');
    if (delta) delta.textContent = `− ${num(figures.today - figures.weekAgo)}`;
  }
  return { today: figures.today, weekAgo: figures.weekAgo };
}
