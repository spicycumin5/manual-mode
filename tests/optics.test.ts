import { describe, expect, it } from 'vitest';
import { blurDiscMm, dofLimits, hyperfocal, npfRule, rule500 } from '../src/sim/optics';

describe('optics', () => {
  it('hyperfocal distance matches reference (50mm f/8 FF ≈ 10.4 m)', () => {
    expect(hyperfocal(50, 8)).toBeCloseTo(10.47, 1);
  });

  it('DoF limits match a reference calculator (50mm f/2.8 @ 3 m)', () => {
    // Reference (c = 0.03): near ≈ 2.73 m, far ≈ 3.33 m
    const d = dofLimits(50, 2.8, 3);
    expect(d.near).toBeCloseTo(2.73, 1);
    expect(d.far).toBeCloseTo(3.33, 1);
  });

  it('far limit is infinite at/after hyperfocal', () => {
    const H = hyperfocal(24, 11);
    expect(dofLimits(24, 11, H + 0.1).far).toBe(Infinity);
  });

  it('wider aperture and longer lens blur the background more', () => {
    const a = blurDiscMm(85, 1.8, 3, 20);
    const b = blurDiscMm(85, 8, 3, 20);
    const c = blurDiscMm(35, 1.8, 3, 20);
    expect(a).toBeGreaterThan(b);
    expect(a).toBeGreaterThan(c);
    expect(blurDiscMm(85, 1.8, 3, 3)).toBe(0);
  });

  it('star rules', () => {
    expect(rule500(20)).toBe(25);
    expect(npfRule(20, 2, 4)).toBeCloseTo(9.5, 1);
  });
});
