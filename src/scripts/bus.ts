// What the HTML choreography tells the 3D scenes. The page scripts write
// scroll progress and triggered values here; the scenes read them. The stage
// registers invalidate() so a triggered tween can ask for a frame.

export const bus = {
  hero: {
    p: 0,
    press: 0,
    /** The hero's keyboard as the 3D scene lays it out, for the wake; null until the scene is running. */
    grid: null as HeroGrid | null,
    /** Called by the scene with how many of the field's keys are still up, and how many there were; -1 when the field is gone. */
    onKeys: null as ((left: number, of: number) => void) | null,
  },
  audit: { p: 0 },
  invalidate: () => {},
};

/**
 * Which keys the hero's 3D field has, and how big they are. Distances are in
 * pixels from the centre of the worn key. The wake (src/wake/engine.ts) draws
 * the keys this keyboard is missing, the ones under the headline, and keeps
 * off the ones that are really there.
 */
export interface HeroGrid {
  /** True where the scroll sequence runs (a desktop). False where the hero is a still picture: the field is then only the few keys around the worn one, at its own size, in the band the slot is in. */
  sequence: boolean;
  /** Pixels to a key once the camera has pulled back, and at the start, close in. */
  pitch: number;
  macro: number;
  /** Pixels to a key as the scene is drawn now, measured at the top of a key. */
  scale: number;
  /** How much smaller the foot of a key is drawn than its top, since the camera looks down from a finite height: 0.88 close in, nearly 1 far out. */
  base: number;
  /** The frame the field fills: left, top, right, bottom. */
  frame: [number, number, number, number];
  /** The copy's corner, which no key may cross: its right edge and its foot. Null when the copy is not over the field. */
  copy: [number, number] | null;
}

/** Hero beats, as fractions of the pin's travel. Shared by the HTML and the scene. */
export const HERO = {
  press: 0.012,
  pull: [0.03, 0.3] as const,
  waves: [0.12, 0.56] as const,
  drop: [0.44, 0.72] as const,
  push: [0.7, 0.88] as const,
  // The strip rises into the foot of the hero just behind the bottom rows as they drop out of it, so the
  // count of keys left is there to be watched for nearly the whole of the drop.
  strip: [0.46, 0.53] as const,
  roll: 0.82,
};

/** Audit beats: the stack clears, then the last sheet turns to face the visitor. */
export const AUDIT = {
  clear: [0.06, 0.62] as const,
  turn: [0.62, 0.94] as const,
};
