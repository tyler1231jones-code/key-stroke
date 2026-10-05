// What the HTML choreography tells the 3D scenes. The page scripts write
// scroll progress and triggered values here; the scenes read them. The stage
// registers invalidate() so a triggered tween can ask for a frame.

export const bus = {
  hero: { p: 0, press: 0 },
  audit: { p: 0 },
  invalidate: () => {},
};

/** Hero beats, as fractions of the pin's travel. Shared by the HTML and the scene. */
export const HERO = {
  press: 0.012,
  pull: [0.03, 0.3] as const,
  waves: [0.12, 0.56] as const,
  drop: [0.44, 0.72] as const,
  push: [0.7, 0.88] as const,
  strip: [0.6, 0.72] as const,
  roll: 0.82,
};

/** Audit beats: the stack clears, then the last sheet turns to face the visitor. */
export const AUDIT = {
  clear: [0.06, 0.62] as const,
  turn: [0.62, 0.94] as const,
};
