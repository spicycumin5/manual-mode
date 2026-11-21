import { useEffect, useMemo, useRef, useState } from 'react';
import { APERTURES, ISOS, SHUTTERS, formatAperture, formatShutter, nearest } from '../sim/stops';
import { ev100, LIGHT_LEVELS, settingsEv100 } from '../sim/exposure';
import { dofLimits, hyperfocal } from '../sim/optics';
import { renderStill } from '../sim/stills';
import { RulerDial } from './RulerDial';

/* ---------- Stops: each doubling of light ---------- */
export function StopsDemo() {
  const [stops, setStops] = useState(0);
  const gain = Math.pow(2, stops);
  return (
    <div className="widget">
      <div className="widget-title">One stop = double or half the light</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {[-3, -2, -1, 0, 1, 2, 3].map((s) => {
          const g = Math.pow(2, s) * 0.18;
          const v = Math.round(255 * Math.min(1, Math.pow(g, 1 / 2.2)));
          return (
            <button
              key={s}
              onClick={() => setStops(s)}
              aria-pressed={s === stops}
              style={{
                aspectRatio: '1', borderRadius: 8, border: s === stops ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: `rgb(${v},${v},${v})`, color: v > 140 ? '#111' : '#eee', cursor: 'pointer', fontFamily: 'var(--mono)', fontWeight: 700,
              }}
            >
              {s > 0 ? `+${s}` : s}
            </button>
          );
        })}
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>
        {stops === 0 ? 'Middle grey: the tone your light meter aims for.' : `${stops > 0 ? '+' : ''}${stops} stop${Math.abs(stops) > 1 ? 's' : ''} = ${gain >= 1 ? `${gain}×` : `1/${1 / gain}`} the light.`}
      </p>
    </div>
  );
}

/* ---------- Equivalent exposures ---------- */
export function EquivalentExposures() {
  const [N, setN] = useState(8);
  const [t, setT] = useState(1 / 125);
  const [iso, setIso] = useState(100);
  const target = settingsEv100(N, t, iso);
  const rows = useMemo(() => {
    const out: { N: number; t: number }[] = [];
    for (const n of [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22]) {
      const tt = (n * n) / Math.pow(2, target + Math.log2(iso / 100));
      if (tt >= SHUTTERS[SHUTTERS.length - 1] * 0.9 && tt <= 30) out.push({ N: n, t: nearest(SHUTTERS, tt) });
    }
    return out;
  }, [target, iso]);
  return (
    <div className="widget">
      <div className="widget-title">Equivalent exposures</div>
      <div className="grid grid-3">
        <RulerDial label="Aperture" values={APERTURES} value={N} onChange={setN} format={formatAperture} tickFormat={(v) => `${v}`} isFull={(v) => [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22].includes(v)} />
        <RulerDial label="Shutter" values={SHUTTERS} value={t} onChange={setT} format={formatShutter} />
        <RulerDial label="ISO" values={ISOS} value={iso} onChange={setIso} format={(v) => `${v}`} />
      </div>
      <p className="small muted">
        These settings are exposure value <strong className="mono">EV {target.toFixed(1)}</strong> at ISO 100 (
        {LIGHT_LEVELS.reduce((a, b) => (Math.abs(b.ev - target) < Math.abs(a.ev - target) ? b : a)).label.toLowerCase()}). At ISO {iso},
        all of these give the <em>same brightness</em>:
      </p>
      <div className="settings-chips">
        {rows.map((r) => (
          <span className="chip" key={r.N}>
            <span className="v">{formatAperture(r.N)}</span> <span className="mono muted">@ {formatShutter(r.t)}</span>
          </span>
        ))}
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>
        Same brightness, different pictures: left side = shallow focus and frozen motion; right side = deep focus and motion blur.
      </p>
    </div>
  );
}

/* ---------- Depth of field diagram ---------- */
export function DofDiagram() {
  const [focal, setFocal] = useState(50);
  const [N, setN] = useState(2.8);
  const [dist, setDist] = useState(3);
  const d = dofLimits(focal, N, dist);
  const H = hyperfocal(focal, N);
  const maxM = 30;
  const x = (m: number) => 40 + (Math.log(1 + Math.min(m, maxM)) / Math.log(1 + maxM)) * 600;
  const ticks = [0.5, 1, 2, 3, 5, 10, 20, 30];
  const fmt = (m: number) => (isFinite(m) ? (m < 10 ? `${m.toFixed(2)} m` : `${m.toFixed(1)} m`) : '∞');
  return (
    <div className="widget">
      <div className="widget-title">Depth of field explorer</div>
      <svg viewBox="0 0 680 150" style={{ width: '100%', display: 'block' }} role="img" aria-label={`Sharp from ${fmt(d.near)} to ${fmt(d.far)}`}>
        <rect x={x(d.near)} y={40} width={Math.max(2, x(isFinite(d.far) ? d.far : maxM) - x(d.near))} height={50} rx={6} fill="var(--accent-soft)" stroke="var(--accent)" />
        <line x1={40} y1={95} x2={640} y2={95} stroke="var(--border)" strokeWidth={2} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={95} x2={x(t)} y2={101} stroke="var(--faint)" />
            <text x={x(t)} y={116} textAnchor="middle" fontSize={11} fill="var(--muted)" fontFamily="var(--mono)">{t}m</text>
          </g>
        ))}
        <path d={`M14,60 h20 l8,-8 v36 l-8,-8 h-20 z`} fill="var(--muted)" />
        <line x1={x(dist)} y1={28} x2={x(dist)} y2={95} stroke="var(--text)" strokeWidth={2} strokeDasharray="4 3" />
        <text x={x(dist)} y={22} textAnchor="middle" fontSize={12} fill="var(--text)" fontWeight={700}>focus</text>
        {H <= maxM && (
          <text x={Math.min(x(H), 640)} y={140} textAnchor={x(H) > 560 ? "end" : "middle"} fontSize={11} fill="var(--blue)">▲ hyperfocal {H.toFixed(1)} m</text>
        )}
        {!isFinite(d.far) && <text x={636} y={70} textAnchor="end" fontSize={12} fill="var(--accent)">→ ∞</text>}
      </svg>
      <p className="small" style={{ margin: '4px 0 10px' }}>
        Sharp from <strong className="mono">{fmt(d.near)}</strong> to <strong className="mono">{fmt(d.far)}</strong>
        {isFinite(d.total) && <> (total <span className="mono">{d.total < 1 ? `${Math.round(d.total * 100)} cm` : `${d.total.toFixed(1)} m`}</span>)</>}
      </p>
      <div className="grid grid-3">
        <RulerDial label="Focal length" values={[16, 24, 35, 50, 85, 135, 200]} value={focal} onChange={setFocal} format={(v) => `${v}mm`} tickFormat={(v) => `${v}`} />
        <RulerDial label="Aperture" values={APERTURES} value={N} onChange={setN} format={formatAperture} tickFormat={(v) => `${v}`} isFull={(v) => [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22].includes(v)} />
        <RulerDial label="Focus distance" values={[0.5, 0.7, 1, 1.5, 2, 3, 5, 7, 10, 15, 20]} value={dist} onChange={setDist} format={(v) => `${v} m`} tickFormat={(v) => `${v}`} />
      </div>
    </div>
  );
}

/* ---------- White balance ---------- */
// Approximate RGB of a blackbody at temperature K (Tanner Helland's fit), normalized.
function kelvinRgb(k: number): [number, number, number] {
  const t = k / 100;
  let r, g, b;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  const c = (v: number) => Math.max(0, Math.min(255, v)) / 255;
  return [c(r), c(g), c(b)];
}

const LIGHTS = [
  { k: 2800, name: 'Tungsten bulb' },
  { k: 4000, name: 'Fluorescent' },
  { k: 5500, name: 'Daylight' },
  { k: 6500, name: 'Cloudy' },
  { k: 7500, name: 'Shade' },
];

export function WhiteBalanceDemo() {
  const [light, setLight] = useState(2800);
  const [wb, setWb] = useState(5500);
  const ref = useRef<HTMLCanvasElement>(null);
  const [base, setBase] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    renderStill('portrait', { aperture: 2.8, shutter: 1 / 1600, iso: 200, focal: 85 }).then((src) => {
      const img = new Image();
      img.onload = () => setBase(img);
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c || !base) return;
    c.width = 480;
    c.height = 320;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(base, 0, 0, 480, 320);
    const d = ctx.getImageData(0, 0, 480, 320);
    const L = kelvinRgb(light);
    const W = kelvinRgb(wb);
    const gain = [L[0] / W[0], L[1] / W[1], L[2] / W[2]];
    const norm = gain[1];
    for (let i = 0; i < d.data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        const lin = Math.pow(d.data[i + ch] / 255, 2.2) * (gain[ch] / norm);
        d.data[i + ch] = 255 * Math.pow(Math.min(1, lin), 1 / 2.2);
      }
    }
    ctx.putImageData(d, 0, 0);
  }, [base, light, wb]);

  const off = Math.round(wb - light);
  return (
    <div className="widget">
      <div className="widget-title">White balance</div>
      <canvas ref={ref} style={{ width: '100%', borderRadius: 8, display: 'block', aspectRatio: '3/2', background: 'var(--surface-2)' }} />
      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <div className="dial">
          <span className="control-label">The light in the scene</span>
          <div className="segmented">
            {LIGHTS.map((l) => (
              <button key={l.k} aria-pressed={light === l.k} onClick={() => setLight(l.k)}>{l.name}</button>
            ))}
          </div>
        </div>
        <div className="dial">
          <div className="dial-head">
            <span className="control-label">Camera white balance</span>
            <span className="dial-value">{wb}K</span>
          </div>
          <input type="range" min={2500} max={9000} step={100} value={wb} onChange={(e) => setWb(+e.target.value)} aria-label="White balance in kelvin" />
        </div>
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>
        {Math.abs(off) < 300
          ? 'Matched! Whites look white.'
          : off > 0
            ? 'The camera expects cooler light than there is, so the picture looks too warm (orange). Lower the kelvin value.'
            : 'The camera expects warmer light than there is, so the picture looks too cool (blue). Raise the kelvin value.'}
      </p>
    </div>
  );
}

/* ---------- Light level table ---------- */
export function LightLevels() {
  return (
    <div className="widget" style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr><th>EV (ISO 100)</th><th>Typical scene</th><th>Example settings</th></tr>
        </thead>
        <tbody>
          {LIGHT_LEVELS.map((l) => {
            const N = l.ev > 10 ? 8 : 2.8;
            let t = (N * N) / Math.pow(2, l.ev);
            let iso = 100;
            while (t > 1 / 30 && iso < 6400 && l.ev > 0) {
              iso *= 2;
              t /= 2;
            }
            if (l.ev <= 0) {
              iso = 3200;
              t = (N * N) / Math.pow(2, l.ev + 5);
            }
            return (
              <tr key={l.ev}>
                <td className="mono">{l.ev}</td>
                <td>{l.label}</td>
                <td className="mono">{formatAperture(N)} · {formatShutter(nearest(SHUTTERS, Math.min(30, t)))} · ISO {iso}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { ev100 };
