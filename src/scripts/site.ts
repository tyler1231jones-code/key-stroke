// What every page shares below its first screen: blocks arrive with a quiet
// reveal as they enter the viewport, and figures roll into place. Both play
// once and are not undone on the way back up. With reduced motion, or
// without this script, every block and figure is simply there.
import { counter } from './counter';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Mark blocks that are still below the fold, and let each rise in when it is reached. */
export function initReveal(root: ParentNode = document): void {
  if (reduced || !('IntersectionObserver' in window)) return;
  const below = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight * 0.94,
  );
  if (!below.length) return;
  const seen = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        if (!record.isIntersecting) continue;
        record.target.classList.remove('pre');
        seen.unobserve(record.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px' },
  );
  below.forEach((el) => {
    el.classList.add('pre');
    seen.observe(el);
  });
}

/**
 * Counters marked data-roll settle on their figure when they come into view.
 * data-from gives a figure to roll from (a case's before figure); without it
 * the cells start blank. data-roll="spin" passes a few digits on the way.
 */
export function initRolls(root: ParentNode = document): void {
  if (reduced || !('IntersectionObserver' in window)) return;
  const targets = new Map<Element, () => void>();
  const seen = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        if (!record.isIntersecting) continue;
        targets.get(record.target)?.();
        targets.delete(record.target);
        seen.unobserve(record.target);
      }
    },
    { rootMargin: '0px 0px -14% 0px' },
  );
  root.querySelectorAll<HTMLElement>('.ctr[data-roll]').forEach((el) => {
    const c = counter(el);
    const value = c.value;
    if (value === null) return;
    const from = el.dataset.from === undefined ? null : Number(el.dataset.from);
    const spin = el.dataset.roll === 'spin' ? 2 : 0;
    c.show(from);
    targets.set(el, () => c.roll(value, { dir: 1, spin }));
    seen.observe(el);
  });
}

export function initSite(): void {
  initRolls();
  initReveal();
}
