// The counter's behaviour. A rolling digit holds its outgoing and incoming
// glyphs in one cell and translates them over 180ms, linear. The final digit
// lands and stops. Under reduced motion nothing rolls: show() sets the figure.
import { gsap, reduced, ROLL, STROKE } from './motion';
import { num } from '../lib/format';

type Glyph = string; // a digit, a comma, or '' for a blank cell

export interface RollOptions {
  /** 1 rolls upward (forward). -1 rolls back down (undo). */
  dir?: 1 | -1;
  /** Extra digits each cell passes before it settles. The rightmost lands last. */
  spin?: number;
  /** Delay between cells, right to left. */
  stagger?: number;
  onSettle?: () => void;
}

export class Counter {
  readonly el: HTMLElement;
  private cells: HTMLElement[];
  private tl: gsap.core.Timeline | null = null;
  value: number | null;

  constructor(el: HTMLElement) {
    this.el = el;
    this.cells = Array.from(el.querySelectorAll<HTMLElement>(':scope > .d, :scope > .c'));
    const raw = el.dataset.value;
    this.value = raw === undefined || raw === '' ? null : Number(raw);
  }

  /** One glyph per cell, right-aligned. Cells the figure does not use are blank, not zero. */
  private layout(value: number | null): Glyph[] {
    const text = value === null ? '' : num(value);
    return text.padStart(this.cells.length, ' ').slice(-this.cells.length).split('').map((ch) => ch.trim());
  }

  private glyphOf(cell: HTMLElement): Glyph {
    const node = cell.firstChild;
    return node && node.nodeType === Node.TEXT_NODE ? (node.textContent ?? '').trim() : '';
  }

  private setGlyph(cell: HTMLElement, glyph: Glyph): void {
    cell.querySelector('.roll')?.remove();
    const node = cell.firstChild;
    if (node && node.nodeType === Node.TEXT_NODE) node.textContent = glyph;
    else cell.insertBefore(document.createTextNode(glyph), cell.firstChild);
  }

  /** Set the figure at once, with no roll. */
  show(value: number | null): void {
    this.tl?.kill();
    this.tl = null;
    this.value = value;
    this.layout(value).forEach((glyph, i) => this.setGlyph(this.cells[i], glyph));
    this.el.dataset.value = value === null ? '' : String(value);
    this.el.setAttribute('aria-label', value === null ? 'No figure' : num(value));
  }

  /** Roll to a figure. Every changed cell rolls; unchanged cells stay put. */
  roll(value: number | null, opts: RollOptions = {}): void {
    if (reduced) {
      this.show(value);
      opts.onSettle?.();
      return;
    }
    const { dir = 1, spin = 0, stagger = STROKE } = opts;
    // Settle anything in flight on the figure it was heading for.
    if (this.tl) this.show(this.value);
    const from = this.cells.map((cell) => this.glyphOf(cell));
    const to = this.layout(value);
    this.value = value;
    this.el.dataset.value = value === null ? '' : String(value);
    this.el.setAttribute('aria-label', value === null ? 'No figure' : num(value));

    const tl = gsap.timeline({
      onComplete: () => {
        this.tl = null;
        to.forEach((glyph, i) => this.setGlyph(this.cells[i], glyph));
        opts.onSettle?.();
      },
    });
    let order = 0;
    for (let i = this.cells.length - 1; i >= 0; i--) {
      const cell = this.cells[i];
      if (from[i] === to[i]) continue;
      const seq = this.sequence(from[i], to[i], spin > 0 ? spin + i : 0);
      const steps = seq.length - 1;
      const strip = document.createElement('span');
      strip.className = 'roll';
      const ordered = dir === 1 ? seq : [...seq].reverse();
      for (const glyph of ordered) {
        const g = document.createElement('span');
        g.textContent = glyph;
        strip.appendChild(g);
      }
      const text = cell.firstChild;
      if (text && text.nodeType === Node.TEXT_NODE) text.textContent = '';
      cell.insertBefore(strip, cell.querySelector('.seam'));
      const start = dir === 1 ? 0 : -100 * steps;
      const end = dir === 1 ? -100 * steps : 0;
      tl.fromTo(strip, { yPercent: start }, { yPercent: end, duration: ROLL * steps, ease: 'none' }, spin > 0 ? 0 : order * stagger);
      order++;
    }
    if (order === 0) {
      tl.kill();
      opts.onSettle?.();
      return;
    }
    this.tl = tl;
  }

  /** The glyphs a cell passes through: one roll, or a spin that counts down onto the figure. */
  private sequence(from: Glyph, to: Glyph, spin: number): Glyph[] {
    if (spin <= 0 || !/^\d$/.test(to)) return [from, to];
    const digit = Number(to);
    const seq: Glyph[] = [from];
    for (let k = spin; k >= 0; k--) seq.push(String((digit + k) % 10));
    return seq;
  }
}

const registry = new WeakMap<HTMLElement, Counter>();

export function counter(el: HTMLElement): Counter {
  let c = registry.get(el);
  if (!c) {
    c = new Counter(el);
    registry.set(el, c);
  }
  return c;
}
