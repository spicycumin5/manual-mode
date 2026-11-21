import { IDENTITY, Pt } from './curves';

export const HSL_BANDS = [
  { name: 'Red', hue: 0, color: '#e5484d' },
  { name: 'Orange', hue: 30, color: '#f08a24' },
  { name: 'Yellow', hue: 60, color: '#e8c829' },
  { name: 'Green', hue: 120, color: '#46a758' },
  { name: 'Aqua', hue: 180, color: '#12a5a5' },
  { name: 'Blue', hue: 225, color: '#3e63dd' },
  { name: 'Purple', hue: 270, color: '#8e4ec6' },
  { name: 'Magenta', hue: 315, color: '#d6409f' },
];

export interface EditParams {
  exposure: number; // stops
  contrast: number; // -100..100
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temp: number; // -100 (cool) .. 100 (warm)
  tint: number; // -100 (green) .. 100 (magenta)
  curves: { rgb: Pt[]; r: Pt[]; g: Pt[]; b: Pt[] };
  hslHue: number[];
  hslSat: number[];
  hslLum: number[];
  vibrance: number;
  saturation: number;
  gradeShadowHue: number; // degrees
  gradeShadowSat: number; // 0..100
  gradeHighHue: number;
  gradeHighSat: number;
  gradeBalance: number; // -100..100
}

export const DEFAULT_PARAMS: EditParams = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temp: 0,
  tint: 0,
  curves: { rgb: IDENTITY, r: IDENTITY, g: IDENTITY, b: IDENTITY },
  hslHue: new Array(8).fill(0),
  hslSat: new Array(8).fill(0),
  hslLum: new Array(8).fill(0),
  vibrance: 0,
  saturation: 0,
  gradeShadowHue: 200,
  gradeShadowSat: 0,
  gradeHighHue: 40,
  gradeHighSat: 0,
  gradeBalance: 0,
};

export function withParams(p: Partial<EditParams>): EditParams {
  return { ...DEFAULT_PARAMS, ...p, curves: { ...DEFAULT_PARAMS.curves, ...(p.curves ?? {}) } };
}
