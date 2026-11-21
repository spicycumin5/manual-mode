import type { Scene } from '../types';
import { blur, limb, linGrad, pine, rng } from './svg';

const r = rng(314);

const sky = `
<defs>${linGrad('s', [[0, '#2f6fc4'], [0.6, '#8cc0ef']])}</defs>
<rect width="960" height="640" fill="url(#s)"/>
<path d="M0,330 L140,200 L220,260 L360,140 L470,240 L560,180 L700,280 L820,190 L960,270 L960,640 L0,640 Z" fill="#e8eef6"/>
<path d="M360,140 L470,240 L420,250 L380,200 L330,240 Z M820,190 L960,270 L900,280 L840,240 Z" fill="#b7c6da"/>`;

let trees = '';
for (let x = -10; x < 980; x += 22 + r() * 40) trees += pine(x, 360 + r() * 30, 70 + r() * 70, '#1f3b2b');
const slope = `
<defs>${linGrad('sl', [[0, '#f4f8fc'], [1, '#ffffff']])}</defs>
${trees}
<path d="M0,360 Q480,330 960,380 L960,640 L0,640 Z" fill="url(#sl)"/>
<path d="M0,470 Q300,430 700,520 T960,560 L960,600 Q600,560 0,520 Z" fill="#dbe6f3" opacity="0.7"/>`;

const skier = `
<defs>${blur('sp', 4)}</defs>
<g filter="url(#sp)" opacity="0.9"><ellipse cx="400" cy="470" rx="70" ry="22" fill="#ffffff"/><ellipse cx="350" cy="455" rx="40" ry="16" fill="#ffffff"/></g>
<path d="M380,480 L560,520" stroke="#222" stroke-width="7" stroke-linecap="round"/>
<path d="M400,492 L580,532" stroke="#222" stroke-width="7" stroke-linecap="round"/>
${limb([[470, 410], [450, 450], [470, 495]], '#1b2440', 22)}
${limb([[490, 410], [500, 455], [500, 505]], '#1b2440', 22)}
<path d="M450,330 q34,-12 64,8 l-12,84 h-56 z" fill="#d6322b"/>
${limb([[460, 345], [430, 385], [420, 420]], '#b52a24', 15)}
${limb([[508, 350], [540, 380], [560, 410]], '#b52a24', 15)}
<line x1="420" y1="420" x2="390" y2="500" stroke="#555" stroke-width="4"/><line x1="560" y1="410" x2="600" y2="500" stroke="#555" stroke-width="4"/>
<circle cx="486" cy="312" r="22" fill="#f1c8a0"/>
<path d="M462,312 q2,-30 26,-28 q22,2 22,26 z" fill="#f2c14e"/>
<rect x="468" y="306" width="40" height="12" rx="5" fill="#222"/><rect x="472" y="308" width="32" height="8" rx="4" fill="#6fd0ff"/>`;

export const snow: Scene = {
  id: 'snow',
  name: 'Sunny ski slope',
  blurb: 'A skier on bright snow. The meter wants to turn the snow grey.',
  ev100: 15.7,
  baseFocal: 24,
  subjectLayer: 'skier',
  meterBias: { evaluative: 1.7, center: 1.3, spot: 0 },
  focalRange: [24, 200],
  defaults: { mode: 'Av', aperture: 8, shutter: 1 / 1000, iso: 100, focal: 70 },
  layers: [
    { id: 'sky', name: 'Mountains', svg: sky, distance: 4000, bleed: true, hiRes: true, focusable: true },
    { id: 'slope', name: 'Slope', svg: slope, distance: 40, bleed: true, hiRes: true, focusable: true },
    { id: 'skier', name: 'Skier', svg: skier, distance: 12, motion: { x: 900, y: 200 }, focusable: true },
  ],
};
