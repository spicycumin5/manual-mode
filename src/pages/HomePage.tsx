import { ChangeEvent, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Simulator } from '../components/Simulator';
import { ALL_LESSONS, MODULES } from '../content/lessons';
import { SCENARIOS } from '../content/scenarios';
import { CHALLENGES } from '../content/challenges';
import { exportProgress, useProgress } from '../progress/store';

export function HomePage() {
  const { lessons, challenges, quizzes, streak, lastLesson, importData, reset } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const doneCount = Object.keys(lessons).length;
  const passed = Object.keys(CHALLENGES).filter((id) => challenges[id]?.passed).length;
  const nextLesson = ALL_LESSONS.find((l) => !lessons[l.key]);
  const resume = ALL_LESSONS.find((l) => l.key === lastLesson && !lessons[l.key]) ?? nextLesson;

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'manual-mode-progress.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ok = importData(await f.text());
    if (!ok) console.warn('Could not import progress file');
    e.target.value = '';
  };

  return (
    <div className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">Learn photography by doing</div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>Get off auto. Take the photo you meant to take.</h1>
          <p className="lede">
            A virtual camera you can break safely, lessons that show what aperture, shutter speed and ISO actually do,
            recipes for real situations, and an editing lab for curves and color.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            {resume ? (
              <Link className="btn btn-primary" to={`/learn/${resume.key}`}>
                {doneCount ? 'Continue' : 'Start'}: {resume.title} →
              </Link>
            ) : (
              <Link className="btn btn-primary" to="/scenarios">All lessons done! Try the scenarios →</Link>
            )}
            <Link className="btn" to="/simulator">Open the simulator</Link>
          </div>
        </div>
        <Simulator scene="portrait" controls={['aperture', 'shutter', 'iso']} readouts={false} histogram={false} sendToLab={false} initial={{ aperture: 1.8, shutter: 1 / 1250, iso: 200, focal: 85 }} />
      </section>

      <section style={{ marginTop: 40 }}>
        <div className="grid grid-3">
          <div className="card">
            <div className="control-label">Lessons</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{doneCount} <span className="muted" style={{ fontSize: '1rem' }}>/ {ALL_LESSONS.length}</span></div>
            <div className="progress-bar"><span style={{ width: `${(doneCount / ALL_LESSONS.length) * 100}%` }} /></div>
          </div>
          <div className="card">
            <div className="control-label">Camera challenges</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{passed} <span className="muted" style={{ fontSize: '1rem' }}>/ {Object.keys(CHALLENGES).length}</span></div>
            <div className="progress-bar"><span style={{ width: `${(passed / Object.keys(CHALLENGES).length) * 100}%` }} /></div>
          </div>
          <div className="card">
            <div className="control-label">Streak</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{streak.count} <span className="muted" style={{ fontSize: '1rem' }}>day{streak.count === 1 ? '' : 's'}</span></div>
            <div className="small muted">{Object.keys(quizzes).length} quizzes taken</div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>What's inside</h2>
        <div className="grid grid-3">
          {MODULES.map((m) => (
            <Link key={m.slug} to={`/learn/${m.slug}/${m.lessons[0].slug}`} className="card card-link">
              <div className="eyebrow">{m.lessons.length} lessons</div>
              <h3 style={{ margin: '6px 0' }}>{m.title}</h3>
              <p className="small muted" style={{ margin: 0 }}>{m.blurb}</p>
            </Link>
          ))}
          <Link to="/scenarios" className="card card-link">
            <div className="eyebrow">{SCENARIOS.length} recipes</div>
            <h3 style={{ margin: '6px 0' }}>Scenario guide</h3>
            <p className="small muted" style={{ margin: 0 }}>Sports, portraits, night sky, waterfalls… what to set, and why.</p>
          </Link>
          <Link to="/simulator" className="card card-link">
            <div className="eyebrow">7 scenes</div>
            <h3 style={{ margin: '6px 0' }}>Virtual camera</h3>
            <p className="small muted" style={{ margin: 0 }}>Depth of field, motion blur, noise, metering and modes, all simulated live.</p>
          </Link>
          <Link to="/edit" className="card card-link">
            <div className="eyebrow">6 exercises</div>
            <h3 style={{ margin: '6px 0' }}>Edit Lab</h3>
            <p className="small muted" style={{ margin: 0 }}>Tone curves, HSL, white balance and color grading on your own photos.</p>
          </Link>
          <Link to="/tools" className="card card-link">
            <div className="eyebrow">Calculators</div>
            <h3 style={{ margin: '6px 0' }}>Field tools</h3>
            <p className="small muted" style={{ margin: 0 }}>Equivalent exposure, DoF, NPF rule, ND filters, Sunny 16.</p>
          </Link>
        </div>
      </section>

      <section style={{ marginTop: 40 }} className="small muted">
        Progress is saved in this browser.{' '}
        <button className="btn btn-sm" onClick={download}>Export progress</button>{' '}
        <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>Import</button>{' '}
        <button className="btn btn-sm" onClick={() => { if (window.confirm('Reset all progress?')) reset(); }}>Reset</button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onImport} />
      </section>
    </div>
  );
}
