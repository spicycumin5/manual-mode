import { useState } from 'react';
import { APERTURES, ISOS, SHUTTERS, formatAperture, formatShutter, nearest } from '../sim/stops';
import { settingsEv100 } from '../sim/exposure';
import { dofLimits, ndExposure, npfRule, rule500 } from '../sim/optics';
import { DofDiagram, EquivalentExposures } from '../components/widgets';

const CROPS: [number, string][] = [[1, 'Full frame'], [1.5, 'APS-C (Nikon/Sony/Fuji)'], [1.6, 'APS-C (Canon)'], [2, 'Micro Four Thirds']];

function Num({ label, value, onChange, step = 1, min, max, suffix }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string }) {
  return (
    <label className="small" style={{ display: 'grid', gap: 4 }}>
      <span className="control-label">{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="number" value={value} step={step} min={min} max={max} onChange={(e) => onChange(+e.target.value)} style={{ width: 110 }} />
        {suffix && <span className="muted">{suffix}</span>}
      </span>
    </label>
  );
}

function StarCalc() {
  const [focal, setFocal] = useState(20);
  const [N, setN] = useState(2.8);
  const [pitch, setPitch] = useState(4.3);
  const [crop, setCrop] = useState(1);
  const npf = npfRule(focal, N, pitch, crop);
  const r500 = rule500(focal, crop);
  return (
    <div className="card">
      <h3>Star exposure (NPF & 500 rule)</h3>
      <div className="control-row">
        <Num label="Focal length" value={focal} onChange={setFocal} suffix="mm" />
        <Num label="Aperture f/" value={N} onChange={setN} step={0.1} />
        <Num label="Pixel pitch" value={pitch} onChange={setPitch} step={0.1} suffix="µm" />
        <label className="small" style={{ display: 'grid', gap: 4 }}>
          <span className="control-label">Sensor</span>
          <select value={crop} onChange={(e) => setCrop(+e.target.value)}>{CROPS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select>
        </label>
      </div>
      <div className="readouts" style={{ marginTop: 12 }}>
        <div className="readout"><div className="k">NPF (sharp at 100%)</div><div className="v good">{npf.toFixed(1)} s</div></div>
        <div className="readout"><div className="k">500 rule (looser)</div><div className="v">{r500.toFixed(1)} s</div></div>
      </div>
      <p className="small muted">Pixel pitch ≈ sensor width (mm) ÷ horizontal pixels × 1000. A 24MP full-frame camera is about 6 µm, a 45MP one about 4.3 µm.</p>
    </div>
  );
}

function NdCalc() {
  const [t, setT] = useState(1 / 60);
  const [stops, setStops] = useState(6);
  const out = ndExposure(t, stops);
  const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : s >= 0.3 ? `${s.toFixed(1)} s` : formatShutter(s));
  return (
    <div className="card">
      <h3>ND filter exposure</h3>
      <div className="control-row">
        <label className="small" style={{ display: 'grid', gap: 4 }}>
          <span className="control-label">Metered shutter (no filter)</span>
          <select value={t} onChange={(e) => setT(+e.target.value)}>{SHUTTERS.map((s) => <option key={s} value={s}>{formatShutter(s)}</option>)}</select>
        </label>
        <label className="small" style={{ display: 'grid', gap: 4 }}>
          <span className="control-label">ND strength</span>
          <select value={stops} onChange={(e) => setStops(+e.target.value)}>
            {[[1, 'ND2 · 1 stop'], [2, 'ND4 · 2 stops'], [3, 'ND8 · 3 stops'], [6, 'ND64 · 6 stops'], [10, 'ND1000 · 10 stops'], [15, 'ND32000 · 15 stops']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="readouts" style={{ marginTop: 12 }}>
        <div className="readout"><div className="k">With filter</div><div className="v good">{fmt(out)}</div></div>
      </div>
      {out > 30 && <p className="small muted">Longer than 30 s: use Bulb mode with a remote or timer.</p>}
    </div>
  );
}

function Sunny16() {
  const [iso, setIso] = useState(100);
  const conditions: [string, number][] = [['Snow / sand', 22], ['Bright sun', 16], ['Slight overcast', 11], ['Overcast', 8], ['Heavy overcast', 5.6], ['Open shade / sunset', 4]];
  const t = nearest(SHUTTERS, 1 / iso);
  return (
    <div className="card">
      <h3>Sunny 16 (no meter needed)</h3>
      <label className="small" style={{ display: 'grid', gap: 4, maxWidth: 160 }}>
        <span className="control-label">ISO</span>
        <select value={iso} onChange={(e) => setIso(+e.target.value)}>{ISOS.slice(0, 12).map((v) => <option key={v} value={v}>{v}</option>)}</select>
      </label>
      <table style={{ marginTop: 12 }}>
        <thead><tr><th>Light</th><th>Settings</th></tr></thead>
        <tbody>
          {conditions.map(([c, N]) => (<tr key={c}><td>{c}</td><td className="mono">{formatAperture(N)} · {formatShutter(t)}</td></tr>))}
        </tbody>
      </table>
      <p className="small muted">Shutter = 1/ISO. Trade stops as usual: f/8 at 1/{Math.round(4 / t)} is the same as f/16 at {formatShutter(t)}.</p>
    </div>
  );
}

function EvCalc() {
  const [N, setN] = useState(8);
  const [t, setT] = useState(1 / 125);
  const [iso, setIso] = useState(100);
  const ev = settingsEv100(N, t, iso);
  return (
    <div className="card">
      <h3>Exposure value</h3>
      <div className="control-row">
        <label className="small" style={{ display: 'grid', gap: 4 }}><span className="control-label">Aperture</span>
          <select value={N} onChange={(e) => setN(+e.target.value)}>{APERTURES.map((a) => <option key={a} value={a}>{formatAperture(a)}</option>)}</select></label>
        <label className="small" style={{ display: 'grid', gap: 4 }}><span className="control-label">Shutter</span>
          <select value={t} onChange={(e) => setT(+e.target.value)}>{SHUTTERS.map((s) => <option key={s} value={s}>{formatShutter(s)}</option>)}</select></label>
        <label className="small" style={{ display: 'grid', gap: 4 }}><span className="control-label">ISO</span>
          <select value={iso} onChange={(e) => setIso(+e.target.value)}>{ISOS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
      </div>
      <div className="readouts" style={{ marginTop: 12 }}>
        <div className="readout"><div className="k">Scene brightness (EV100)</div><div className="v good">{ev.toFixed(1)}</div></div>
      </div>
      <p className="small muted">The scene light level these settings expose correctly for. Higher = brighter scene.</p>
    </div>
  );
}

function HyperfocalTable() {
  const [crop, setCrop] = useState(1);
  const focals = [14, 16, 20, 24, 28, 35, 50];
  const stops = [5.6, 8, 11, 16];
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h3>Hyperfocal distances</h3>
      <select value={crop} onChange={(e) => setCrop(+e.target.value)}>{CROPS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select>
      <table style={{ marginTop: 12 }}>
        <thead><tr><th>Focal</th>{stops.map((N) => <th key={N}>f/{N}</th>)}</tr></thead>
        <tbody>
          {focals.map((f) => (
            <tr key={f}><td className="mono">{f}mm</td>{stops.map((N) => <td className="mono" key={N}>{dofLimits(f, N, 1000, crop).hyperfocal.toFixed(1)} m</td>)}</tr>
          ))}
        </tbody>
      </table>
      <p className="small muted">Focus at this distance; everything from half of it to infinity is acceptably sharp.</p>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <div className="page">
      <div className="eyebrow">Tools</div>
      <h1>Calculators</h1>
      <p className="lede">Quick answers in the field: equivalent exposures, depth of field, stars, ND filters and more.</p>
      <div style={{ display: 'grid', gap: 16 }}>
        <EquivalentExposures />
        <DofDiagram />
        <div className="grid grid-2">
          <StarCalc />
          <NdCalc />
          <Sunny16 />
          <EvCalc />
        </div>
        <HyperfocalTable />
      </div>
    </div>
  );
}
