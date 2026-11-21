import type { Scene } from '../types';
import { blur, limb, linGrad, rng, tree } from './svg';

const r = rng(11);

const sky = `
<defs>${linGrad('s', [[0, '#5d9fd6'], [0.55, '#a9d2f0'], [0.62, '#e6f2f8']])}${blur('c', 14)}</defs>
<rect width="960" height="640" fill="url(#s)"/>
<g filter="url(#c)" fill="#ffffff" opacity="0.85">
  <ellipse cx="180" cy="90" rx="120" ry="28"/><ellipse cx="250" cy="75" rx="70" ry="30"/>
  <ellipse cx="700" cy="130" rx="150" ry="24"/><ellipse cx="780" cy="112" rx="70" ry="26"/>
</g>
<path d="M0,350 Q160,300 330,330 T640,320 T960,335 L960,640 L0,640 Z" fill="#9db7a6"/>`;

let farTrees = '';
for (let x = -20; x < 1000; x += 26 + r() * 22) {
  farTrees += tree(r, x, 380 + r() * 8, 90 + r() * 50, ['#3f6f3a', '#4d7f43', '#5b8c4a', '#36602f']);
}
let glints = '';
for (let i = 0; i < 26; i++) {
  glints += `<circle cx="${r() * 960}" cy="${300 + r() * 70}" r="${1.5 + r() * 2}" fill="#f6ffd8"/>`;
}
const bgTrees = `
<defs>${linGrad('g', [[0, '#7fae5a'], [1, '#5f9440']])}</defs>
<rect y="372" width="960" height="268" fill="url(#g)"/>
${farTrees}${glints}`;

const mid = `
${tree(r, 110, 450, 330, ['#2f5d2a', '#3c6e33', '#4b7f3c', '#285024'])}
${tree(r, 860, 445, 360, ['#2f5d2a', '#3c6e33', '#4b7f3c', '#285024'])}
<rect x="676" y="250" width="6" height="200" fill="#2b2f33"/>
<path d="M664,250 h30 l-6,-14 h-18 z" fill="#2b2f33"/><circle cx="679" cy="252" r="5" fill="#fff6d0"/>
<g fill="#6b4a2f"><rect x="250" y="420" width="120" height="8" rx="2"/><rect x="250" y="400" width="120" height="7" rx="2"/>
<rect x="258" y="428" width="6" height="22"/><rect x="356" y="428" width="6" height="22"/></g>`;

const path = `
<defs>${linGrad('gr', [[0, '#6aa046'], [1, '#4f8a34']])}${linGrad('p', [[0, '#d8c39a'], [1, '#c4a877']])}</defs>
<rect y="440" width="960" height="200" fill="url(#gr)"/>
<path d="M0,520 C300,500 650,505 960,515 L960,600 C640,590 300,590 0,610 Z" fill="url(#p)"/>
<g fill="#5a9238" opacity="0.6">${Array.from({ length: 90 }, () => `<rect x="${r() * 960}" y="${445 + r() * 70}" width="2" height="${4 + r() * 6}"/>`).join('')}</g>`;

// Runner, mid-stride, moving right.
const skin = '#8d5524';
const skinDark = '#6e4019';
const runner = `
<ellipse cx="480" cy="590" rx="90" ry="10" fill="#000" opacity="0.18"/>
${limb([[486, 318], [452, 355], [466, 392]], skinDark, 15)}
${limb([[476, 405], [440, 470], [392, 506]], skinDark, 19)}
<ellipse cx="386" cy="512" rx="20" ry="9" fill="#e8e8e8" transform="rotate(30 386 512)"/>
${limb([[476, 400], [458, 432]], '#1b2440', 26)}
${limb([[493, 308], [482, 396]], '#e4572e', 44)}
${limb([[482, 396], [480, 412]], '#1b2440', 46)}
${limb([[486, 408], [534, 452], [514, 556]], skin, 19)}
${limb([[486, 408], [512, 432]], '#1b2440', 26)}
<path d="M500,550 q22,-4 40,6 q4,10 -8,12 l-36,-2 z" fill="#f2f2f2" stroke="#2c6fd6" stroke-width="3"/>
${limb([[500, 316], [530, 352], [556, 326]], skin, 15)}
<rect x="492" y="288" width="16" height="22" fill="${skin}"/>
<circle cx="504" cy="270" r="23" fill="${skin}"/>
<path d="M482,266 q4,-28 30,-24 q16,4 14,20 q-14,-10 -44,4 z" fill="#1a1110"/>
<rect x="481" y="258" width="46" height="7" rx="3" fill="#2c6fd6"/>
<circle cx="518" cy="272" r="2.4" fill="#1a1110"/>`;

let blades = '';
for (let i = 0; i < 60; i++) {
  const x = i < 30 ? r() * 200 : 760 + r() * 200;
  const h = 40 + r() * 70;
  blades += `<path d="M${x},640 q${(r() - 0.5) * 30},${-h / 2} ${(r() - 0.5) * 40},${-h}" stroke="${r() > 0.5 ? '#3d7a2a' : '#5a9a3a'}" stroke-width="${3 + r() * 3}" fill="none" stroke-linecap="round"/>`;
}
const fg = `${blades}
<circle cx="70" cy="560" r="10" fill="#f1c40f"/><circle cx="130" cy="585" r="8" fill="#ffffff"/>
<circle cx="880" cy="570" r="11" fill="#e74c8c"/><circle cx="830" cy="600" r="8" fill="#f1c40f"/>`;

export const parkRunner: Scene = {
  id: 'park-runner',
  name: 'Park runner',
  blurb: 'A jogger crossing a sunny park. Great for freezing motion, panning, and background blur.',
  ev100: 14,
  baseFocal: 24,
  subjectLayer: 'runner',
  meterBias: { evaluative: 0, center: 0, spot: 0.3 },
  focalRange: [24, 200],
  defaults: { aperture: 8, shutter: 1 / 250, iso: 100, focal: 50 },
  layers: [
    { id: 'sky', name: 'Sky', svg: sky, distance: 3000, bleed: true, hiRes: true },
    { id: 'bgTrees', name: 'Far trees', svg: bgTrees, distance: 45, bleed: true, hiRes: true, focusable: true },
    { id: 'mid', name: 'Park trees', svg: mid, distance: 14, hiRes: true, focusable: true },
    { id: 'path', name: 'Path', svg: path, distance: 3, bleed: true },
    { id: 'runner', name: 'Runner', svg: runner, distance: 3, motion: { x: 650, y: 0 }, focusable: true },
    { id: 'fg', name: 'Grass', svg: fg, distance: 1.1, focusable: true },
  ],
};
