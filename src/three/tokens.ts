// Colours for 3D are read from the CSS custom properties at run time, so no
// token value is written into scene code. signal and live are deliberately
// not exposed: they never appear on a 3D object.
import * as THREE from 'three';

export interface Tokens {
  base000: THREE.Color;
  base100: THREE.Color;
  base900: THREE.Color;
  rule: THREE.Color;
  hairline: THREE.Color;
  ink: THREE.Color;
  inkMuted: THREE.Color;
  readout: THREE.Color;
  /** Paper: the light theme's page, for sheets and forms. */
  paper: THREE.Color;
  paperRule: THREE.Color;
  paperInk: THREE.Color;
  css: Record<string, string>;
}

function read(el: Element, names: string[]): Record<string, string> {
  const style = getComputedStyle(el);
  const out: Record<string, string> = {};
  for (const name of names) out[name] = style.getPropertyValue(`--${name}`).trim();
  return out;
}

let cached: Tokens | null = null;

export function tokens(): Tokens {
  if (cached) return cached;
  const names = ['base-000', 'base-100', 'base-900', 'rule', 'hairline', 'ink', 'ink-muted', 'readout'];
  const dark = read(document.documentElement, names);
  // The light theme's values, read from a detached scope rather than restated.
  const probe = document.createElement('div');
  probe.setAttribute('data-theme', 'light');
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const light = read(probe, names);
  probe.remove();

  const c = (v: string) => new THREE.Color(v);
  cached = {
    base000: c(dark['base-000']),
    base100: c(dark['base-100']),
    base900: c(dark['base-900']),
    rule: c(dark.rule),
    hairline: c(dark.hairline),
    ink: c(dark.ink),
    inkMuted: c(dark['ink-muted']),
    readout: c(dark.readout),
    paper: c(light['base-100']),
    paperRule: c(light.rule),
    paperInk: c(light.ink),
    css: {
      base000: dark['base-000'],
      base100: dark['base-100'],
      base900: dark['base-900'],
      rule: dark.rule,
      hairline: dark.hairline,
      ink: dark.ink,
      inkMuted: dark['ink-muted'],
      readout: dark.readout,
      paper: light['base-100'],
      paperWhite: light['base-000'],
      paperRule: light.rule,
      paperHairline: light.hairline,
      paperInk: light.ink,
      paperMuted: light['ink-muted'],
    },
  };
  return cached;
}

export function fontFamily(kind: 'display' | 'body' | 'data'): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--font-${kind}`).trim();
}
