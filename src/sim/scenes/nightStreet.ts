import type { Scene } from '../types';
import { blur, limb, linGrad, rng } from './svg';

const r = rng(42);

const sky = `
<defs>${linGrad('s', [[0, '#05081a'], [0.5, '#141a3c'], [0.62, '#2a2650']])}</defs>
<rect width="960" height="640" fill="url(#s)"/>`;

let city = '';
let x = -10;
while (x < 970) {
  const w = 50 + r() * 70;
  const h = 120 + r() * 200;
  const top = 380 - h;
  city += `<rect x="${x}" y="${top}" width="${w}" height="${h + 260}" fill="${r() > 0.5 ? '#141828' : '#1a1f30'}"/>`;
  for (let wy = top + 10; wy < 370; wy += 14) {
    for (let wx = x + 6; wx < x + w - 8; wx += 11) {
      if (r() < 0.32) {
        const c = r() > 0.25 ? '#e9b45c' : '#9ec9ff';
        city += `<rect x="${wx}" y="${wy}" width="5" height="7" fill="${c}" opacity="${0.5 + r() * 0.5}"/>`;
      }
    }
  }
  x += w + 2;
}
const bgCity = `${city}<rect y="380" width="960" height="260" fill="#10131f"/>`;

// Shopfronts and lamp posts across the street.
let mid = `<defs>${blur('g', 6)}</defs>`;
const shops = [
  [20, '#3a1d2e', '#ff4f8b'],
  [250, '#1d2b3a', '#4fd1ff'],
  [500, '#2b2a1d', '#ffd24f'],
  [730, '#1d3a2b', '#5dff9a'],
] as const;
for (const [sx, wall, neon] of shops) {
  mid += `<rect x="${sx}" y="300" width="210" height="120" fill="${wall}"/>
  <rect x="${sx + 20}" y="345" width="170" height="70" fill="#f2c27a" opacity="0.55"/>
  <rect x="${sx + 40}" y="315" width="130" height="18" rx="4" fill="none" stroke="${neon}" stroke-width="4"/>`;
}
for (let px = 120; px < 960; px += 260) {
  mid += `<rect x="${px}" y="190" width="7" height="230" fill="#0d0f16"/><path d="M${px - 4},192 h40 v6 h-40z" fill="#0d0f16"/>`;
}

let lights = `<defs>${blur('h', 3)}</defs>`;
for (let px = 120; px < 960; px += 260) lights += `<circle cx="${px + 30}" cy="202" r="7" fill="#ffd9a0"/>`;
for (const [sx, , neon] of shops) {
  for (let i = 0; i < 6; i++) lights += `<circle cx="${sx + 45 + i * 24}" cy="324" r="2.6" fill="${neon}"/>`;
}
for (let i = 0; i < 40; i++) {
  lights += `<circle cx="${r() * 960}" cy="${120 + r() * 240}" r="${1.2 + r() * 1.6}" fill="${r() > 0.3 ? '#ffcf87' : '#bfe0ff'}" opacity="0.8"/>`;
}

const road = `
<defs>${linGrad('rd', [[0, '#16181f'], [1, '#262833']])}${blur('w', 5)}</defs>
<rect y="420" width="960" height="220" fill="url(#rd)"/>
<g fill="#c9c9b0" opacity="0.6">${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 130}" y="488" width="70" height="5"/>`).join('')}</g>
<g filter="url(#w)" opacity="0.35">
  <rect x="140" y="430" width="14" height="120" fill="#ffd9a0"/><rect x="400" y="430" width="14" height="120" fill="#ffd9a0"/>
  <rect x="660" y="430" width="14" height="120" fill="#ffd9a0"/><rect x="60" y="430" width="30" height="80" fill="#ff4f8b"/>
</g>
<rect y="560" width="960" height="80" fill="#2e2f38"/><rect y="556" width="960" height="5" fill="#4a4b55"/>`;

const car = (cx: number, y: number, col: string) =>
  `<path d="M${cx - 80},${y} q4,-24 30,-26 l20,-22 h64 l26,22 q36,2 42,26 z" fill="${col}"/>
   <circle cx="${cx - 48}" cy="${y}" r="13" fill="#07080b"/><circle cx="${cx + 50}" cy="${y}" r="13" fill="#07080b"/>`;
const carsLeft = car(260, 470, '#1b1e26') + car(760, 470, '#251a1a');
const carsRight = car(420, 530, '#1a2026') + car(900, 530, '#1e1e24');

const lightsLeft = `<circle cx="182" cy="456" r="6" fill="#fff6e0"/><circle cx="682" cy="456" r="6" fill="#fff6e0"/>
<circle cx="340" cy="452" r="4" fill="#ff2a2a"/><circle cx="840" cy="452" r="4" fill="#ff2a2a"/>`;
const lightsRight = `<circle cx="342" cy="512" r="5" fill="#ff2a2a"/><circle cx="822" cy="512" r="5" fill="#ff2a2a"/>
<circle cx="500" cy="516" r="6" fill="#fff6e0"/>`;

const skin = '#c68a5a';
const person = `
<ellipse cx="770" cy="626" rx="50" ry="8" fill="#000" opacity="0.4"/>
${limb([[760, 500], [756, 618]], '#2a2f45', 20)}
${limb([[782, 500], [790, 618]], '#2a2f45', 20)}
<path d="M744,390 q26,-14 52,0 l8,118 h-68 z" fill="#8a2f2f"/>
${limb([[748, 400], [734, 460], [744, 500]], '#7a2828', 16)}
${limb([[798, 400], [812, 455], [800, 480]], '#7a2828', 16)}
<circle cx="770" cy="362" r="22" fill="${skin}"/>
<path d="M747,360 q2,-30 26,-28 q22,2 20,26 q-6,-14 -22,-14 q-14,0 -24,16 z" fill="#2b1a10"/>
<rect x="796" y="465" width="12" height="20" rx="2" fill="#9fd3ff"/>
<path d="M792,380 q10,30 6,130" stroke="#ffd9a0" stroke-width="2" opacity="0.6" fill="none"/>`;

export const nightStreet: Scene = {
  id: 'night-street',
  name: 'Night street',
  blurb: 'City street after dark: low light, light trails, and bokeh from street lamps.',
  ev100: 4,
  baseFocal: 24,
  subjectLayer: 'person',
  meterBias: { evaluative: -0.7, center: -0.3, spot: 0.3 },
  focalRange: [24, 135],
  defaults: { aperture: 2.8, shutter: 1 / 30, iso: 1600, focal: 35 },
  layers: [
    { id: 'sky', name: 'Sky', svg: sky, distance: 3000, bleed: true, hiRes: true },
    { id: 'bgCity', name: 'Skyline', svg: bgCity, distance: 90, bleed: true, hiRes: true, focusable: true },
    { id: 'mid', name: 'Shopfronts', svg: mid, distance: 28, hiRes: true, focusable: true },
    { id: 'lamps', name: 'Lamps', svg: lights, distance: 28, intensity: 6, hiRes: true },
    { id: 'road', name: 'Road', svg: road, distance: 9, bleed: true },
    { id: 'carsL', name: 'Cars (far lane)', svg: carsLeft, distance: 13, motion: { x: -1100, y: 0 } },
    { id: 'carLightsL', name: 'Headlights', svg: lightsLeft, distance: 13, motion: { x: -1100, y: 0 }, intensity: 12 },
    { id: 'carsR', name: 'Cars (near lane)', svg: carsRight, distance: 9, motion: { x: 1300, y: 0 } },
    { id: 'carLightsR', name: 'Tail lights', svg: lightsRight, distance: 9, motion: { x: 1300, y: 0 }, intensity: 12 },
    { id: 'person', name: 'Person', svg: person, distance: 4, focusable: true },
  ],
};
