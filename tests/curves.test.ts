import { describe, expect, it } from 'vitest';
import { buildLut, IDENTITY } from '../src/edit/curves';

describe('tone curve LUT', () => {
  it('identity curve is a no-op', () => {
    const lut = buildLut(IDENTITY);
    for (let i = 0; i < 256; i++) expect(lut[i]).toBeCloseTo(i / 255, 5);
  });

  it('S-curve is monotone and adds contrast', () => {
    const lut = buildLut([[0, 0], [0.25, 0.18], [0.75, 0.84], [1, 1]]);
    for (let i = 1; i < 256; i++) expect(lut[i]).toBeGreaterThanOrEqual(lut[i - 1] - 1e-6);
    expect(lut[64]).toBeLessThan(64 / 255);
    expect(lut[192]).toBeGreaterThan(192 / 255);
  });

  it('lifted black point gives a faded floor', () => {
    const lut = buildLut([[0, 0.12], [1, 1]]);
    expect(lut[0]).toBeCloseTo(0.12, 3);
  });

  it('handles unsorted points', () => {
    const lut = buildLut([[1, 1], [0, 0], [0.5, 0.6]]);
    expect(lut[128]).toBeCloseTo(0.6, 1);
  });
});
