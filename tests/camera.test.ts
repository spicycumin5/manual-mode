import { describe, expect, it } from 'vitest';
import { computeMetrics, resolveExposure } from '../src/sim/camera';
import { DEFAULT_SETTINGS, Scene } from '../src/sim/types';

const scene: Scene = {
  id: 't',
  name: 'test',
  blurb: '',
  ev100: 14,
  baseFocal: 24,
  subjectLayer: 'subj',
  meterBias: { evaluative: 1.5, center: 1, spot: 0 },
  focalRange: [24, 200],
  defaults: {},
  layers: [
    { id: 'bg', name: 'bg', svg: '', distance: 40 },
    { id: 'subj', name: 'subj', svg: '', distance: 3, motion: { x: 600, y: 0 } },
  ],
};

describe('camera resolver', () => {
  it('Av mode picks a shutter so the meter reads the comp value', () => {
    const r = resolveExposure(scene, { ...DEFAULT_SETTINGS, mode: 'Av', aperture: 4, iso: 100, comp: 0 });
    expect(Math.abs(r.meterReading)).toBeLessThan(0.2);
    // Meter is fooled by +1.5 → actual exposure is about 1.5 stops under.
    expect(r.offset).toBeCloseTo(-1.5, 0);
  });

  it('spot metering is not fooled', () => {
    const r = resolveExposure(scene, { ...DEFAULT_SETTINGS, mode: 'Av', meterMode: 'spot' });
    expect(Math.abs(r.offset)).toBeLessThan(0.2);
  });

  it('auto ISO in manual hits the target', () => {
    const r = resolveExposure(scene, {
      ...DEFAULT_SETTINGS,
      autoIso: true,
      aperture: 2.8,
      shutter: 1 / 4000,
      meterMode: 'spot',
    });
    expect(Math.abs(r.offset)).toBeLessThan(0.2);
    expect(r.iso).toBeGreaterThan(100);
  });

  it('fast shutter freezes the subject, panning freezes it too', () => {
    const fast = computeMetrics(scene, { ...DEFAULT_SETTINGS, shutter: 1 / 2000 });
    const slow = computeMetrics(scene, { ...DEFAULT_SETTINGS, shutter: 1 / 30 });
    const pan = computeMetrics(scene, { ...DEFAULT_SETTINGS, shutter: 1 / 30, pan: true, tripod: true });
    expect(fast.subjectMotionPx).toBeLessThan(1);
    expect(slow.subjectMotionPx).toBeGreaterThan(10);
    expect(pan.subjectMotionPx).toBeCloseTo(0);
    expect(Math.abs(pan.layers[0].motionPx.x)).toBeGreaterThan(10);
  });

  it('background blur grows with wider aperture', () => {
    const wide = computeMetrics(scene, { ...DEFAULT_SETTINGS, aperture: 1.8 });
    const narrow = computeMetrics(scene, { ...DEFAULT_SETTINGS, aperture: 16 });
    expect(wide.backgroundBlurPx).toBeGreaterThan(narrow.backgroundBlurPx * 5);
  });
});
