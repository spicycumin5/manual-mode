import { SIM_H, SIM_W } from '../types';

export function wrapSvg(inner: string, scale = 1): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIM_W * scale}" height="${SIM_H * scale}" viewBox="0 0 ${SIM_W} ${SIM_H}">${inner}</svg>`;
}

/** Deterministic PRNG so scenes look identical on every load. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const blur = (id: string, sd: number) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

export const linGrad = (id: string, stops: [number, string][], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`;

export const radGrad = (id: string, stops: [number, string, number?][]) =>
  `<radialGradient id="${id}">${stops
    .map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op ?? 1}"/>`)
    .join('')}</radialGradient>`;

/** A leafy deciduous tree made of overlapping canopy blobs. */
export function tree(
  r: () => number,
  x: number,
  groundY: number,
  h: number,
  colors: string[],
  trunk = '#4a3626',
): string {
  const w = h * 0.08;
  let s = `<path d="M${x - w / 2},${groundY} L${x - w * 0.3},${groundY - h * 0.55} L${x + w * 0.3},${groundY - h * 0.55} L${x + w / 2},${groundY} Z" fill="${trunk}"/>`;
  const cy = groundY - h * 0.68;
  const cr = h * 0.34;
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * cr * 0.75;
    const rr = cr * (0.35 + r() * 0.35);
    const c = colors[Math.floor(r() * colors.length)];
    s += `<circle cx="${x + Math.cos(a) * d}" cy="${cy + Math.sin(a) * d * 0.8}" r="${rr}" fill="${c}"/>`;
  }
  return s;
}

/** A conifer. */
export function pine(x: number, groundY: number, h: number, fill: string, trunk = '#3b2a1e'): string {
  const w = h * 0.42;
  let s = `<rect x="${x - h * 0.03}" y="${groundY - h * 0.15}" width="${h * 0.06}" height="${h * 0.15}" fill="${trunk}"/>`;
  for (let i = 0; i < 4; i++) {
    const top = groundY - h + i * h * 0.2;
    const bw = w * (0.45 + i * 0.2);
    const by = top + h * 0.38;
    s += `<path d="M${x},${top} L${x + bw / 2},${by} L${x - bw / 2},${by} Z" fill="${fill}"/>`;
  }
  return s;
}

/** A jointed limb drawn as a rounded polyline. */
export const limb = (pts: [number, number][], color: string, width: number) =>
  `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
