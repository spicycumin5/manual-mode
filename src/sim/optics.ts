// Thin-lens optics for depth of field. Distances in meters, focal length in mm.

export const FULL_FRAME_WIDTH_MM = 36;

/** Circle-of-confusion limit (mm) for "acceptably sharp" at a given crop factor. */
export function cocLimit(crop = 1): number {
  return 0.03 / crop;
}

/** Hyperfocal distance in meters. */
export function hyperfocal(focalMm: number, N: number, crop = 1): number {
  const f = focalMm;
  const c = cocLimit(crop);
  return ((f * f) / (N * c) + f) / 1000;
}

/** Near and far limits of acceptable sharpness (m). far = Infinity beyond hyperfocal. */
export function dofLimits(focalMm: number, N: number, focusM: number, crop = 1) {
  const H = hyperfocal(focalMm, N, crop);
  const f = focalMm / 1000;
  const s = focusM;
  const near = (s * (H - f)) / (H + s - 2 * f);
  const far = s >= H ? Infinity : (s * (H - f)) / (H - s);
  return { near, far, total: far - near, hyperfocal: H };
}

/**
 * Diameter (mm, on the sensor) of the blur disc for an object at distance d
 * when the lens is focused at s.
 */
export function blurDiscMm(focalMm: number, N: number, focusM: number, objectM: number): number {
  const f = focalMm;
  const s = focusM * 1000;
  const d = objectM * 1000;
  if (s <= f) return 0;
  return ((f * f) / (N * (s - f))) * (Math.abs(d - s) / d);
}

/** Airy disk diameter (mm): diffraction softening that grows as the aperture closes. */
export function airyDiskMm(N: number, wavelengthMm = 0.00055): number {
  return 2.44 * wavelengthMm * N;
}

/** Converts a size on the sensor (mm) to pixels in an image `imageWidthPx` wide. */
export function sensorMmToPx(mm: number, imageWidthPx: number, crop = 1): number {
  return (mm / (FULL_FRAME_WIDTH_MM / crop)) * imageWidthPx;
}

/** Horizontal field of view in degrees. */
export function fieldOfView(focalMm: number, crop = 1): number {
  return (2 * Math.atan(FULL_FRAME_WIDTH_MM / crop / (2 * focalMm)) * 180) / Math.PI;
}

/** NPF rule (simplified): longest star exposure before trailing, in seconds. */
export function npfRule(focalMm: number, N: number, pixelPitchUm: number, crop = 1): number {
  return (35 * N + 30 * pixelPitchUm) / (focalMm * crop);
}

/** The older, looser 500 rule. */
export function rule500(focalMm: number, crop = 1): number {
  return 500 / (focalMm * crop);
}

/** Exposure time with an ND filter of `stops` stops. */
export function ndExposure(baseT: number, stops: number): number {
  return baseT * Math.pow(2, stops);
}
