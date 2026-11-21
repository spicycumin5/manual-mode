import type { Scene } from '../types';
import { blur, linGrad, radGrad, rng } from './svg';

const r = rng(7);

let leaves = '';
const greens = ['#2f6b34', '#3d7d3d', '#4f8f45', '#6aa352', '#285a2c', '#7fb35f'];
for (let i = 0; i < 260; i++) {
  leaves += `<circle cx="${r() * 1000 - 20}" cy="${r() * 660 - 10}" r="${14 + r() * 36}" fill="${greens[Math.floor(r() * greens.length)]}" opacity="${0.7 + r() * 0.3}"/>`;
}
let flowers = '';
for (let i = 0; i < 40; i++) {
  flowers += `<circle cx="${r() * 960}" cy="${300 + r() * 340}" r="${6 + r() * 8}" fill="${r() > 0.5 ? '#e86a9a' : '#f4d35e'}"/>`;
}
const bg = `
<defs>${linGrad('s', [[0, '#cfe7b8'], [1, '#8fbf6a']])}</defs>
<rect width="960" height="640" fill="url(#s)"/>
<rect x="560" y="0" width="240" height="160" fill="#e8f4ff"/>
${leaves}${flowers}`;

let sparkles = '';
for (let i = 0; i < 34; i++) {
  sparkles += `<circle cx="${r() * 960}" cy="${r() * 420}" r="${2 + r() * 3}" fill="#fffbe0"/>`;
}

let bushes = `<defs>${blur('b', 1)}</defs>`;
for (let i = 0; i < 60; i++) {
  const left = i < 30;
  const x = left ? r() * 180 : 780 + r() * 180;
  bushes += `<circle cx="${x}" cy="${380 + r() * 260}" r="${20 + r() * 30}" fill="${greens[Math.floor(r() * 4)]}"/>`;
  if (r() > 0.6) bushes += `<circle cx="${x}" cy="${380 + r() * 260}" r="${8 + r() * 6}" fill="#f08bb0"/>`;
}

const skin = '#e0ac84';
const skinShade = '#c98f68';
const subject = `
<defs>${radGrad('face', [[0, '#ecbc95'], [1, skin]])}${linGrad('sw', [[0, '#3b5f8f'], [1, '#2c4a73']])}</defs>
<path d="M300,640 Q310,500 420,470 L540,470 Q650,500 660,640 Z" fill="url(#sw)"/>
<path d="M440,470 L480,540 L520,470 Z" fill="${skinShade}"/>
<rect x="452" y="400" width="56" height="80" rx="20" fill="${skinShade}"/>
<path d="M392,250 Q380,130 480,118 Q585,122 572,250 L578,420 Q560,380 548,320 L412,320 Q400,380 384,420 Z" fill="#3a2316"/>
<ellipse cx="480" cy="300" rx="78" ry="98" fill="url(#face)"/>
<path d="M402,262 Q420,160 500,170 Q560,180 560,250 Q540,205 480,205 Q430,210 402,262 Z" fill="#3a2316"/>
<ellipse cx="452" cy="296" rx="10" ry="6" fill="#2a1a12"/><ellipse cx="510" cy="296" rx="10" ry="6" fill="#2a1a12"/>
<circle cx="455" cy="294" r="2" fill="#fff"/><circle cx="513" cy="294" r="2" fill="#fff"/>
<path d="M436,280 q16,-8 30,-2" stroke="#3a2316" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M496,278 q16,-6 30,2" stroke="#3a2316" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M481,300 q-6,26 -2,34 q8,4 14,0" stroke="${skinShade}" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M458,356 q24,14 46,0" stroke="#b5615a" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="430" cy="335" rx="16" ry="9" fill="#e79b8a" opacity="0.35"/><ellipse cx="532" cy="335" rx="16" ry="9" fill="#e79b8a" opacity="0.35"/>
<circle cx="404" cy="330" r="5" fill="#f4d35e"/>`;

let fgLeaves = '';
for (let i = 0; i < 14; i++) {
  const x = r() > 0.5 ? r() * 140 : 820 + r() * 140;
  const y = r() > 0.5 ? r() * 140 : 500 + r() * 140;
  fgLeaves += `<ellipse cx="${x}" cy="${y}" rx="${40 + r() * 40}" ry="${16 + r() * 14}" transform="rotate(${r() * 180} ${x} ${y})" fill="${greens[Math.floor(r() * 3)]}"/>`;
}

export const portrait: Scene = {
  id: 'portrait',
  name: 'Garden portrait',
  blurb: 'Head-and-shoulders portrait in open shade, with sunlit leaves behind for bokeh.',
  ev100: 12.5,
  baseFocal: 24,
  subjectLayer: 'subject',
  meterBias: { evaluative: 0.3, center: 0, spot: 0 },
  focalRange: [24, 200],
  defaults: { aperture: 8, shutter: 1 / 125, iso: 200, focal: 85 },
  layers: [
    { id: 'bg', name: 'Garden', svg: bg, distance: 25, bleed: true, hiRes: true, focusable: true },
    { id: 'sparkle', name: 'Sun glints', svg: sparkles, distance: 25, intensity: 4, hiRes: true },
    { id: 'bushes', name: 'Flower bushes', svg: bushes, distance: 5, hiRes: true, focusable: true },
    { id: 'subject', name: 'Face (eyes)', svg: subject, distance: 1.0, focusable: true },
    { id: 'fg', name: 'Leaves in front', svg: fgLeaves, distance: 0.55, focusable: true },
  ],
};
