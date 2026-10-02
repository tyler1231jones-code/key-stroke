// One driver per choreographed section. When the section's sticky pin is in
// use, progress runs across the pin's travel. When it is not (phones, short
// windows), the same progress runs as the section's stage element passes
// through the viewport, so the same beats fire in the same order.
import { ScrollTrigger, isPinned } from './motion';

export interface Driver {
  /** Continuous progress, 0 to 1. Scrubbed. */
  progress(cb: (p: number) => void): ScrollTrigger;
  /** A triggered mechanism at a fraction of the travel. Undoes on the way back up. */
  beat(at: number, enter: () => void, back: () => void): ScrollTrigger;
  pinned(): boolean;
}

interface Pin {
  host: HTMLElement;
  pin: HTMLElement;
}

export function driver(pins: Pin[], flow: HTMLElement, flowRange: [number, number] = [0.9, 0.1]): Driver {
  const active = () => pins.find((p) => isPinned(p.pin));
  const range = (): [number, number] => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const a = active();
    if (a) {
      const top = parseFloat(getComputedStyle(a.pin).top) || 0;
      const start = a.host.getBoundingClientRect().top + y - top;
      return [start, start + Math.max(1, a.host.offsetHeight - a.pin.offsetHeight)];
    }
    const t = flow.getBoundingClientRect().top + y;
    return [t - flowRange[0] * vh, t - flowRange[1] * vh];
  };
  return {
    pinned: () => Boolean(active()),
    progress(cb) {
      return ScrollTrigger.create({
        start: () => range()[0],
        end: () => range()[1],
        onUpdate: (self) => cb(self.progress),
        onRefresh: (self) => cb(self.progress),
      });
    },
    beat(at, enter, back) {
      return ScrollTrigger.create({
        start: () => {
          const [a, b] = range();
          return a + at * (b - a);
        },
        end: 'max',
        onEnter: enter,
        onLeaveBack: back,
      });
    },
  };
}
