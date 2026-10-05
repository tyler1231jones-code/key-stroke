// The four service demonstrations. Each is one GSAP timeline whose start is
// the "before" and whose end is the "after", so Before, After and Replay are
// just places on it. A demonstration plays once when it scrolls into view,
// and only moves while it is on screen.
//
// On the homepage the four are compact and take turns: one plays, holds, and
// hands over to the next, so only one is ever asking for attention.
//
// With reduced motion there is no timeline. The stage rests on "after" and
// the toggle swaps the two states.
import { gsap } from 'gsap';

type Q = (selector: string) => HTMLElement[];
type Builder = (root: HTMLElement, q: Q, colour: (name: string) => string) => gsap.core.Timeline;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const OUT = 'power2.out';
const INOUT = 'power2.inOut';

/** Where one element's centre is, measured from another's top left, in pixels. */
function offset(el: Element, from: Element, at: 'centre' | 'topLeft' | 'bottom' = 'centre'): { x: number; y: number } {
  // A phrase that wraps is measured where it starts, on its first line.
  const a = at === 'topLeft' ? (el.getClientRects()[0] ?? el.getBoundingClientRect()) : el.getBoundingClientRect();
  const b = from.getBoundingClientRect();
  if (at === 'topLeft') return { x: a.left - b.left, y: a.top - b.top };
  if (at === 'bottom') return { x: a.left + a.width / 2 - b.left, y: a.bottom - b.top };
  return { x: a.left + a.width / 2 - b.left, y: a.top + a.height / 2 - b.top };
}

/* ---------- Websites and software: the old site is rebuilt section by section ---------- */
const web: Builder = (_root, q) => {
  const tl = gsap.timeline({ paused: true });
  q('.frame-view').forEach((view) => {
    const old = view.querySelector<HTMLElement>('.dw-old')!;
    const scan = view.querySelector<HTMLElement>('.dw-scan')!;
    const parts = Array.from(view.querySelectorAll<HTMLElement>('[data-part]'));
    const box = view.getBoundingClientRect();
    // Each cut ends at the foot of a section of the new site.
    const cuts = parts.map((part, i) => (i === parts.length - 1 ? 100 : ((part.getBoundingClientRect().bottom - box.top) / box.height) * 100));
    tl.set(old, { clipPath: 'inset(0% 0% 0% 0%)' }, 0);
    tl.fromTo(scan, { top: '0%', autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 0.35);
    parts.forEach((part, i) => {
      const at = 0.5 + i * 1.3;
      tl.to(old, { clipPath: `inset(${cuts[i]}% 0% 0% 0%)`, duration: 0.9, ease: INOUT }, at);
      tl.to(scan, { top: `${cuts[i]}%`, duration: 0.9, ease: INOUT }, at);
      tl.fromTo(part, { autoAlpha: 0, y: '0.9em' }, { autoAlpha: 1, y: 0, duration: 0.6, ease: OUT }, at + 0.35);
    });
    tl.to(scan, { autoAlpha: 0, duration: 0.2 }, 0.5 + (parts.length - 1) * 1.3 + 0.9);
  });
  return tl;
};

/* ---------- Reporting: cells lift out, sort, and collapse into shapes ---------- */
const reporting: Builder = (_root, q, colour) => {
  const tl = gsap.timeline({ paused: true });
  const stage = q('.dr')[0];
  const rows = q('.dr-row[data-row]');
  const picks = q('.dr-grid [data-pick]').filter((c) => c.offsetParent !== null);
  const rowHeight = rows[0].getBoundingClientRect().height;
  // The rows sort: each goes to a new place in the sheet.
  const order = rows.map((_, r) => (r * 5 + 3) % rows.length);

  // 1. Cells lift out.
  tl.to(picks, { scale: 1.35, backgroundColor: colour('--demo-rep-accent'), color: colour('--demo-paper'), duration: 0.35, stagger: 0.09, ease: OUT }, 0.3);
  // 2. The rows sort.
  rows.forEach((row, r) => tl.to(row, { y: (order[r] - r) * rowHeight, duration: 0.8, ease: INOUT }, 1.4 + (r % 4) * 0.05));
  // 3. The sheet goes, and each lifted cell travels to its place: three become
  //    the headline figures, five the feet of the bars.
  tl.to(q('.dr-sheet'), { autoAlpha: 0, duration: 0.45 }, 2.5);
  picks.forEach((cell, i) => {
    const [kind, n] = (cell.dataset.pick ?? '').split('-');
    const fly = q(`[data-fly="${cell.dataset.pick}"]`)[0];
    const to = kind === 'kpi' ? q(`[data-kpi="${n}"] b`)[0] : q(`[data-bar="${n}"]`)[0];
    if (!fly || !to) return;
    const box = cell.getBoundingClientRect();
    const from = offset(cell, stage, 'topLeft');
    const r = Number(cell.parentElement?.dataset.row ?? 0);
    const start = { x: from.x, y: from.y + (order[r] - r) * rowHeight };
    const dest = offset(to, stage, kind === 'kpi' ? 'centre' : 'bottom');
    gsap.set(fly, { width: box.width, height: box.height, x: start.x, y: start.y, scale: 1.35 });
    tl.fromTo(fly, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 2.45);
    tl.to(fly, { x: dest.x - box.width / 2, y: dest.y - box.height / 2, scale: 1, duration: 0.8, ease: INOUT }, 2.6 + i * 0.04);
    tl.to(fly, { autoAlpha: 0, duration: 0.25 }, 3.5);
  });
  // 4. The summary takes shape.
  tl.fromTo(q('.dr-title'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 2.9);
  tl.fromTo(q('.dr-kpi'), { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.45, stagger: 0.1, ease: OUT }, 3.3);
  tl.fromTo(q('.dr-panel'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.1 }, 3.5);
  tl.fromTo(q('.dr-bars i'), { scaleY: 0 }, { scaleY: 1, duration: 0.5, stagger: 0.08, ease: OUT }, 3.7);
  tl.fromTo(q('.dr-trend'), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: INOUT }, 3.8);
  tl.fromTo(q('.dr-list p'), { autoAlpha: 0, x: '1em' }, { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.14, ease: OUT }, 4.4);
  return tl;
};

/* ---------- Automation: who, what and by when are picked out and carried across ---------- */
const automation: Builder = (_root, q, colour) => {
  const tl = gsap.timeline({ paused: true });
  const stage = q('.da')[0];
  const mail = q('[data-mail]')[0];
  const keys = ['who', 'what', 'when'];

  tl.fromTo(mail, { autoAlpha: 0, yPercent: -100 }, { autoAlpha: 1, yPercent: 0, duration: 0.45, ease: OUT }, 0.3);
  tl.fromTo(q('[data-open]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.8);
  tl.fromTo(q('[data-task]'), { autoAlpha: 0, y: '0.8em' }, { autoAlpha: 1, y: 0, duration: 0.4, ease: OUT }, 3.0);
  tl.set(q('[data-filed]'), { autoAlpha: 0 }, 0);

  keys.forEach((key, i) => {
    const mark = q(`mark[data-pick="${key}"]`)[0];
    const chip = q(`[data-chip="${key}"]`)[0];
    const slot = q(`[data-slot="${key}"]`)[0];
    const from = offset(mark, stage, 'topLeft');
    const to = offset(slot, stage, 'topLeft');
    const lift = chip.getBoundingClientRect().height * 1.15;
    const picked = 1.4 + i * 0.5;
    const carried = 3.2 + i * 0.3;
    tl.to(mark, { backgroundColor: colour('--demo-auto-mark'), duration: 0.25 }, picked);
    tl.fromTo(chip, { x: from.x, y: from.y - lift, autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: OUT }, picked);
    tl.to(chip, { x: to.x, y: to.y, duration: 0.6, ease: INOUT }, carried);
    tl.to(chip, { autoAlpha: 0, duration: 0.2 }, carried + 0.55);
    tl.fromTo(slot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, carried + 0.5);
  });

  tl.fromTo(q('[data-owner]'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: OUT }, 4.6);
  tl.fromTo(q('[data-event]'), { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 0%' }, { autoAlpha: 1, scaleY: 1, duration: 0.35, ease: OUT }, 4.9);
  tl.fromTo(q('[data-reply]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 5.2);
  tl.fromTo(q('[data-reply-text]'), { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'none' }, 5.3);
  tl.to(q('[data-filed]'), { autoAlpha: 1, duration: 0.3 }, 6.0);
  tl.to(mail, { borderLeftColor: colour('--demo-auto-good'), duration: 0.3 }, 6.0);
  return tl;
};

/* ---------- Branding: the mark is redrawn and rolls out, then the shopfront is repainted ---------- */
const brand: Builder = (_root, q) => {
  const tl = gsap.timeline({ paused: true });
  // Beat one: the logo, then the card and the letterhead.
  tl.to(q('.db-old-name'), { scaleX: 1, duration: 0.55, ease: INOUT }, 0.3);
  tl.to(q('[data-logo-old]'), { autoAlpha: 0, duration: 0.35 }, 0.95);
  tl.fromTo(q('[data-mark] circle'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.45, ease: OUT }, 1.05);
  tl.fromTo(q('[data-mark] path'), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, stagger: 0.12, ease: INOUT }, 1.4);
  tl.fromTo(q('[data-word]'), { autoAlpha: 0, y: '0.5em' }, { autoAlpha: 1, y: 0, duration: 0.4, ease: OUT }, 1.75);
  tl.fromTo(q('[data-sub]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 2.0);
  tl.to(q('[data-card] .d-before'), { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.5, ease: INOUT }, 2.4);
  tl.to(q('[data-letter] .d-before'), { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.5, ease: INOUT }, 2.8);
  // Beat two: the shopfront is repainted, left to right.
  const roller = q('.db-roller');
  tl.fromTo(roller, { left: '0%', autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 3.5);
  tl.to(q('[data-shop-old]'), { clipPath: 'inset(0% 0% 0% 100%)', duration: 2.1, ease: 'power1.inOut' }, 3.7);
  tl.to(roller, { left: '100%', duration: 2.1, ease: 'power1.inOut' }, 3.7);
  tl.to(roller, { autoAlpha: 0, duration: 0.2 }, 5.7);
  return tl;
};

const BUILDERS: Record<string, Builder> = { 'web-software': web, reporting, automation, 'brand-design': brand };

/* ---------- One demonstration ---------- */
interface Demo {
  root: HTMLElement;
  compact: boolean;
  tl: gsap.core.Timeline | null;
  visible: boolean;
  played: boolean;
  /** A step of the automatic play that has not happened yet. */
  pending: gsap.core.Tween | null;
  build(): void;
}

/** Leave a demonstration at rest on its after state, with nothing waiting to happen. */
function rest(demo: Demo): void {
  demo.pending?.kill();
  demo.pending = null;
  demo.tl?.eventCallback('onComplete', null).eventCallback('onReverseComplete', null).pause().progress(1, true).timeScale(1);
}

/**
 * A full-size demonstration's one automatic play. It is on the page in its
 * after state from the first paint; once it has been seen it rewinds quickly
 * to the before, holds, and plays through.
 */
function playOnce(demo: Demo): void {
  const tl = demo.tl;
  if (!tl || demo.played) return;
  demo.played = true;
  demo.pending = gsap.delayedCall(0.9, () => {
    tl.eventCallback('onReverseComplete', () => {
      demo.pending = gsap.delayedCall(0.5, () => {
        demo.pending = null;
        tl.eventCallback('onReverseComplete', null).timeScale(1).play(0);
      });
    });
    tl.timeScale(6).reverse();
  });
}

function make(root: HTMLElement): Demo {
  const kind = root.dataset.demo ?? '';
  const stage = root.querySelector<HTMLElement>('.demo-stage')!;
  const q: Q = (selector) => Array.from(stage.querySelectorAll<HTMLElement>(selector));
  const colour = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();
  let ctx: gsap.Context | null = null;
  const demo: Demo = {
    root,
    compact: root.hasAttribute('data-compact'),
    tl: null,
    visible: false,
    played: false,
    pending: null,
    build() {
      const was = demo.tl ? { p: demo.tl.progress(), active: demo.tl.isActive() } : null;
      ctx?.revert();
      root.dataset.state = 'live';
      ctx = gsap.context(() => {
        demo.tl = BUILDERS[kind](root, q, colour);
      }, stage);
      // After a resize, carry on from where it was: mid-play, or settled at one end.
      if (was) {
        demo.tl!.progress(was.active ? was.p : was.p < 0.5 ? 0 : 1);
        if (was.active) demo.tl!.play();
      } else {
        // Every demonstration rests on its after state until it plays.
        demo.tl!.progress(1, true);
      }
    },
  };
  return demo;
}

/** The Before / After toggle and the replay control. */
function controls(demo: Demo): void {
  const { root } = demo;
  const toggles = Array.from(root.querySelectorAll<HTMLButtonElement>('.demo-toggle'));
  const says = root.querySelector<HTMLElement>('[data-demo-says]');
  const words = root.querySelector<HTMLElement>('figcaption .vh:not([data-demo-says])')?.textContent ?? '';
  const press = (state: 'before' | 'after') => {
    toggles.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.show === state)));
    if (says) says.textContent = state === 'before' ? words.split(' After: ')[0] : `After: ${words.split(' After: ')[1] ?? ''}`;
  };
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const state = toggle.dataset.show === 'before' ? 'before' : 'after';
      press(state);
      demo.played = true;
      if (demo.tl) {
        rest(demo);
        demo.tl.progress(state === 'before' ? 0 : 1);
      } else root.dataset.state = state;
    });
  });
  root.querySelector<HTMLButtonElement>('.demo-replay')?.addEventListener('click', () => {
    press('after');
    demo.played = true;
    if (!demo.tl) return;
    rest(demo);
    demo.tl.play(0);
  });
}

/* ---------- The homepage: compact demonstrations take turns ---------- */
interface Conductor {
  /** Visibility changed, or a timeline was rebuilt: stop whatever is out of view and carry on. */
  sync(): void;
}

function conduct(demos: Demo[]): Conductor {
  let turn = -1;
  let timer: gsap.core.Tween | null = null;
  let current: Demo | null = null;

  const stop = () => {
    timer?.kill();
    timer = null;
    if (current) rest(current);
    current = null;
  };
  const next = () => {
    stop();
    const order = demos.map((_, i) => demos[(turn + 1 + i) % demos.length]);
    const demo = order.find((d) => d.visible && d.tl);
    if (!demo) return;
    turn = demos.indexOf(demo);
    current = demo;
    const tl = demo.tl!;
    const play = () => {
      tl.eventCallback('onReverseComplete', null).eventCallback('onComplete', () => {
        timer = gsap.delayedCall(1.8, next);
      });
      tl.timeScale(1).play(0);
    };
    // Each one rests on its after state. On its turn it rewinds quickly to
    // the before, holds for a moment, and plays.
    tl.eventCallback('onReverseComplete', () => {
      timer = gsap.delayedCall(0.6, play);
    });
    tl.progress(1, true).timeScale(6).reverse();
  };

  return {
    sync() {
      if (current && !(current.visible && current.tl)) stop();
      // A card's own arrival finishes before its demonstration starts.
      if (!current && !timer && demos.some((d) => d.visible && d.tl)) timer = gsap.delayedCall(0.7, next);
    },
  };
}

/* ---------- Boot ---------- */
export function initDemos(): void {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-demo]'));
  if (!roots.length) return;
  const demos = roots.map(make);
  demos.filter((d) => !d.compact).forEach(controls);
  if (reduced || !('IntersectionObserver' in window)) return; // rest on "after"; the toggle swaps states

  const start = () => {
    const conductor = conduct(demos.filter((d) => d.compact));

    // A timeline is built as its stage comes near, not at load: building one
    // measures the stage, and that is work a page should not do up front.
    const queue: Demo[] = [];
    let building = false;
    const buildNext = () => {
      const demo = queue.shift();
      if (!demo) {
        building = false;
        return;
      }
      if (!demo.tl) demo.build();
      conductor.sync();
      // A full-size stage that is already on screen plays as soon as its timeline exists.
      if (!demo.compact && demo.visible) playOnce(demo);
      window.setTimeout(buildNext, 50);
    };
    const near = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const demo = demos.find((d) => d.root === record.target);
          if (!demo || !record.isIntersecting || demo.tl) continue;
          queue.push(demo);
          near.unobserve(demo.root);
        }
        if (!building && queue.length) {
          building = true;
          window.setTimeout(buildNext, 0);
        }
      },
      { rootMargin: '60% 0px' },
    );

    const seen = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const demo = demos.find((d) => d.root === record.target);
          if (!demo) continue;
          demo.visible = record.isIntersecting;
          if (demo.compact || !demo.tl) continue;
          // A full-size demonstration plays once, when enough of it is on screen.
          if (demo.visible) playOnce(demo);
          else if (demo.tl.isActive() || demo.pending) rest(demo); // off screen: stop, settled
        }
        conductor.sync();
      },
      { threshold: 0.45 },
    );
    demos.forEach((d) => {
      near.observe(d.root);
      seen.observe(d.root);
    });

    // Positions inside a stage are measured, so a change of size means a rebuild.
    let widths = demos.map((d) => d.root.clientWidth);
    let timer = 0;
    new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        demos.forEach((d, i) => {
          if (!d.tl || Math.abs(d.root.clientWidth - widths[i]) < 2) return;
          d.build();
          if (d.compact) d.tl?.pause().progress(1, true);
        });
        widths = demos.map((d) => d.root.clientWidth);
        conductor.sync();
      }, 200);
    }).observe(document.documentElement);
  };
  // Measure once the fonts are in, so nothing is placed against fallback type.
  document.fonts.ready.then(start);
}
