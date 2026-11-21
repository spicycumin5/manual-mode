import type { CameraSettings } from '../sim/types';
import type { EditParams } from './params';

export type PanelKey = 'basic' | 'wb' | 'curves' | 'hsl' | 'color' | 'grade';

export interface ExerciseDef {
  id: string;
  title: string;
  brief: string;
  image: { scene: string; settings: Partial<CameraSettings> };
  start?: Partial<EditParams>;
  target: Partial<EditParams>;
  panels: PanelKey[];
}

export const EXERCISES: Record<string, ExerciseDef> = {
  'fix-flat': {
    id: 'fix-flat',
    title: 'Rescue a dull photo',
    brief: 'This shot is underexposed and flat. Bring back brightness and contrast to match the target.',
    image: { scene: 'park-runner', settings: { aperture: 8, shutter: 1 / 250, iso: 100, focal: 50 } },
    start: { exposure: -1, contrast: -40 },
    target: { exposure: 0, contrast: 0 },
    panels: ['basic'],
  },
  's-curve': {
    id: 's-curve',
    title: 'Add punch with an S-curve',
    brief: 'Use only the tone curve: darken the shadows and brighten the highlights to match the target.',
    image: { scene: 'waterfall', settings: { aperture: 11, shutter: 0.5, iso: 100, tripod: true, nd: 3 } },
    target: { curves: { rgb: [[0, 0], [0.25, 0.16], [0.75, 0.86], [1, 1]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] } },
    panels: ['curves'],
  },
  'faded-film': {
    id: 'faded-film',
    title: 'Faded film look',
    brief: 'Lift the black point on the curve for a matte, faded finish.',
    image: { scene: 'portrait', settings: { aperture: 2, shutter: 1 / 3200, iso: 200, focal: 85 } },
    target: { curves: { rgb: [[0, 0.14], [0.5, 0.52], [1, 0.95]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] } },
    panels: ['curves'],
  },
  'fix-wb': {
    id: 'fix-wb',
    title: 'Fix the color cast',
    brief: 'The camera got white balance wrong and everything looks blue. Make it neutral again.',
    image: { scene: 'portrait', settings: { aperture: 2.8, shutter: 1 / 1600, iso: 200, focal: 85 } },
    start: { temp: -55, tint: 15 },
    target: { temp: 0, tint: 0 },
    panels: ['wb'],
  },
  'moody-sky': {
    id: 'moody-sky',
    title: 'Deep blue sky',
    brief: 'Use HSL to make the sky a deeper, richer blue without changing anything else.',
    image: { scene: 'snow', settings: { mode: 'M', aperture: 8, shutter: 1 / 800, iso: 100, focal: 50 } },
    target: { hslSat: [0, 0, 0, 0, 0, 40, 0, 0], hslLum: [0, 0, 0, 0, 0, -45, 0, 0] },
    panels: ['hsl'],
  },
  'teal-orange': {
    id: 'teal-orange',
    title: 'Teal & orange grade',
    brief: 'The blockbuster look: teal in the shadows, warm orange in the highlights.',
    image: { scene: 'night-street', settings: { aperture: 2, shutter: 1 / 60, iso: 1600, focal: 35 } },
    target: { gradeShadowHue: 190, gradeShadowSat: 60, gradeHighHue: 30, gradeHighSat: 55 },
    panels: ['grade'],
  },
};

export const PRESETS: { name: string; params: Partial<EditParams> }[] = [
  { name: 'Punchy', params: { contrast: 25, vibrance: 35, whites: 15, blacks: 10, curves: { rgb: [[0, 0], [0.25, 0.2], [0.75, 0.82], [1, 1]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] } } },
  { name: 'Faded film', params: { contrast: -10, saturation: -20, temp: 12, curves: { rgb: [[0, 0.12], [0.5, 0.52], [1, 0.94]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0.05], [1, 0.95]] } } },
  { name: 'Teal & orange', params: { gradeShadowHue: 190, gradeShadowSat: 55, gradeHighHue: 32, gradeHighSat: 45, contrast: 15 } },
  { name: 'Black & white', params: { saturation: -100, contrast: 30, curves: { rgb: [[0, 0], [0.25, 0.2], [0.75, 0.82], [1, 1]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] } } },
  { name: 'Warm sunset', params: { temp: 35, tint: 10, vibrance: 30, highlights: -25, gradeHighHue: 30, gradeHighSat: 30 } },
];
