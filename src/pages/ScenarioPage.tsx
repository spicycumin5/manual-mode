import { Link, Navigate, useParams } from 'react-router-dom';
import { SCENARIOS } from '../content/scenarios';
import { Challenge } from '../components/Challenge';
import { Simulator } from '../components/Simulator';

export default function ScenarioPage() {
  const { id } = useParams();
  const i = SCENARIOS.findIndex((s) => s.id === id);
  const s = SCENARIOS[i];
  if (!s) return <Navigate to="/scenarios" replace />;
  const next = SCENARIOS[(i + 1) % SCENARIOS.length];
  const chips: [string, string | undefined][] = [
    ['Mode', s.settings.mode],
    ['Aperture', s.settings.aperture],
    ['Shutter', s.settings.shutter],
    ['ISO', s.settings.iso],
    ['Focus', s.settings.focus],
    ['White balance', s.settings.wb],
    ['Metering', s.settings.metering],
  ];
  return (
    <div className="page">
      <Link to="/scenarios" className="small">← All scenarios</Link>
      <div className="eyebrow" style={{ marginTop: 16 }}>{s.category}</div>
      <h1>
        <span aria-hidden="true">{s.icon}</span> {s.title}
      </h1>
      <p className="lede">{s.summary}</p>

      <div className="settings-chips">
        {chips.filter(([, v]) => v).map(([k, v]) => (
          <span key={k} className="chip"><span className="k">{k}</span><span className="v">{v}</span></span>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Why these settings</h3>
          <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
            {s.why.map((w, k) => (<li key={k}>{w}</li>))}
          </ul>
          {s.steps && (
            <>
              <h3 style={{ marginTop: 18 }}>Step by step</h3>
              <ol style={{ paddingLeft: '1.2em', margin: 0 }}>
                {s.steps.map((w, k) => (<li key={k}>{w}</li>))}
              </ol>
            </>
          )}
        </div>
        <div className="card">
          <h3>Common mistakes</h3>
          <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
            {s.mistakes.map((w, k) => (<li key={k}>{w}</li>))}
          </ul>
          {s.gear && (
            <>
              <h3 style={{ marginTop: 18 }}>Helpful gear</h3>
              <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
                {s.gear.map((w, k) => (<li key={k}>{w}</li>))}
              </ul>
            </>
          )}
        </div>
      </div>

      <h2>Practice it</h2>
      {s.challenge ? (
        <Challenge id={s.challenge} wide />
      ) : s.sim ? (
        <>
          <p className="muted">The simulator below starts with this recipe. Change one setting at a time and see what breaks.</p>
          <Simulator key={s.id} scene={s.sim.scene} initial={s.sim.settings} layout="wide" scenes="all" />
        </>
      ) : (
        <p className="muted">Try the recipe in the <Link to="/simulator">simulator</Link>.</p>
      )}

      <div className="lesson-footer">
        <Link to="/scenarios" className="btn">← All scenarios</Link>
        <Link to={`/scenarios/${next.id}`} className="btn">{next.icon} {next.title} →</Link>
      </div>
    </div>
  );
}
