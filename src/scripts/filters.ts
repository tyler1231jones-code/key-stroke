// The showcase filter. Two rows, practice and business type. Filtering
// reorders on rails and never empties the list: matching cases move to the
// front, everything else follows in its usual order.
import { gsap, ScrollTrigger, reduced, scrollToEl, ROLL } from './motion';
import { bus } from './bus';

type Key = 'practice' | 'type';

export function initFilters(): void {
  const list = document.getElementById('case-list');
  const bar = document.getElementById('filters');
  if (!list || !bar) return;
  const cases = Array.from(list.querySelectorAll<HTMLElement>('.case'));
  const quiz = document.getElementById('quiz-line');
  const status = document.getElementById('filter-status');
  const original = new Map(cases.map((el, i) => [el, i]));
  const state: Record<Key, string> = { practice: 'all', type: 'all' };
  let flip: gsap.core.Tween | null = null;

  const score = (el: HTMLElement) => {
    const p = state.practice === 'all' || el.dataset.practice === state.practice;
    const t = state.type === 'all' || el.dataset.type === state.type;
    return (p && t ? 0 : p || t ? 1 : 2) * 100 + (original.get(el) ?? 0);
  };

  function apply(animate: boolean): void {
    const order = [...cases].sort((a, b) => score(a) - score(b));
    const moved = order.some((el, i) => el !== currentOrder()[i]);
    if (!moved) return;

    flip?.progress(1);
    const before = new Map(cases.map((el) => [el, el.getBoundingClientRect().top + window.scrollY]));
    order.forEach((el, i) => {
      if (quiz && i === Math.min(4, order.length)) list!.appendChild(quiz);
      list!.appendChild(el);
    });
    if (quiz && order.length <= 4) list!.appendChild(quiz);
    ScrollTrigger.refresh();

    // Bring the front of the list under the filter bar, then let every case
    // travel along the rail from where it was to where it now belongs.
    const barBottom = bar!.getBoundingClientRect().bottom;
    const listTop = list!.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > listTop - barBottom) scrollToEl(listTop - barBottom, true);

    if (animate && !reduced) {
      const deltas = cases.map((el) => (before.get(el) ?? 0) - (el.getBoundingClientRect().top + window.scrollY));
      const o = { t: 1 };
      flip = gsap.to(o, {
        t: 0,
        duration: ROLL * 3,
        ease: 'none',
        onUpdate: () => {
          cases.forEach((el, i) => {
            el.style.transform = o.t === 0 ? '' : `translate3d(0, ${Math.max(-1.2 * innerHeight, Math.min(1.2 * innerHeight, deltas[i])) * o.t}px, 0)`;
          });
          bus.invalidate();
        },
        onComplete: () => {
          cases.forEach((el) => (el.style.transform = ''));
          flip = null;
        },
      });
    }
    if (status) {
      const front = order.filter((el) => score(el) < 100).length;
      status.textContent = state.practice === 'all' && state.type === 'all' ? 'Cases in their usual order.' : `${front} matching cases moved to the front. No case is hidden.`;
    }
  }

  function currentOrder(): HTMLElement[] {
    return Array.from(list!.querySelectorAll<HTMLElement>('.case'));
  }

  function press(key: Key, value: string, animate = true): void {
    state[key] = value;
    bar!.querySelectorAll<HTMLButtonElement>(`[data-filter="${key}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.value === value));
    });
    apply(animate);
  }

  bar.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-filter]');
    if (!btn) return;
    press(btn.dataset.filter as Key, btn.dataset.value ?? 'all');
  });

  // The quiz returns visitors here with their business type already chosen.
  const params = new URLSearchParams(location.search);
  for (const key of ['practice', 'type'] as Key[]) {
    const value = params.get(key);
    if (value && bar.querySelector(`[data-filter="${key}"][data-value="${CSS.escape(value)}"]`)) press(key, value, false);
  }
}
