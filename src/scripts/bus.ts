// What the HTML choreography tells the 3D scenes. The section scripts write
// scroll progress and triggered values here; the scenes read them. The stage
// registers invalidate() so a triggered tween can ask for a frame.

export const bus = {
  hero: { p: 0, press: 0 },
  count: { p: 0 },
  audit: { p: 0 },
  us: { press: [0, 0] as [number, number] },
  practice: { p: 0 },
  /** Progress of each case through the viewport, by case id. */
  cases: {} as Record<string, number>,
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

export const AUDIT = {
  clear: [0.04, 0.5] as const,
  turn: [0.5, 0.68] as const,
  print: 0.68,
  fields: 0.76,
  next: 0.84,
};
