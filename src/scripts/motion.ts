// Shared motion plumbing: GSAP, ScrollTrigger and Lenis, wired once.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const phone = window.matchMedia('(max-width: 719px)');

/** The design system's durations. Mechanisms are linear or stepped and never scrubbed. */
export const ROLL = 0.18; // a digit rolls in 180ms, linear
export const STROKE = 0.06; // a tally clears at 60ms a stroke
export const HOLD = 0.4; // a clearance holds for 400ms and is gone

let lenis: Lenis | null = null;

export function initSmooth(): Lenis | null {
  if (reduced) return null;
  ScrollTrigger.config({ ignoreMobileResize: true });
  lenis = new Lenis({ anchors: { offset: 0 }, stopInertiaOnNavigate: true, allowNestedScroll: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToEl(target: HTMLElement | number, immediate = false): void {
  if (lenis) lenis.scrollTo(target, { immediate, offset: 0 });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
  else target.scrollIntoView({ block: 'start' });
}

/** True when a section is using its sticky pin (wide and tall enough, motion on). */
export function isPinned(pin: HTMLElement): boolean {
  return !reduced && getComputedStyle(pin).position === 'sticky';
}

/**
 * Progress of a sticky pin through its host, 0 to 1, as a ScrollTrigger.
 * `host` is the tall element; `pin` is the sticky child.
 */
export function pinProgress(host: HTMLElement, pin: HTMLElement, onUpdate: (p: number) => void): ScrollTrigger {
  const top = () => parseFloat(getComputedStyle(pin).top) || 0;
  return ScrollTrigger.create({
    trigger: host,
    start: () => `top ${top()}px`,
    end: () => `bottom ${top() + pin.offsetHeight}px`,
    onUpdate: (self) => onUpdate(self.progress),
    onRefresh: (self) => onUpdate(self.progress),
  });
}

/**
 * A mechanism fired at a point in a pin's travel. It plays in real time when
 * the visitor scrolls past and undoes when they scroll back above it.
 */
export function beat(host: HTMLElement, pin: HTMLElement, at: number, enter: () => void, back: () => void): ScrollTrigger {
  const top = () => parseFloat(getComputedStyle(pin).top) || 0;
  return ScrollTrigger.create({
    trigger: host,
    start: () => `top+=${Math.round(at * Math.max(1, host.offsetHeight - pin.offsetHeight))} ${top()}px`,
    end: 'max',
    onEnter: enter,
    onLeaveBack: back,
  });
}

/** A mechanism fired when an element reaches a line in the viewport. */
export function onPass(el: Element, line: string, enter: () => void, back: () => void): ScrollTrigger {
  return ScrollTrigger.create({ trigger: el, start: `top ${line}`, end: 'max', onEnter: enter, onLeaveBack: back });
}

/**
 * A stepped sequence: `apply(n)` shows the first n of `count` items. Plays
 * forward at a fixed interval and reverses the same way.
 */
export function stepper(count: number, interval: number, apply: (n: number) => void): gsap.core.Tween {
  const o = { n: 0 };
  let last = -1;
  return gsap.to(o, {
    n: count,
    duration: Math.max(0.001, count * interval),
    ease: `steps(${Math.max(1, count)})`,
    paused: true,
    onUpdate: () => {
      const n = Math.round(o.n);
      if (n !== last) {
        last = n;
        apply(n);
      }
    },
  });
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Remap v from [a, b] to [0, 1], clamped. */
export const span = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
