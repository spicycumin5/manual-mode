import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, SCENARIOS } from '../content/scenarios';
import { Depth, Light, Motion, recommend, WizardInput } from '../content/wizard';
import { useProgress } from '../progress/store';

function Choice<T extends string | boolean>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="dial">
      <span className="control-label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={String(v)} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function Wizard() {
  const [inp, setInp] = useState<WizardInput>({ motion: 'none', light: 'sun', tripod: false, depth: 'blur', showMotion: false });
  const set = (p: Partial<WizardInput>) => setInp((s) => ({ ...s, ...p }));
  const r = recommend(inp);
  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <div>
        <div className="eyebrow">Quick help</div>
        <h2 style={{ margin: '4px 0' }}>What should I use?</h2>
        <p className="muted small" style={{ margin: 0 }}>Answer four questions and get a starting point with the reasoning behind it.</p>
      </div>
      <div className="grid grid-2">
        <Choice<Motion> label="Is the subject moving?" value={inp.motion} onChange={(v) => set({ motion: v })} options={[['none', 'No'], ['slow', 'Walking'], ['fast', 'Running / sports'], ['veryfast', 'Very fast']]} />
        <Choice<Light> label="How much light?" value={inp.light} onChange={(v) => set({ light: v })} options={[['sun', 'Bright sun'], ['shade', 'Cloudy / shade'], ['indoor', 'Indoors'], ['night', 'Night']]} />
        <Choice<Depth> label="Background" value={inp.depth} onChange={(v) => set({ depth: v })} options={[['blur', 'Blurred'], ['sharp', 'Everything sharp'], ['any', "Don't mind"]]} />
        <Choice<boolean> label="Tripod?" value={inp.tripod} onChange={(v) => set({ tripod: v })} options={[[false, 'Handheld'], [true, 'Tripod']]} />
        {inp.motion !== 'none' && (
          <Choice<boolean> label="Motion" value={inp.showMotion} onChange={(v) => set({ showMotion: v })} options={[[false, 'Freeze it'], [true, 'Show it (blur)']]} />
        )}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div className="settings-chips">
          <span className="chip"><span className="k">Mode</span><span className="v">{r.mode}</span></span>
          <span className="chip"><span className="k">Aperture</span><span className="v">{r.aperture}</span></span>
          <span className="chip"><span className="k">Shutter</span><span className="v">{r.shutter}</span></span>
          <span className="chip"><span className="k">ISO</span><span className="v">~{r.iso}</span></span>
          <span className="chip"><span className="k">Focus</span><span className="v">{r.focus}</span></span>
        </div>
        <ul className="small" style={{ margin: '8px 0', paddingLeft: '1.2em' }}>
          {r.reasons.map((x, i) => (<li key={i}>{x}</li>))}
        </ul>
        {r.warnings.map((w, i) => (<div key={i} className="callout warn small" style={{ margin: '8px 0' }}>{w}</div>))}
        {r.related.length > 0 && (
          <div className="small">
            Related guides:{' '}
            {r.related.map((id, i) => {
              const s = SCENARIOS.find((x) => x.id === id);
              return s ? (
                <span key={id}>{i > 0 && ' · '}<Link to={`/scenarios/${id}`}>{s.icon} {s.title}</Link></span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScenariosPage() {
  const challenges = useProgress((s) => s.challenges);
  return (
    <div className="page">
      <div className="eyebrow">Scenario guide</div>
      <h1>For this situation, do this</h1>
      <p className="lede">Recipes for 15 common situations: the settings, why they work, and a hands-on challenge to practice each one.</p>
      <Wizard />
      {CATEGORIES.map((cat) => (
        <section key={cat} style={{ marginTop: 32 }}>
          <h2 style={{ marginTop: 0 }}>{cat}</h2>
          <div className="grid grid-3">
            {SCENARIOS.filter((s) => s.category === cat).map((s) => (
              <Link key={s.id} to={`/scenarios/${s.id}`} className="card card-link">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <span className="scenario-icon" aria-hidden="true">{s.icon}</span>
                  {s.challenge && challenges[s.challenge]?.passed && <span className="pill good">✓ Challenge done</span>}
                </div>
                <h3 style={{ margin: '8px 0 4px' }}>{s.title}</h3>
                <p className="small muted" style={{ margin: '0 0 8px' }}>{s.summary}</p>
                <div className="mono small muted">{s.settings.aperture.split(' ')[0]} · {s.settings.shutter.split(' (')[0]} · ISO {s.settings.iso.split(' ')[0]}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p style={{ marginTop: 32 }}>
        <Link to="/cheatsheet" className="btn">Printable cheat sheet →</Link>
      </p>
    </div>
  );
}
