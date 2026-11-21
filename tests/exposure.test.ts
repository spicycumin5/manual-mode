import { describe, expect, it } from 'vitest';
import {
  ev100,
  exposureOffset,
  safeHandheldShutter,
  solveAperture,
  solveIso,
  solveShutter,
} from '../src/sim/exposure';
import { formatShutter, nearest, SHUTTERS } from '../src/sim/stops';

describe('exposure math', () => {
  it('matches Sunny 16: f/16, 1/100 s, ISO 100 ≈ EV 15', () => {
    expect(ev100(16, 1 / 100)).toBeCloseTo(14.64, 1);
    expect(Math.round(ev100(16, 1 / 125))).toBe(15);
  });

  it('equivalent exposures have the same offset', () => {
    const a = exposureOffset(15, 16, 1 / 125, 100);
    const b = exposureOffset(15, 8, 1 / 500, 100);
    const c = exposureOffset(15, 16, 1 / 250, 200);
    expect(a).toBeCloseTo(b, 6);
    expect(a).toBeCloseTo(c, 6);
  });

  it('one stop more light → offset +1', () => {
    const base = exposureOffset(12, 5.6, 1 / 125, 100);
    expect(exposureOffset(12, 5.6, 1 / 62.5, 100) - base).toBeCloseTo(1, 6);
    expect(exposureOffset(12, 5.6, 1 / 125, 200) - base).toBeCloseTo(1, 6);
    expect(exposureOffset(12, 4, 1 / 125, 100) - base).toBeCloseTo(1, 1);
  });

  it('solvers invert the offset formula', () => {
    const t = solveShutter(13, 4, 400, 0);
    expect(exposureOffset(13, 4, t, 400)).toBeCloseTo(0, 6);
    const N = solveAperture(10, 1 / 60, 800, 0.7);
    expect(exposureOffset(10, N, 1 / 60, 800)).toBeCloseTo(0.7, 6);
    const iso = solveIso(5, 2.8, 1 / 100, -1);
    expect(exposureOffset(5, 2.8, 1 / 100, iso)).toBeCloseTo(-1, 6);
  });

  it('handheld rule', () => {
    expect(safeHandheldShutter(50)).toBeCloseTo(1 / 50);
    expect(safeHandheldShutter(200, 1.5)).toBeCloseTo(1 / 300);
    expect(safeHandheldShutter(50, 1, 3)).toBeCloseTo(8 / 50);
  });

  it('formats shutter speeds', () => {
    expect(formatShutter(nearest(SHUTTERS, 1 / 250))).toBe('1/250');
    expect(formatShutter(2)).toBe('2s');
  });
});
