import type { SimMetrics } from '../sim/camera';
import type { CameraSettings } from '../sim/types';
import type { ControlKey } from '../components/Simulator';

export interface Goal {
  label: string;
  hint?: string;
  test: (m: SimMetrics, s: CameraSettings) => boolean;
}

export interface ChallengeDef {
  id: string;
  title: string;
  brief: string;
  scene: string;
  initial?: Partial<CameraSettings>;
  controls?: ControlKey[];
  goals: Goal[];
  success?: string;
  readouts?: boolean;
}

const layer = (m: SimMetrics, id: string) => m.layers.find((l) => l.id === id)!;
const motion = (m: SimMetrics, id: string) => Math.hypot(layer(m, id).motionPx.x, layer(m, id).motionPx.y);

const exposed = (tol = 0.35): Goal => ({
  label: tol <= 0.35 ? 'Exposure within ±⅓ stop' : `Exposure within ±${tol} stop`,
  hint: 'Watch the meter or the "Exposure" readout. Balance the three settings until it sits near zero.',
  test: (m) => Math.abs(m.exposure.offset) <= tol + 0.01,
});
const noShake: Goal = {
  label: 'No camera shake',
  hint: 'Use a shutter speed faster than the "safe handheld" readout, turn on stabilization, or use a tripod.',
  test: (m) => m.shakePx < 1,
};

export const CHALLENGES: Record<string, ChallengeDef> = {
  'freeze-runner': {
    id: 'freeze-runner',
    title: 'Freeze the runner',
    brief: 'Get a tack-sharp shot of the jogger mid-stride, correctly exposed, without cranking the ISO.',
    scene: 'park-runner',
    initial: { mode: 'M', aperture: 8, shutter: 1 / 60, iso: 100, focal: 50 },
    controls: ['aperture', 'shutter', 'iso', 'focal'],
    goals: [
      { label: 'Runner motion blur under 1.5 px', hint: 'A running person needs roughly 1/500 s or faster.', test: (m) => m.subjectMotionPx < 1.5 },
      exposed(),
      { label: 'ISO 800 or lower', hint: 'In bright sun you have plenty of light. Open the aperture instead of raising ISO.', test: (m) => m.exposure.iso <= 800 },
    ],
    success: 'Fast shutter, wider aperture to compensate: the classic trade.',
  },
  'pan-runner': {
    id: 'pan-runner',
    title: 'Pan with the runner',
    brief: 'Follow the runner with the camera so they stay sharp while the background streaks into speed lines.',
    scene: 'park-runner',
    initial: { mode: 'M', aperture: 8, shutter: 1 / 250, iso: 100, focal: 50, pan: true, tripod: true },
    controls: ['aperture', 'shutter', 'iso', 'pan', 'nd'],
    goals: [
      { label: 'Panning turned on', test: (_m, s) => s.pan },
      { label: 'Background streaks at least 20 px', hint: 'Slow the shutter. Panning usually happens around 1/30–1/60 s.', test: (m) => motion(m, 'bgTrees') >= 20 },
      { label: 'Runner stays sharp (under 2 px)', test: (m) => m.subjectBlurPx < 2 },
      exposed(),
    ],
  },
  'creamy-background': {
    id: 'creamy-background',
    title: 'Melt the background',
    brief: 'Make the garden behind the portrait dissolve into soft blur while the eyes stay sharp.',
    scene: 'portrait',
    initial: { mode: 'M', aperture: 8, shutter: 1 / 125, iso: 200, focal: 50 },
    controls: ['aperture', 'shutter', 'iso', 'focal', 'focus'],
    goals: [
      { label: 'Background blur of at least 20 px', hint: 'Open the aperture (small f-number) and use a longer focal length.', test: (m) => m.backgroundBlurPx >= 20 },
      { label: 'Focus on the eyes', test: (_m, s) => s.focusLayer === 'subject' },
      exposed(),
    ],
  },
  'silky-water': {
    id: 'silky-water',
    title: 'Silky waterfall',
    brief: 'Turn the falling water into smooth silk. The rocks must stay perfectly sharp.',
    scene: 'waterfall',
    initial: { mode: 'M', aperture: 8, shutter: 1 / 125, iso: 400, focal: 24, tripod: false },
    controls: ['aperture', 'shutter', 'iso', 'tripod', 'nd'],
    goals: [
      { label: 'Water streaks of 300 px or more', hint: 'You need around ½ s or longer.', test: (m) => motion(m, 'water') >= 300 },
      noShake,
      exposed(),
    ],
    success: 'Long exposure, low ISO, tripod: the landscape photographer’s toolkit.',
  },
  'light-trails': {
    id: 'light-trails',
    title: 'Paint with headlights',
    brief: 'Capture long red-and-white streaks from the passing cars, with a clean, low-noise image.',
    scene: 'night-street',
    initial: { mode: 'M', aperture: 2.8, shutter: 1 / 30, iso: 1600, focal: 35 },
    controls: ['aperture', 'shutter', 'iso', 'tripod', 'focal'],
    goals: [
      { label: 'Car lights streak 500 px or more', hint: 'Seconds, not fractions: try 2–4 s.', test: (m) => motion(m, 'carLightsL') >= 500 },
      { label: 'ISO 400 or lower', hint: 'On a tripod you can afford a long exposure instead of high ISO.', test: (m) => m.exposure.iso <= 400 },
      noShake,
      exposed(0.7),
    ],
  },
  'milky-way': {
    id: 'milky-way',
    title: 'Pin-sharp stars',
    brief: 'Expose the Milky Way brightly without the stars trailing into lines.',
    scene: 'night-sky',
    initial: { mode: 'M', aperture: 5.6, shutter: 30, iso: 1600, focal: 35, tripod: true, focusLayer: 'mountains' },
    controls: ['aperture', 'shutter', 'iso', 'focal', 'focus', 'tripod'],
    goals: [
      { label: 'Star trails under 4 px', hint: 'Shorter shutter or wider lens. The 500 rule is too loose at 100% zoom. Think NPF: about 10 s at 20mm.', test: (m) => motion(m, 'stars') < 4 },
      { label: 'Stars in focus', hint: 'Focus on the stars (infinity).', test: (m) => layer(m, 'stars').dofPx < 2 },
      exposed(0.7),
      { label: 'ISO 6400 or lower', test: (m) => m.exposure.iso <= 6400 },
    ],
  },
  'gym-action': {
    id: 'gym-action',
    title: 'Indoor action',
    brief: 'Freeze the jump shot under dim gym lights, handheld.',
    scene: 'gym',
    initial: { mode: 'M', aperture: 5.6, shutter: 1 / 60, iso: 400, focal: 70 },
    controls: ['aperture', 'shutter', 'iso', 'autoIso', 'focal'],
    goals: [
      { label: 'Player motion blur under 2 px', hint: 'Jumps need 1/500 s or faster.', test: (m) => m.subjectMotionPx < 2 },
      noShake,
      exposed(),
    ],
    success: 'Wide open and high ISO. Noise is better than a blurry or dark photo.',
  },
  'snow-meter': {
    id: 'snow-meter',
    title: 'Make the snow white',
    brief: 'The camera is in aperture priority, and its meter is turning the bright snow grey. Fix it.',
    scene: 'snow',
    initial: { mode: 'Av', aperture: 8, iso: 100, focal: 70, comp: 0 },
    controls: ['mode', 'aperture', 'iso', 'comp', 'meter'],
    goals: [
      exposed(),
      { label: 'Skier frozen (under 2 px)', test: (m) => m.subjectMotionPx < 2 },
    ],
    success: 'Bright scenes need + exposure compensation (or spot metering on a mid-tone).',
  },
  'everything-sharp': {
    id: 'everything-sharp',
    title: 'Front-to-back sharpness',
    brief: 'Landscape style: ferns in the foreground and the forest far behind should all be sharp.',
    scene: 'waterfall',
    initial: { mode: 'M', aperture: 2.8, shutter: 1 / 250, iso: 400, focal: 24, tripod: true, focusLayer: 'rocks' },
    controls: ['aperture', 'shutter', 'iso', 'focal', 'focus', 'tripod'],
    goals: [
      { label: 'Every layer blurred less than 1.5 px', hint: 'Use a wide lens, stop down to f/8–f/11, and focus partway into the scene.', test: (m) => m.layers.every((l) => l.dofPx < 1.5) },
      noShake,
      exposed(),
    ],
  },
  'handheld-night': {
    id: 'handheld-night',
    title: 'Handheld at night',
    brief: 'No tripod. Get a sharp, correctly exposed shot of the person at the bus stop.',
    scene: 'night-street',
    initial: { mode: 'M', aperture: 8, shutter: 1 / 15, iso: 400, focal: 35 },
    controls: ['aperture', 'shutter', 'iso', 'ibis', 'focal'],
    goals: [
      noShake,
      { label: 'Person sharp (under 2.5 px)', test: (m) => m.subjectBlurPx < 2.5 },
      exposed(0.5),
    ],
    success: 'Open up, stay above the safe shutter speed, and let ISO make up the rest.',
  },
};
