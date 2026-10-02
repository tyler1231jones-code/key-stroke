// The counting page: recompute the accrued column and the total on load, so
// the table states today's figures even if the page was built on another day.
import { site, ledger, homepageTotal, rowAccrued } from '../lib/data';
import { dateInZone } from '../lib/ledger';
import { dateShort, num } from '../lib/format';
import { counter } from './counter';

const today = dateInZone(site.timezone);
const built = document.querySelector<HTMLMetaElement>('meta[name="ks-build-date"]')?.content;
if (today !== built) {
  document.querySelectorAll<HTMLElement>('[data-as-at]').forEach((el) => (el.textContent = dateShort(today)));
  document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => (el.textContent = today.slice(0, 4)));
  for (const row of ledger) {
    const cell = document.querySelector<HTMLElement>(`[data-accrued="${row.id}"]`);
    if (cell) cell.textContent = num(rowAccrued(row, today));
  }
  const total = document.getElementById('ledger-total');
  if (total) counter(total).show(homepageTotal(today).today);
}
document.documentElement.classList.add('run');
