// Resolves camera settings against a scene: auto modes, metering, and per-layer blur.
import { APERTURES, ISOS, SHUTTERS, nearest } from './stops';
import {
  exposureOffset,
  noiseSigma,
  safeHandheldShutter,
  solveAperture,
  solveIso,
  solveShutter,
} from './exposure';
import { airyDiskMm, blurDiscMm, dofLimits, sensorMmToPx } from './optics';
import { CameraSettings, SIM_W, Scene } from './types';

const N_MIN = APERTURES[0];
const N_MAX = APERTURES[APERTURES.length - 1];
const T_MIN = SHUTTERS[SHUTTERS.length - 1];
const T_MAX = SHUTTERS[0];
const ISO_MIN = ISOS[0];
const ISO_MAX = ISOS[ISOS.length - 1];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export interface ResolvedExposure {
  N: number;
  t: number;
  iso: number;
  /** True exposure error in stops (+ over, − under). */
  offset: number;
  /** What the camera's meter shows (fooled by bright/dark scenes). */
  meterReading: number;
  /** Which values the camera chose for you. */
  auto: { aperture: boolean; shutter: boolean; iso: boolean };
  /** Camera couldn't reach the target exposure (blinking meter). */
  outOfRange: boolean;
  safeShutter: number;
}

export function sceneEv(scene: Scene, s: CameraSettings) {
  return scene.ev100 - s.nd;
}

export function resolveExposure(scene: Scene, s: CameraSettings): ResolvedExposure {
  const ev = sceneEv(scene, s);
  const bias = scene.meterBias[s.meterMode] ?? 0;
  // Auto exposure makes the *meter* read `comp`, so the true offset is comp − bias.
  const target = s.comp - bias;
  const safe = safeHandheldShutter(s.focal, 1, s.ibisStops);
  let N = s.aperture;
  let t = s.shutter;
  let iso = s.iso;
  const auto = { aperture: false, shutter: false, iso: s.autoIso };

  const snapIso = (v: number) => nearest(ISOS, clamp(v, ISO_MIN, ISO_MAX));
  const snapT = (v: number) => nearest(SHUTTERS, clamp(v, T_MIN, T_MAX));
  const snapN = (v: number) => nearest(APERTURES, clamp(v, N_MIN, N_MAX));

  switch (s.mode) {
    case 'M':
      if (s.autoIso) iso = snapIso(solveIso(ev, N, t, target));
      break;
    case 'Av':
      auto.shutter = true;
      if (s.autoIso) {
        // Keep the shutter at the handheld-safe minimum, raise ISO as needed.
        t = s.tripod ? T_MAX : snapT(Math.min(safe, 1 / 60));
        iso = solveIso(ev, N, t, target);
        if (iso < ISO_MIN) {
          iso = ISO_MIN;
          t = snapT(solveShutter(ev, N, iso, target));
        } else if (s.tripod) {
          iso = ISO_MIN;
          t = snapT(solveShutter(ev, N, iso, target));
        }
        iso = snapIso(iso);
      } else {
        t = snapT(solveShutter(ev, N, iso, target));
      }
      break;
    case 'Tv':
      auto.aperture = true;
      if (s.autoIso) {
        N = snapN(solveAperture(ev, t, ISO_MIN, target));
        iso = snapIso(solveIso(ev, N, t, target));
      } else {
        N = snapN(solveAperture(ev, t, iso, target));
      }
      break;
    case 'P': {
      auto.aperture = true;
      auto.shutter = true;
      if (s.autoIso) iso = ISO_MIN;
      // Program line: split exposure between aperture and shutter, protecting hand-holdability.
      const e = ev - target + Math.log2(iso / 100);
      let av = clamp((e - 6) / 2 + 2, Math.log2(N_MIN * N_MIN), Math.log2(N_MAX * N_MAX));
      N = Math.sqrt(Math.pow(2, av));
      t = (N * N) / Math.pow(2, e);
      if (t > safe && !s.tripod) {
        N = N_MIN;
        av = Math.log2(N * N);
        t = (N * N) / Math.pow(2, e);
        if (t > safe && s.autoIso) {
          t = safe;
          iso = solveIso(ev, N, t, target);
        }
      }
      N = snapN(N);
      t = snapT(t);
      iso = snapIso(iso);
      break;
    }
  }

  const offset = exposureOffset(ev, N, t, iso);
  const meterReading = offset + bias;
  const autoOn = s.mode !== 'M' || s.autoIso;
  return {
    N,
    t,
    iso,
    offset,
    meterReading,
    auto,
    outOfRange: autoOn && Math.abs(meterReading - s.comp) > 0.5,
    safeShutter: safe,
  };
}

export interface LayerMetrics {
  id: string;
  scale: number;
  distance: number;
  dofPx: number; // blur disc diameter (px)
  motionPx: { x: number; y: number }; // blur vector during exposure (px)
  intensity: number;
}

export interface SimMetrics {
  exposure: ResolvedExposure;
  layers: LayerMetrics[];
  shakePx: number;
  noise: number;
  diffractionPx: number;
  focusDistance: number;
  dof: { near: number; far: number };
  subjectBlurPx: number; // combined motion + shake + defocus on the subject
  subjectMotionPx: number;
  backgroundBlurPx: number; // defocus of the farthest layer
  vignette: number;
}

const SHAKE_RATE = 0.04; // rad/s of typical hand tremor (calibrated to the 1/focal rule)

export function computeMetrics(scene: Scene, s: CameraSettings): SimMetrics {
  const exposure = resolveExposure(scene, s);
  const { N, t } = exposure;
  const f = s.focal;
  const f0 = scene.baseFocal;
  const subj = scene.layers.find((l) => l.id === scene.subjectLayer)!;
  const s0 = subj.distance;
  const sNow = (s0 * f) / f0;

  const placed = scene.layers.map((l) => {
    const d = Math.max(0.25, sNow + (l.distance - s0));
    // Foreground layers would shrink toward the center; keep them framed at 1× instead.
    const scale = Math.max(1, (f / d) / (f0 / l.distance));
    return { l, d, scale };
  });

  const focusId = s.focusLayer || scene.subjectLayer;
  const focusD = placed.find((p) => p.l.id === focusId)?.d ?? sNow;

  const subjMotion = subj.motion ?? { x: 0, y: 0 };
  const shakePx = s.tripod
    ? 0
    : (SHAKE_RATE * t * f) / 36 * SIM_W / Math.pow(2, s.ibisStops);
  const diffractionPx = sensorMmToPx(airyDiskMm(N), SIM_W);

  const layers: LayerMetrics[] = placed.map(({ l, d, scale }) => {
    const m = l.motion ?? { x: 0, y: 0 };
    let vx = m.x * scale;
    let vy = m.y * scale;
    if (s.pan) {
      vx -= subjMotion.x;
      vy -= subjMotion.y;
    }
    return {
      id: l.id,
      scale,
      distance: d,
      dofPx: sensorMmToPx(blurDiscMm(f, N, focusD, d), SIM_W),
      motionPx: { x: vx * t, y: vy * t },
      intensity: l.intensity ?? 1,
    };
  });

  const subjL = layers.find((l) => l.id === scene.subjectLayer)!;
  const subjectMotionPx = Math.hypot(subjL.motionPx.x, subjL.motionPx.y);
  const subjectBlurPx = Math.hypot(subjectMotionPx, shakePx, subjL.dofPx, diffractionPx);
  const farthest = layers.reduce((a, b) => (b.distance > a.distance ? b : a));
  const dof = dofLimits(f, N, focusD);

  return {
    exposure,
    layers,
    shakePx,
    noise: noiseSigma(exposure.iso),
    diffractionPx,
    focusDistance: focusD,
    dof: { near: dof.near, far: dof.far },
    subjectBlurPx,
    subjectMotionPx,
    backgroundBlurPx: farthest.dofPx,
    vignette: clamp((4 - N) / 2.6, 0, 1) * 0.35,
  };
}
