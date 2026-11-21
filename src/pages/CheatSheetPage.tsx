import { SCENARIOS } from '../content/scenarios';

export default function CheatSheetPage() {
  return (
    <div className="page">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">Printable</div>
          <h1 style={{ margin: '4px 0' }}>Settings cheat sheet</h1>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>Print / save as PDF</button>
      </div>
      <h2 style={{ display: 'none' }} className="print-only">Manual Mode: settings cheat sheet</h2>
      <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Situation</th><th>Mode</th><th>Aperture</th><th>Shutter</th><th>ISO</th><th>Focus</th></tr>
          </thead>
          <tbody>
            {SCENARIOS.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.icon} {s.title}</strong></td>
                <td>{s.settings.mode}</td>
                <td className="mono small">{s.settings.aperture}</td>
                <td className="mono small">{s.settings.shutter}</td>
                <td className="mono small">{s.settings.iso}</td>
                <td className="small">{s.settings.focus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Full stops</h3>
          <p className="mono small" style={{ margin: 0 }}>
            f/ 1.4 · 2 · 2.8 · 4 · 5.6 · 8 · 11 · 16 · 22<br />
            1/1000 · 500 · 250 · 125 · 60 · 30 · 15 · 8<br />
            ISO 100 · 200 · 400 · 800 · 1600 · 3200 · 6400
          </p>
        </div>
        <div className="card">
          <h3>Rules of thumb</h3>
          <ul className="small" style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li>Handheld: shutter ≥ 1/(focal × crop)</li>
            <li>Sunny 16: f/16, shutter 1/ISO</li>
            <li>Snow/beach: +1 to +2 EV</li>
            <li>Dark scenes: −⅔ to −1 EV</li>
            <li>Raise ISO before slowing the shutter</li>
          </ul>
        </div>
        <div className="card">
          <h3>Priorities</h3>
          <ul className="small" style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li><strong>Motion?</strong> Shutter first.</li>
            <li><strong>Depth?</strong> Aperture first.</li>
            <li><strong>Then</strong> ISO to balance.</li>
            <li><strong>Check</strong> histogram + blinkies.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
