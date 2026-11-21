import type { Scene } from '../types';
import { blur, linGrad, rng } from './svg';

const r = rng(2024);

let band = '';
for (let i = 0; i < 70; i++) {
  const t = r();
  const x = 120 + t * 760;
  const y = 470 - t * 420 + (r() - 0.5) * 90;
  band += `<ellipse cx="${x}" cy="${y}" rx="${40 + r() * 70}" ry="${20 + r() * 40}" fill="${r() > 0.4 ? '#b9b2d8' : '#d8c4a8'}" opacity="${0.06 + r() * 0.1}" transform="rotate(-30 ${x} ${y})"/>`;
}
let dust = '';
for (let i = 0; i < 14; i++) {
  const t = 0.15 + r() * 0.7;
  const x = 120 + t * 760;
  const y = 470 - t * 420;
  dust += `<ellipse cx="${x}" cy="${y}" rx="${30 + r() * 40}" ry="${6 + r() * 8}" fill="#05060f" opacity="0.5" transform="rotate(-30 ${x} ${y})"/>`;
}
const sky = `
<defs>${linGrad('s', [[0, '#03040c'], [0.7, '#0b1028'], [1, '#1c2140']])}${blur('mw', 18)}${blur('d', 6)}</defs>
<rect width="960" height="640" fill="url(#s)"/>
<g filter="url(#mw)">${band}</g><g filter="url(#d)">${dust}</g>`;

let stars = `<defs>${blur('g', 1.4)}</defs>`;
for (let i = 0; i < 700; i++) {
  const big = r() > 0.97;
  const rr = big ? 1.4 + r() * 0.8 : 0.45 + r() * 0.7;
  const c = r() > 0.8 ? '#ffd9b0' : r() > 0.7 ? '#cfe0ff' : '#ffffff';
  const x = r() * 960;
  const y = r() * 520;
  stars += big ? `<circle cx="${x}" cy="${y}" r="${rr * 2.4}" fill="${c}" opacity="0.4" filter="url(#g)"/><circle cx="${x}" cy="${y}" r="${rr}" fill="${c}"/>` : `<circle cx="${x}" cy="${y}" r="${rr}" fill="${c}" opacity="${0.5 + r() * 0.5}"/>`;
}

const mountains = `
<path d="M0,500 L120,410 L190,450 L300,350 L380,420 L470,380 L560,450 L650,370 L760,440 L850,400 L960,460 L960,640 L0,640 Z" fill="#0a0d1a"/>
<path d="M300,350 L330,372 L316,374 L300,362 L282,378 L270,376 Z" fill="#3a4060" opacity="0.6"/>
<path d="M650,370 L676,390 L660,392 L650,384 L636,394 L626,390 Z" fill="#3a4060" opacity="0.6"/>`;

const tent = `
<defs>${linGrad('t', [[0, '#ffb35c'], [1, '#f07a2a']])}</defs>
<path d="M600,560 L660,490 L720,560 Z" fill="url(#t)"/>
<path d="M650,560 L660,515 L670,560 Z" fill="#7a3510"/>
<rect x="540" y="560" width="230" height="4" fill="#1a1410"/>`;

let grass = '';
for (let i = 0; i < 120; i++) {
  const x = r() * 960;
  const h = 20 + r() * 50;
  grass += `<path d="M${x},640 q${(r() - 0.5) * 16},${-h / 2} ${(r() - 0.5) * 20},${-h}" stroke="#05060a" stroke-width="3" fill="none"/>`;
}
const fg = `<path d="M0,600 Q240,575 480,592 T960,585 L960,640 L0,640 Z" fill="#06070c"/>${grass}`;

export const nightSky: Scene = {
  id: 'night-sky',
  name: 'Milky Way camp',
  blurb: 'A moonless sky over a mountain camp. Long exposures, high ISO, and star trailing.',
  ev100: -6.4,
  baseFocal: 20,
  subjectLayer: 'tent',
  meterBias: { evaluative: -1, center: -1, spot: 1.5 },
  focalRange: [14, 50],
  notes: 'Star movement is magnified about 6× so trailing is visible at screen size, roughly what you would see at 100% zoom.',
  defaults: { aperture: 2.8, shutter: 20, iso: 3200, focal: 20, tripod: true, focusLayer: 'stars' },
  layers: [
    { id: 'sky', name: 'Sky glow', svg: sky, distance: 1e6, bleed: true, hiRes: true },
    { id: 'stars', name: 'Stars (infinity)', svg: stars, distance: 1e6, intensity: 3, hiRes: true, motion: { x: 0.36, y: -0.12 }, focusable: true },
    { id: 'mountains', name: 'Mountains', svg: mountains, distance: 3000, focusable: true },
    { id: 'tent', name: 'Tent', svg: tent, distance: 25, intensity: 1.4, focusable: true },
    { id: 'fg', name: 'Grass', svg: fg, distance: 4, focusable: true },
  ],
};
