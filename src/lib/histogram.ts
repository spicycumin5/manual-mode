export interface Histogram {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  l: Uint32Array;
  /** Share of sampled pixels clipped to pure white / pure black (0–1). */
  clipHi: number;
  clipLo: number;
  meanL: number;
}

/** Builds a 256-bin histogram from RGBA bytes, sampling every `step`th pixel. */
export function computeHistogram(px: Uint8Array | Uint8ClampedArray, step = 3): Histogram {
  const r = new Uint32Array(256);
  const g = new Uint32Array(256);
  const b = new Uint32Array(256);
  const l = new Uint32Array(256);
  let hi = 0;
  let lo = 0;
  let n = 0;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4 * step) {
    const R = px[i], G = px[i + 1], B = px[i + 2];
    r[R]++; g[G]++; b[B]++;
    const L = Math.round(0.2126 * R + 0.7152 * G + 0.0722 * B);
    l[L]++;
    sum += L;
    if (R >= 254 || G >= 254 || B >= 254) hi++;
    if (L <= 2) lo++;
    n++;
  }
  return { r, g, b, l, clipHi: hi / n, clipLo: lo / n, meanL: sum / n / 255 };
}
