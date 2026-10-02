// The four practice mechanisms. Each runs once as its block enters and undoes
// on the way back up. Count: digit cells settling. Clear: a tally striking
// out. Build: cells assembling into a grid. Face: a blank sheet ruling itself
// into a letterhead.
import { gsap, reduced, onPass, stepper, ROLL, STROKE } from './motion';
import { counter } from './counter';

export function initMechanism(block: HTMLElement): void {
  const mech = block.querySelector<HTMLElement>('.mech');
  if (!mech || reduced) return;
  const all = <T extends HTMLElement>(sel: string) => Array.from(mech.querySelectorAll<T>(sel));
  const kind = mech.dataset.mech;
  let enter = () => {};
  let back = () => {};

  if (kind === 'cells') {
    const el = mech.querySelector<HTMLElement>('.ctr');
    if (el) {
      const c = counter(el);
      const value = c.value;
      c.show(null);
      enter = () => c.roll(value, { dir: 1, spin: 1 });
      back = () => c.roll(null, { dir: -1 });
    }
  } else if (kind === 'tally') {
    // Strokes disappear left to right, one per 60ms.
    const ticks = all('.tick');
    ticks.forEach((t) => t.classList.add('is-ink'));
    const clear = stepper(ticks.length, STROKE, (n) => ticks.forEach((t, i) => t.classList.toggle('is-ink', i >= n)));
    enter = () => clear.play();
    back = () => clear.reverse();
  } else if (kind === 'grid') {
    // Cells assemble into a grid, each sliding home on its rail.
    const cells = all('.cell');
    const tl = gsap.timeline({ paused: true });
    cells.forEach((cell, i) => {
      const fromX = (i % 2 === 0 ? -1 : 1) * (30 + (i % 4) * 14);
      const fromY = i % 3 === 0 ? -26 : i % 3 === 1 ? 26 : 0;
      gsap.set(cell, { x: fromX, y: fromY, autoAlpha: 0 });
      tl.to(cell, { x: 0, y: 0, autoAlpha: 1, duration: ROLL, ease: 'none' }, i * STROKE);
    });
    enter = () => tl.play();
    back = () => tl.reverse();
  } else if (kind === 'letterhead') {
    // A blank sheet rules itself into a letterhead.
    const lines = all('.mast, .rule, .ln, .band');
    const tl = gsap.timeline({ paused: true });
    lines.forEach((line, i) => {
      gsap.set(line, { scaleX: 0, transformOrigin: '0 50%' });
      tl.to(line, { scaleX: 1, duration: ROLL, ease: 'none' }, i * STROKE * 2);
    });
    enter = () => tl.play();
    back = () => tl.reverse();
  }
  onPass(block, '78%', enter, back);
}
