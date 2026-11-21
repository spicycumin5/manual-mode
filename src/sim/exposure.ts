// Exposure math. All EV values are EV100 (exposure value referenced to ISO 100).

/** EV of an aperture/shutter pair at ISO 100: log2(N² / t). */
export function ev100(N: number, t: number): number {
  return Math.log2((N * N) / t);
}

/** The scene EV100 that these settings would expose "correctly" for. */
export function settingsEv100(N: number, t: number, iso: number): number {
  return ev100(N, t) - Math.log2(iso / 100);
}

/**
 * How many stops over (+) or under (−) exposed a shot is, given the scene's light level.
 * A brighter scene (higher EV) with the same settings gives more exposure.
 */
export function exposureOffset(sceneEv100: number, N: number, t: number, iso: number): number {
  return sceneEv100 - settingsEv100(N, t, iso);
}

/** Linear brightness multiplier for an exposure offset in stops. */
export function gainFromOffset(offsetStops: number): number {
  return Math.pow(2, offsetStops);
}

/** Shutter time (s) that exposes the scene at `targetOffset` stops, given N and ISO. */
export function solveShutter(sceneEv100: number, N: number, iso: number, targetOffset = 0): number {
  const e = sceneEv100 - targetOffset + Math.log2(iso / 100);
  return (N * N) / Math.pow(2, e);
}

/** Aperture that exposes the scene at `targetOffset`, given t and ISO. */
export function solveAperture(sceneEv100: number, t: number, iso: number, targetOffset = 0): number {
  const e = sceneEv100 - targetOffset + Math.log2(iso / 100);
  return Math.sqrt(t * Math.pow(2, e));
}

/** ISO that exposes the scene at `targetOffset`, given N and t. */
export function solveIso(sceneEv100: number, N: number, t: number, targetOffset = 0): number {
  return 100 * Math.pow(2, ev100(N, t) - (sceneEv100 - targetOffset));
}

/** Slowest "safe" handheld shutter speed: 1 / (focal × crop), extended by stabilization stops. */
export function safeHandheldShutter(focalMm: number, crop = 1, ibisStops = 0): number {
  return (1 / (focalMm * crop)) * Math.pow(2, ibisStops);
}

/** Rough noise standard deviation (display units 0–1) for an ISO value. */
export function noiseSigma(iso: number): number {
  return 0.0055 * Math.sqrt(iso / 100);
}

/** Classic light levels, for teaching. */
export const LIGHT_LEVELS: { ev: number; label: string }[] = [
  { ev: 16, label: 'Snow or sand in bright sun' },
  { ev: 15, label: 'Bright sun, distinct shadows (Sunny 16)' },
  { ev: 13, label: 'Cloudy bright, soft shadows' },
  { ev: 12, label: 'Heavy overcast / open shade' },
  { ev: 10, label: 'Just after sunset' },
  { ev: 8, label: 'Bright indoor lighting, floodlit stadium' },
  { ev: 6, label: 'Home interior at night' },
  { ev: 3, label: 'Night street with streetlights' },
  { ev: -2, label: 'Full moon landscape' },
  { ev: -7, label: 'Milky Way, no moon' },
];
