// Standard 1/3-stop camera scales.

export const APERTURES = [
  1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22,
];

// Shutter speeds in seconds, slowest to fastest.
export const SHUTTERS = [
  30, 25, 20, 15, 13, 10, 8, 6, 5, 4, 3.2, 2.5, 2, 1.6, 1.3, 1, 0.8, 0.6, 0.5, 0.4, 0.3,
  1 / 4, 1 / 5, 1 / 6, 1 / 8, 1 / 10, 1 / 13, 1 / 15, 1 / 20, 1 / 25, 1 / 30, 1 / 40, 1 / 50, 1 / 60,
  1 / 80, 1 / 100, 1 / 125, 1 / 160, 1 / 200, 1 / 250, 1 / 320, 1 / 400, 1 / 500, 1 / 640, 1 / 800,
  1 / 1000, 1 / 1250, 1 / 1600, 1 / 2000, 1 / 2500, 1 / 3200, 1 / 4000, 1 / 5000, 1 / 6400, 1 / 8000,
];

export const ISOS = [
  100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000,
  6400, 8000, 10000, 12800, 16000, 20000, 25600,
];

export const FOCALS = [14, 16, 20, 24, 28, 35, 50, 70, 85, 105, 135, 200, 300, 400];

export const EV_COMP = [
  -3, -2.7, -2.3, -2, -1.7, -1.3, -1, -0.7, -0.3, 0, 0.3, 0.7, 1, 1.3, 1.7, 2, 2.3, 2.7, 3,
];

/** Index of the value in `list` closest to `v` on a log scale. */
export function nearestIndex(list: number[], v: number): number {
  let best = 0;
  let bestD = Infinity;
  const lv = Math.log(v);
  list.forEach((x, i) => {
    const d = Math.abs(Math.log(x) - lv);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

export function nearest(list: number[], v: number): number {
  return list[nearestIndex(list, v)];
}

export function nearestLinearIndex(list: number[], v: number): number {
  let best = 0;
  list.forEach((x, i) => {
    if (Math.abs(x - v) < Math.abs(list[best] - v)) best = i;
  });
  return best;
}

export function formatShutter(t: number): string {
  if (t >= 0.3) {
    const r = Math.round(t * 10) / 10;
    return `${r}s`;
  }
  return `1/${Math.round(1 / t)}`;
}

export function formatAperture(n: number): string {
  return `f/${n}`;
}

export function formatEv(ev: number): string {
  const r = Math.round(ev * 10) / 10;
  if (Math.abs(r) < 0.05) return '±0';
  const sign = r > 0 ? '+' : '−';
  return `${sign}${Math.abs(r).toFixed(1)}`;
}
