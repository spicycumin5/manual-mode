import type { Scene } from '../types';
import { blur, linGrad, pine, rng } from './svg';

const r = rng(99);

let forest = '';
for (let x = -20; x < 1000; x += 30 + r() * 30) forest += pine(x, 300 + r() * 40, 160 + r() * 120, r() > 0.5 ? '#1f3d2a' : '#284a33');
const bg = `
<defs>${linGrad('s', [[0, '#c9dde0'], [0.5, '#7fa39a'], [1, '#3c5a48']])}</defs>
<rect width="960" height="640" fill="url(#s)"/>${forest}
<rect y="330" width="960" height="310" fill="#2e4637"/>`;

let streaks = '';
for (let i = 0; i < 520; i++) {
  const x = 372 + r() * 216;
  const y = 30 + r() * 470;
  streaks += `<ellipse cx="${x}" cy="${y}" rx="${1.5 + r() * 4}" ry="${3 + r() * 10}" fill="${r() > 0.35 ? '#ffffff' : '#9fc3cf'}" opacity="${0.35 + r() * 0.65}"/>`;
}
const water = `
<defs>${linGrad('w', [[0, '#cfe4ea'], [1, '#e9f4f6']], false)}</defs>
<path d="M372,20 L588,20 Q600,260 610,500 L350,500 Q362,260 372,20 Z" fill="#a9c9d1"/>
<g>${Array.from({ length: 14 }, (_, i) => `<rect x="${376 + i * 15}" y="20" width="${4 + r() * 5}" height="480" fill="#ffffff" opacity="${0.25 + r() * 0.35}"/>`).join('')}</g>
${streaks}`;

const rockFace = (pts: string, c: string) => `<path d="${pts}" fill="${c}"/>`;
let moss = '';
for (let i = 0; i < 90; i++) {
  const left = r() > 0.5;
  moss += `<circle cx="${left ? r() * 360 : 600 + r() * 360}" cy="${r() * 480}" r="${4 + r() * 10}" fill="${r() > 0.5 ? '#4f6e2f' : '#5f7f36'}" opacity="0.85"/>`;
}
const cliff = `
${rockFace('M0,0 L380,0 L372,40 Q355,260 350,500 L0,520 Z', '#5a5650')}
${rockFace('M960,0 L580,0 L588,40 Q605,260 612,500 L960,520 Z', '#5f5a53')}
${rockFace('M320,0 L640,0 L636,138 Q590,112 540,128 Q480,104 420,126 Q370,110 324,138 Z', '#4b4741')}
${rockFace('M330,120 Q400,98 470,116 Q540,96 630,122 L626,132 Q540,112 470,128 Q400,110 334,132 Z', '#3c3934')}
${rockFace('M60,120 l120,-30 l80,60 l-40,90 l-150,20 z', '#6b665e')}
${rockFace('M700,160 l140,-20 l70,90 l-110,60 l-120,-40 z', '#6d675f')}
${moss}`;

let foam = '';
for (let i = 0; i < 240; i++) {
  foam += `<ellipse cx="${200 + r() * 560}" cy="${470 + r() * 90}" rx="${6 + r() * 22}" ry="${2 + r() * 5}" fill="#f2fbff" opacity="${0.3 + r() * 0.6}"/>`;
}
const pool = `
<defs>${linGrad('p', [[0, '#5f8f8f'], [1, '#2f5555']])}${blur('m', 6)}</defs>
<rect y="480" width="960" height="160" fill="url(#p)"/>
<ellipse cx="480" cy="500" rx="200" ry="34" fill="#f5fdff" opacity="0.85" filter="url(#m)"/>${foam}`;

const rocks = `
${rockFace('M0,640 L0,560 Q60,520 150,540 Q230,520 280,575 L300,640 Z', '#3f3c38')}
${rockFace('M640,640 Q660,560 760,555 Q860,520 960,560 L960,640 Z', '#46423d')}
${rockFace('M400,640 Q430,600 500,598 Q560,600 580,640 Z', '#3a3733')}
<path d="M20,560 Q100,530 160,548" stroke="#6b8a3a" stroke-width="10" fill="none" stroke-linecap="round"/>
<path d="M680,566 Q760,548 850,552" stroke="#6b8a3a" stroke-width="10" fill="none" stroke-linecap="round"/>`;

let ferns = '';
for (let k = 0; k < 6; k++) {
  const bx = k < 3 ? 30 + k * 40 : 820 + (k - 3) * 45;
  const ang = k < 3 ? -1 : 1;
  for (let j = 0; j < 9; j++) {
    const y = 640 - j * 22;
    ferns += `<ellipse cx="${bx + ang * j * 8}" cy="${y}" rx="34" ry="7" transform="rotate(${ang * (20 + j * 4)} ${bx + ang * j * 8} ${y})" fill="${j % 2 ? '#3f7a2f' : '#4f8c3a'}"/>`;
  }
}

export const waterfall: Scene = {
  id: 'waterfall',
  name: 'Forest waterfall',
  blurb: 'A shaded waterfall: freeze droplets or turn the water to silk with a long exposure.',
  ev100: 11,
  baseFocal: 24,
  subjectLayer: 'rocks',
  meterBias: { evaluative: 0.3, center: 0.7, spot: 0 },
  focalRange: [16, 105],
  defaults: { aperture: 8, shutter: 1 / 30, iso: 100, focal: 24, tripod: false },
  layers: [
    { id: 'bg', name: 'Forest', svg: bg, distance: 60, bleed: true, hiRes: true },
    { id: 'water', name: 'Falling water', svg: water, distance: 11, motion: { x: 0, y: 900 }, focusable: true },
    { id: 'cliff', name: 'Cliff', svg: cliff, distance: 10, bleed: true, focusable: true },
    { id: 'pool', name: 'Pool', svg: pool, distance: 8, motion: { x: 60, y: 10 }, bleed: true },
    { id: 'rocks', name: 'Rocks', svg: rocks, distance: 5, focusable: true },
    { id: 'ferns', name: 'Ferns', svg: ferns, distance: 1.2, focusable: true },
  ],
};
