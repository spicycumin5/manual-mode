import type { Scene } from '../types';
import { limb, linGrad, rng } from './svg';

const r = rng(5);

let crowd = '';
const shirts = ['#d94b4b', '#3b6fd9', '#f2c14e', '#ffffff', '#2b2b2b', '#4caf6a', '#9b59b6'];
for (let row = 0; row < 7; row++) {
  const y = 150 + row * 34;
  for (let x = 10 + (row % 2) * 12; x < 960; x += 24) {
    if (r() < 0.12) continue;
    crowd += `<circle cx="${x}" cy="${y}" r="7" fill="${['#e0ac84', '#8d5524', '#c68a5a', '#f1c8a0'][Math.floor(r() * 4)]}"/>
    <rect x="${x - 9}" y="${y + 7}" width="18" height="18" rx="5" fill="${shirts[Math.floor(r() * shirts.length)]}"/>`;
  }
}
const bg = `
<defs>${linGrad('w', [[0, '#2a2d38'], [1, '#3a3d4a']])}</defs>
<rect width="960" height="640" fill="url(#w)"/>
<rect y="140" width="960" height="250" fill="#24262f"/>
${Array.from({ length: 8 }, (_, i) => `<rect y="${165 + i * 34}" width="960" height="4" fill="#4a4d5a"/>`).join('')}
${crowd}
<rect x="80" y="40" width="200" height="50" rx="4" fill="#b8323a"/><rect x="680" y="40" width="200" height="50" rx="4" fill="#2d5bb8"/>
<rect x="400" y="30" width="160" height="70" rx="4" fill="#111"/><text x="480" y="78" font-family="monospace" font-size="38" fill="#ff5a3a" text-anchor="middle">42:38</text>`;

const lights = Array.from({ length: 7 }, (_, i) => `<ellipse cx="${80 + i * 135}" cy="12" rx="34" ry="8" fill="#fffbe8"/>`).join('');

const court = `
<defs>${linGrad('c', [[0, '#c48a4c'], [1, '#a86e36']])}</defs>
<rect y="390" width="960" height="250" fill="url(#c)"/>
${Array.from({ length: 16 }, (_, i) => `<rect y="${395 + i * 16}" width="960" height="1" fill="#8f5a2a" opacity="0.4"/>`).join('')}
<path d="M0,470 Q480,430 960,470" stroke="#f5f5f5" stroke-width="4" fill="none"/>
<rect y="600" width="960" height="4" fill="#f5f5f5"/>
<ellipse cx="480" cy="420" rx="300" ry="18" fill="#fff8d8" opacity="0.18"/>`;

const hoop = `
<rect x="770" y="120" width="10" height="290" fill="#555"/>
<rect x="680" y="110" width="150" height="100" fill="#f4f8ff" opacity="0.9" stroke="#d33" stroke-width="4"/>
<rect x="732" y="160" width="46" height="34" fill="none" stroke="#d33" stroke-width="3"/>
<ellipse cx="740" cy="210" rx="34" ry="7" fill="none" stroke="#ff6a1a" stroke-width="5"/>
${Array.from({ length: 6 }, (_, i) => `<line x1="${710 + i * 12}" y1="212" x2="${720 + i * 8}" y2="262" stroke="#eee" stroke-width="2"/>`).join('')}`;

const skin = '#6e4019';
const player = `
${limb([[420, 420], [400, 480], [430, 520]], skin, 20)}
${limb([[452, 420], [490, 460], [470, 520]], skin, 20)}
<path d="M404,400 h66 l6,40 h-80 z" fill="#f2f2f2"/>
<path d="M400,300 q38,-14 74,0 l4,104 h-82 z" fill="#f2f2f2"/>
<text x="437" y="370" font-family="Arial Black, sans-serif" font-size="40" fill="#b8323a" text-anchor="middle">23</text>
${limb([[404, 310], [380, 260], [400, 210]], skin, 17)}
${limb([[470, 306], [510, 256], [540, 222]], skin, 17)}
<circle cx="556" cy="206" r="22" fill="#e46a1a"/><path d="M536,198 q20,10 40,0 M556,184 v44" stroke="#5a2a0a" stroke-width="2" fill="none"/>
<rect x="428" y="270" width="18" height="30" fill="${skin}"/>
<circle cx="438" cy="250" r="24" fill="${skin}"/>
<path d="M414,246 q4,-26 26,-24 q20,2 22,22 q-24,-8 -48,2z" fill="#111"/>
<path d="M420,520 h30 v14 h-36 z M462,518 h30 v14 h-36 z" fill="#111"/>`;

export const gym: Scene = {
  id: 'gym',
  name: 'Indoor basketball',
  blurb: 'A player mid-jump under gym lights: fast action in dim light.',
  ev100: 7,
  baseFocal: 24,
  subjectLayer: 'player',
  meterBias: { evaluative: -0.3, center: 0, spot: 0.3 },
  focalRange: [24, 200],
  defaults: { aperture: 4, shutter: 1 / 60, iso: 800, focal: 70 },
  layers: [
    { id: 'bg', name: 'Crowd', svg: bg, distance: 28, bleed: true, hiRes: true, focusable: true },
    { id: 'lights', name: 'Ceiling lights', svg: lights, distance: 30, intensity: 5, hiRes: true },
    { id: 'court', name: 'Court', svg: court, distance: 8, bleed: true },
    { id: 'hoop', name: 'Hoop', svg: hoop, distance: 12, focusable: true },
    { id: 'player', name: 'Player', svg: player, distance: 8, motion: { x: 220, y: -480 }, focusable: true },
  ],
};
