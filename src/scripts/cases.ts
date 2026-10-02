// A case entering the viewport: the counter rolls from the before figure to
// the after figure, the before/after line appears with its baseline struck,
// the tally bar strikes from the left at 60ms a segment, and the artefact
// runs. Scrolling back above the line undoes all of it.
import { ScrollTrigger, reduced, onPass, stepper, STROKE } from './motion';
import { counter } from './counter';
import { bus } from './bus';

const STEP = 0.07;

function typeOn(el: HTMLElement): void {
  const chars = Math.max(1, (el.textContent ?? '').length);
  el.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
    duration: chars * 24,
    easing: `steps(${chars})`,
  });
}

/** Reveal an artefact's steps in order: the thing running. */
export function initArtefact(art: HTMLElement | null): void {
  if (!art || reduced) return;
  const els = Array.from(art.querySelectorAll<HTMLElement>('[data-step]'));
  if (!els.length) return;
  const steps = els.map((el) => Number(el.dataset.step));
  const max = Math.max(...steps);
  els.forEach((el) => el.classList.add('is-off'));
  const run = stepper(max, STEP, (n) => {
    els.forEach((el, i) => {
      const show = steps[i] <= n;
      if (show && el.classList.contains('is-off') && el.hasAttribute('data-type')) typeOn(el);
      el.classList.toggle('is-off', !show);
    });
  });
  onPass(art, '74%', () => run.play(), () => run.reverse());
}

export function initCase(el: HTMLElement): void {
  const id = el.dataset.case ?? '';
  // Scene progress: the case's pass through the viewport, for the object behind it.
  ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      bus.cases[id] = self.progress;
      bus.invalidate();
    },
    onRefresh: (self) => {
      bus.cases[id] = self.progress;
    },
  });
  if (reduced) {
    bus.cases[id] = 0.5;
    return;
  }

  const before = Number(el.dataset.before);
  const after = Number(el.dataset.after);
  const ctrEl = el.querySelector<HTMLElement>('.ctr[data-roll="case"]');
  const line = el.querySelector<HTMLElement>('.case-ba');
  const notes = el.querySelector<HTMLElement>('.case-notes');
  const bar = el.querySelector<HTMLElement>('.tally-bar');
  const count = el.querySelector<HTMLElement>('.case-count');
  if (!ctrEl || !count) return;

  const c = counter(ctrEl);
  const segs = bar ? Array.from(bar.children) : [];
  const struck = Number(bar?.dataset.struck ?? 0);
  const tally = stepper(struck, STROKE, (n) => segs.forEach((s, i) => s.classList.toggle('on', i < n)));

  c.show(before);
  line?.classList.add('is-off');
  notes?.classList.add('is-before');
  segs.forEach((s) => s.classList.remove('on'));

  onPass(
    count,
    '70%',
    () => {
      c.roll(after, {
        dir: 1,
        onSettle: () => {
          if (c.value !== after) return;
          line?.classList.remove('is-off');
          notes?.classList.remove('is-before');
          tally.play();
        },
      });
    },
    () => {
      tally.reverse();
      line?.classList.add('is-off');
      notes?.classList.add('is-before');
      c.roll(before, { dir: -1 });
    },
  );

  initArtefact(el.querySelector<HTMLElement>('.artefact'));
}

export function initCases(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.case').forEach(initCase);
}
