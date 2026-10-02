// Punched tape for the crew plate. It encodes the designation: one character
// per column, one hole per set bit of its ASCII code. A machine-readable
// label, not a texture, so it is generated from the text.

/** Eight data rows; the sprocket row is drawn as the fifth of the nine rows. */
export const DATA_ROWS = 8;
export const SPROCKET_AFTER = 4;

export function designation(unit: string, verb: string): string {
  return `UNIT ${unit} / ${verb.toUpperCase()}`;
}

/** For each character, the eight bits of its ASCII code, most significant first. */
export function tapeColumns(text: string): boolean[][] {
  return [...text].map((ch) => {
    const code = ch.charCodeAt(0) & 0xff;
    return Array.from({ length: DATA_ROWS }, (_, row) => ((code >> (DATA_ROWS - 1 - row)) & 1) === 1);
  });
}

export interface TapeGeometry {
  width: number;
  height: number;
  pitch: number;
  holes: { x: number; y: number; size: number }[];
}

/** Square holes (the system has no circles). Data holes 6, sprocket holes 3, pitch 12. */
export function tapeGeometry(text: string, pitch = 12): TapeGeometry {
  const cols = tapeColumns(text);
  const holes: TapeGeometry['holes'] = [];
  const rowY = (visualRow: number) => visualRow * pitch + pitch / 2;
  cols.forEach((bits, c) => {
    const x = c * pitch + pitch / 2;
    bits.forEach((set, row) => {
      const visual = row < SPROCKET_AFTER ? row : row + 1;
      if (set) holes.push({ x: x - 3, y: rowY(visual) - 3, size: 6 });
    });
    holes.push({ x: x - 1.5, y: rowY(SPROCKET_AFTER) - 1.5, size: 3 });
  });
  return { width: cols.length * pitch, height: (DATA_ROWS + 1) * pitch, pitch, holes };
}
