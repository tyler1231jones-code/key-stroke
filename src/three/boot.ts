// Loaded as its own chunk after first paint. Registers a scene for each
// section that has one, on the one persistent canvas. Falls back, in order:
// live stage, still frames drawn once per section, the drawn stand-ins.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createStage, type SceneFactory } from './stage';
import { bootStill, type StillDef } from './still';
import { fontFamily } from './tokens';
import { heroScene } from './scenes/hero';
import { countScene } from './scenes/count';
import { caseScene } from './scenes/case';
import { auditScene } from './scenes/audit';
import { usScene } from './scenes/us';
import { practiceScene } from './scenes/practice';
import { bus } from '../scripts/bus';

const SCENES: Record<string, { factory: SceneFactory; still?: boolean }> = {
  hero: { factory: heroScene },
  count: { factory: countScene },
  case: { factory: caseScene },
  audit: { factory: auditScene, still: false },
  us: { factory: usScene },
  practice: { factory: practiceScene },
};

function noStage(): void {
  // No WebGL: the page keeps its drawn stand-ins and rendered stills.
  document.documentElement.classList.add('no-stage', 'no-webgl');
}

export async function bootStage(_page: string): Promise<void> {
  const canvas = document.getElementById('stage') as HTMLCanvasElement | null;
  if (!canvas) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = window.matchMedia('(max-width: 719px)').matches;

  // Textures are drawn with the page's own faces, so wait for the ones they use.
  await Promise.all([
    document.fonts.load(`600 64px ${fontFamily('body')}`, 'KTV0123456789'),
    document.fonts.load(`500 64px ${fontFamily('data')}`, '0123456789'),
  ]).catch(() => {});

  const defs: StillDef[] = [];
  document.querySelectorAll<HTMLElement>('[data-scene], .case[data-object]').forEach((el) => {
    const key = el.dataset.scene ?? 'case';
    const def = SCENES[key];
    if (def) defs.push({ el, factory: def.factory, still: def.still });
  });
  if (!defs.length) return;

  const forceStill = new URLSearchParams(location.search).has('still');
  if (reduced || forceStill) {
    document.documentElement.classList.add('no-stage');
    if (!bootStill(defs, phone)) noStage();
    return;
  }

  const debug = new URLSearchParams(location.search).has('debug');
  const stage = createStage(canvas, {
    maxDpr: phone ? 1.5 : 2,
    phone,
    onSlow: () => {
      if (debug) return; // tools/qa.mjs measures the live stage, even on a software renderer
      // The device cannot hold frame rate: hand over to still frames.
      stage?.destroy();
      bus.invalidate = () => {};
      document.documentElement.classList.add('no-stage');
      if (!bootStill(defs, phone)) noStage();
    },
  });
  if (!stage) {
    noStage();
    return;
  }
  bus.invalidate = stage.invalidate;
  // ?debug exposes the stage for tools/qa.mjs (memory after a full scroll).
  if (debug) (window as unknown as { __stage: unknown }).__stage = stage;
  defs.forEach((def) => stage.add(def.el, def.factory));
  ScrollTrigger.refresh();
  document.documentElement.classList.add('stage-on');
}
