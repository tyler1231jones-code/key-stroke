const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** 41900 -> "41,900". Never abbreviated. */
export function num(n: number): string {
  return Math.trunc(n).toLocaleString('en-AU');
}

/** "2026-02-09" -> "9 Feb 2026" */
export function dateShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "2026-02-09" -> "February 2026" */
export function monthYear(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Split copy into text and figure runs so every numeral can be set in the
 * data family, including mid-sentence. "06:00 AEST on the 1st" keeps its
 * zone and ordinal with the figure.
 */
export function figureRuns(text: string): { text: string; fig: boolean }[] {
  const n = String.raw`\$?\d+(?:,\d{3})*(?:\.\d+)?`;
  const re = new RegExp(`${n}(?:[:–-]${n})*(?:st|nd|rd|th|%)?(?:\\s(?:AEST|AEDT))?`, 'g');
  const out: { text: string; fig: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: text.slice(last, i), fig: false });
    out.push({ text: m[0], fig: true });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), fig: false });
  return out;
}
