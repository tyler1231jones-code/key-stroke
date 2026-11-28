// /blog: one row of filters by kind of post. A post's kind link
// (/blog?kind=guides) opens the list with that kind chosen.
import { initSite } from './site';

function initFilter(): void {
  const bar = document.getElementById('post-filter');
  const list = document.getElementById('post-list');
  if (!bar || !list) return;
  const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-category]'));
  const chips = Array.from(bar.querySelectorAll<HTMLButtonElement>('[data-value]'));
  const status = document.getElementById('filter-status');

  function show(value: string, announce: boolean): void {
    let shown = 0;
    rows.forEach((row) => {
      const on = value === 'all' || row.dataset.category === value;
      row.hidden = !on;
      if (on) shown++;
    });
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.value === value)));
    if (announce && status) status.textContent = `${shown} ${shown === 1 ? 'post' : 'posts'} shown.`;
  }

  bar.addEventListener('click', (event) => {
    const chip = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-value]');
    if (!chip) return;
    const value = chip.dataset.value ?? 'all';
    show(value, true);
    const url = new URL(location.href);
    if (value === 'all') url.searchParams.delete('kind');
    else url.searchParams.set('kind', value);
    history.replaceState(null, '', url);
  });

  const wanted = new URLSearchParams(location.search).get('kind');
  if (wanted && chips.some((chip) => chip.dataset.value === wanted)) show(wanted, false);
}

initFilter();
initSite();
document.documentElement.classList.add('run');
