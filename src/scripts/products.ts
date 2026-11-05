// /products: the filter row. Without script every group shows and the row is
// plain links that jump to each group (#count, #clear, #build, #face). With
// script a link shows that group alone; /products#clear opens with Clear
// chosen and scrolled to. #all, or no hash, shows everything.
import './page';

const groups = Array.from(document.querySelectorAll<HTMLElement>('.pgroup[id]'));
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-filter]'));
const status = document.getElementById('prod-status');
const ids = new Set(groups.map((g) => g.id));

function show(value: string, scroll: boolean): void {
  const one = ids.has(value) ? value : 'all';
  groups.forEach((g) => (g.hidden = one !== 'all' && g.id !== one));
  links.forEach((l) => (l.dataset.filter === one ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
  if (status) {
    const n = groups.filter((g) => !g.hidden).reduce((t, g) => t + g.querySelectorAll('.pcard').length, 0);
    status.textContent = `${n} products shown.`;
  }
  if (scroll && one !== 'all') document.getElementById(one)?.scrollIntoView({ block: 'start' });
}

if (groups.length) {
  links.forEach((link) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const value = link.dataset.filter ?? 'all';
      history.replaceState(null, '', value === 'all' ? location.pathname : `#${value}`);
      show(value, false);
    }),
  );
  window.addEventListener('hashchange', () => show(location.hash.slice(1), true));
  show(location.hash.slice(1), Boolean(location.hash));
}
