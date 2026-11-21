export type Pt = [number, number]; // x, y in 0..1

export const IDENTITY: Pt[] = [
  [0, 0],
  [1, 1],
];

/** Monotone cubic (Fritsch–Carlson) interpolation through sorted points → 256-entry LUT (0..1). */
export function buildLut(points: Pt[]): Float32Array {
  const pts = [...points].sort((a, b) => a[0] - b[0]);
  const n = pts.length;
  const lut = new Float32Array(256);
  if (n === 0) {
    for (let i = 0; i < 256; i++) lut[i] = i / 255;
    return lut;
  }
  if (n === 1) {
    lut.fill(pts[0][1]);
    return lut;
  }
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let seg = 0;
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    if (x <= xs[0]) {
      lut[i] = ys[0];
      continue;
    }
    if (x >= xs[n - 1]) {
      lut[i] = ys[n - 1];
      continue;
    }
    while (seg < n - 2 && x > xs[seg + 1]) seg++;
    const h = xs[seg + 1] - xs[seg];
    const t = (x - xs[seg]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    const v =
      (2 * t3 - 3 * t2 + 1) * ys[seg] +
      (t3 - 2 * t2 + t) * h * m[seg] +
      (-2 * t3 + 3 * t2) * ys[seg + 1] +
      (t3 - t2) * h * m[seg + 1];
    lut[i] = Math.min(1, Math.max(0, v));
  }
  return lut;
}
