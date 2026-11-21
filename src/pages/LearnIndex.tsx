import { Link } from 'react-router-dom';
import { MODULES } from '../content/lessons';
import { useProgress } from '../progress/store';

export default function LearnIndex() {
  const done = useProgress((s) => s.lessons);
  const quizzes = useProgress((s) => s.quizzes);
  return (
    <div className="page">
      <div className="eyebrow">Lessons</div>
      <h1>Learn</h1>
      <p className="lede">Two tracks: first how to take the picture, then how to finish it. Every lesson has something to play with.</p>
      {MODULES.map((m) => {
        const n = m.lessons.filter((l) => done[`${m.slug}/${l.slug}`]).length;
        return (
          <section key={m.slug} style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{m.title}</h2>
              <span className="small muted">{n} / {m.lessons.length} complete</span>
            </div>
            <p className="muted">{m.blurb}</p>
            <div className="progress-bar" style={{ marginBottom: 16 }}><span style={{ width: `${(n / m.lessons.length) * 100}%` }} /></div>
            <div className="grid grid-3">
              {m.lessons.map((l, i) => {
                const key = `${m.slug}/${l.slug}`;
                const q = quizzes[l.slug === 'together' ? 'together' : m.slug === 'editing' ? 'editing' : l.slug];
                return (
                  <Link key={l.slug} to={`/learn/${key}`} className="card card-link">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span className="mono muted small">{String(i + 1).padStart(2, '0')} · {l.minutes} min</span>
                      {done[key] && <span className="pill good">✓ Done</span>}
                    </div>
                    <h3 style={{ margin: '8px 0 4px' }}>{l.title}</h3>
                    <p className="small muted" style={{ margin: 0 }}>{l.summary}</p>
                    {q && m.slug !== 'editing' && <div className="small" style={{ marginTop: 8, color: 'var(--good)' }}>Quiz best: {Math.round(q.best * 100)}%</div>}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
