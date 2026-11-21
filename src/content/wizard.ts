import { solveIso, solveShutter } from '../sim/exposure';
import { APERTURES, ISOS, SHUTTERS, formatAperture, formatShutter, nearest } from '../sim/stops';

export type Motion = 'none' | 'slow' | 'fast' | 'veryfast';
export type Light = 'sun' | 'shade' | 'indoor' | 'night';
export type Depth = 'blur' | 'sharp' | 'any';

export interface WizardInput {
  motion: Motion;
  light: Light;
  tripod: boolean;
  depth: Depth;
  showMotion: boolean;
}

export interface WizardResult {
  mode: string;
  aperture: string;
  shutter: string;
  iso: string;
  focus: string;
  reasons: string[];
  warnings: string[];
  related: string[];
}

const LIGHT_EV: Record<Light, number> = { sun: 15, shade: 12, indoor: 7, night: 3 };

export function recommend(i: WizardInput): WizardResult {
  const ev = LIGHT_EV[i.light];
  const reasons: string[] = [];
  const warnings: string[] = [];
  const related: string[] = [];

  let N = i.depth === 'blur' ? 2 : i.depth === 'sharp' ? 8 : 5.6;
  let t: number;
  const moving = i.motion !== 'none';

  if (moving && i.showMotion) {
    if (i.tripod) {
      t = 1;
      reasons.push('A long exposure on a tripod lets moving things blur into streaks while static parts stay sharp.');
      related.push('waterfall', 'light-trails');
    } else {
      t = 1 / 30;
      reasons.push('Handheld, the way to show motion is panning: follow the subject at around 1/30 s so the background streaks.');
      related.push('panning');
    }
  } else if (moving) {
    t = { slow: 1 / 250, fast: 1 / 1000, veryfast: 1 / 2000 }[i.motion as Exclude<Motion, 'none'>];
    reasons.push(`To freeze ${i.motion === 'slow' ? 'walking people' : i.motion === 'fast' ? 'running and sports' : 'birds, cars and splashes'}, use ${formatShutter(t)} or faster.`);
    related.push(i.motion === 'veryfast' ? 'birds' : 'kids-sports');
  } else if (i.tripod) {
    t = solveShutter(ev, N, 100);
    reasons.push('Nothing is moving and you have a tripod, so keep ISO at 100 and let the shutter run as long as needed.');
  } else {
    t = 1 / 125;
    reasons.push('Handheld, stay at about 1/125 s or faster (or 1/focal length) to avoid camera shake.');
  }

  if (i.depth === 'blur') {
    reasons.push('A wide aperture (f/1.8–f/2.8) blurs the background. Get close and keep the background far away.');
    related.push('portrait');
  } else if (i.depth === 'sharp') {
    reasons.push('f/8 gives deep depth of field and is the sharpest aperture on most lenses. Focus about a third into the scene.');
    related.push('golden-hour');
  }

  let iso = solveIso(ev, N, t);
  if (iso < 100) {
    // Too much light.
    if (!(moving && i.showMotion)) {
      t = solveShutter(ev, N, 100);
      if (t < SHUTTERS[SHUTTERS.length - 1]) {
        N = nearest(APERTURES, Math.min(22, N * 2));
        t = solveShutter(ev, N, 100);
      }
    } else {
      N = 16;
      const isoAt16 = solveIso(ev, N, t);
      if (isoAt16 < 100) {
        const stops = Math.ceil(Math.log2(100 / isoAt16));
        warnings.push(`Even at f/16 and ISO 100 this is ${stops} stops too bright. Use an ND filter of about ${stops} stops.`);
        related.push('waterfall');
      }
    }
    iso = Math.max(100, solveIso(ev, N, t));
  }
  if (iso > 12800 && i.tripod && !moving) {
    t = Math.min(30, solveShutter(ev, N, 3200));
    iso = solveIso(ev, N, t);
  }
  if (iso > 12800) {
    const nWide = 1.4;
    if (N > nWide && i.depth !== 'sharp') {
      N = nWide;
      iso = solveIso(ev, N, t);
      reasons.push('There is very little light, so open the aperture all the way.');
    }
    if (iso > 25600) warnings.push('This is beyond what a camera can do without more light: add a flash, a lamp, a tripod, or accept some motion blur.');
  }
  if (iso > 3200 && iso <= 25600) reasons.push(`ISO ${nearest(ISOS, iso)} is high but fine. Noise is better than blur or a dark photo.`);
  if (i.light === 'night' && !i.tripod && !moving) related.push('indoor');
  if (i.light === 'night' && i.tripod && !moving) related.push('milky-way');

  const mode = moving && !i.showMotion ? 'M + Auto ISO (or Tv)' : i.depth !== 'any' && !i.tripod ? 'Av (aperture priority) with Auto ISO' : i.tripod ? 'M (manual)' : 'Av or M + Auto ISO';
  const focus = moving ? 'AF-C (continuous) with tracking' : 'AF-S (single) on your subject';

  return {
    mode,
    aperture: formatAperture(nearest(APERTURES, N)),
    shutter: formatShutter(nearest(SHUTTERS, Math.min(30, t))),
    iso: `${nearest(ISOS, Math.min(25600, Math.max(100, iso)))}`,
    focus,
    reasons,
    warnings,
    related: Array.from(new Set(related)),
  };
}
