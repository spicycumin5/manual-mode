import { ComponentType, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import { findLesson, MODULES } from '../content/lessons';
import { mdxComponents } from '../content/mdxComponents';
import { useProgress } from '../progress/store';

export default function LessonPage() {
  const { module = '', lesson: slug = '' } = useParams();
  const { lesson, prev, next, index } = findLesson(module, slug);
  const [Content, setContent] = useState<ComponentType<{ components?: Record<string, unknown> }> | null>(null);
  const done = useProgress((s) => s.lessons);
  const complete = useProgress((s) => s.completeLesson);
  const visit = useProgress((s) => s.visitLesson);

  useEffect(() => {
    if (!lesson) return;
    setContent(null);
    visit(lesson.key);
    let alive = true;
    lesson.load().then((m) => alive && setContent(() => m.default));
    return () => {
      alive = false;
    };
  }, [lesson, visit]);

  if (!lesson) return <Navigate to="/learn" replace />;
  const mod = MODULES.find((m) => m.slug === module)!;
  const isDone = !!done[lesson.key];

  return (
    <div className="page">
      <div className="lesson-layout">
        <nav className="lesson-nav" aria-label="Lessons">
          {MODULES.map((m) => (
            <div key={m.slug}>
              <h4>{m.title}</h4>
              {m.lessons.map((l) => (
                <NavLink key={l.slug} to={`/learn/${m.slug}/${l.slug}`} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <span className={`dot ${done[`${m.slug}/${l.slug}`] ? 'done' : ''}`} />
                  {l.title}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <article className="prose">
          <div className="eyebrow">
            {mod.title} · Lesson {mod.lessons.findIndex((l) => l.slug === slug) + 1} · {lesson.minutes} min
          </div>
          <h1>{lesson.title}</h1>
          <p className="lede">{lesson.summary}</p>
          {Content ? <Content components={mdxComponents} /> : <p className="muted">Loading lesson…</p>}
          <div className="lesson-footer">
            {prev ? <Link className="btn" to={`/learn/${prev.module}/${prev.slug}`}>← {prev.title}</Link> : <span />}
            <button className={`btn ${isDone ? '' : 'btn-primary'}`} onClick={() => complete(lesson.key)} disabled={isDone}>
              {isDone ? '✓ Completed' : 'Mark lesson complete'}
            </button>
            {next ? <Link className="btn" to={`/learn/${next.module}/${next.slug}`}>{next.title} →</Link> : <Link className="btn" to="/scenarios">Scenarios →</Link>}
          </div>
          <div className="small muted" style={{ marginTop: 8 }}>Lesson {index + 1} of 15</div>
        </article>
      </div>
    </div>
  );
}
