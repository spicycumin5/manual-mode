import { ReactNode, useState } from 'react';
import { useProgress } from '../progress/store';
import { Frame, useFrameSrc } from './Photos';
import { RulerDial } from './RulerDial';
import { APERTURES, ISOS, SHUTTERS, formatAperture, formatShutter } from '../sim/stops';

export type Question =
  | { type: 'mc'; prompt: ReactNode; options: ReactNode[]; answer: number; explain: ReactNode }
  | { type: 'image'; prompt: ReactNode; frames: Frame[]; answer: number; explain: ReactNode }
  | {
      type: 'dial';
      prompt: ReactNode;
      dial: 'aperture' | 'shutter' | 'iso';
      start: number;
      /** Inclusive acceptable range. */
      min: number;
      max: number;
      explain: ReactNode;
    };

const DIALS = {
  aperture: { values: APERTURES, format: formatAperture, label: 'Aperture' },
  shutter: { values: SHUTTERS, format: formatShutter, label: 'Shutter speed' },
  iso: { values: ISOS, format: (v: number) => `ISO ${v}`, label: 'ISO' },
};

function ImageOption({ frame, idx, state, onPick }: { frame: Frame; idx: number; state: string; onPick: () => void }) {
  const { src } = useFrameSrc(frame);
  return (
    <button className={state} onClick={onPick} disabled={state !== ''} aria-label={`Photo ${String.fromCharCode(65 + idx)}`}>
      {src ? <img src={src} alt="" /> : <div style={{ aspectRatio: '3/2', background: 'var(--surface-2)' }} />}
      <span className="lbl">{String.fromCharCode(65 + idx)}</span>
    </button>
  );
}

function QuestionView({ q, n, onAnswer }: { q: Question; n: number; onAnswer: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [dialVal, setDialVal] = useState(q.type === 'dial' ? q.start : 0);
  const [dialChecked, setDialChecked] = useState<boolean | null>(null);
  const answered = picked !== null || dialChecked !== null;

  const pick = (i: number) => {
    if (answered || q.type === 'dial') return;
    setPicked(i);
    onAnswer(i === q.answer);
  };

  return (
    <div className="q">
      <div className="q-prompt">
        {n}. {q.prompt}
      </div>
      {q.type === 'mc' && (
        <div className="q-options">
          {q.options.map((o, i) => {
            const cls = !answered ? '' : i === q.answer ? 'correct' : i === picked ? 'wrong' : '';
            return (
              <button key={i} className={`q-option ${cls}`} onClick={() => pick(i)} disabled={answered}>
                <span className="mono muted">{String.fromCharCode(65 + i)}</span> {o}
              </button>
            );
          })}
        </div>
      )}
      {q.type === 'image' && (
        <div className="q-images">
          {q.frames.map((f, i) => (
            <ImageOption key={i} frame={f} idx={i} onPick={() => pick(i)} state={!answered ? '' : i === q.answer ? 'correct' : i === picked ? 'wrong' : 'done'} />
          ))}
        </div>
      )}
      {q.type === 'dial' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <RulerDial label={DIALS[q.dial].label} values={DIALS[q.dial].values} value={dialVal} onChange={setDialVal} format={DIALS[q.dial].format} disabled={answered} />
          {!answered && (
            <button
              className="btn btn-sm"
              style={{ justifySelf: 'start' }}
              onClick={() => {
                const ok = dialVal >= q.min - 1e-9 && dialVal <= q.max + 1e-9;
                setDialChecked(ok);
                onAnswer(ok);
              }}
            >
              Check
            </button>
          )}
          {answered && (
            <span className={`pill ${dialChecked ? 'good' : ''}`}>
              {dialChecked ? 'Good choice' : `Not quite: aim for ${DIALS[q.dial].format(q.min)}–${DIALS[q.dial].format(q.max)}`}
            </span>
          )}
        </div>
      )}
      {answered && <div className="q-explain">{q.explain}</div>}
    </div>
  );
}

export function Quiz({ id, title = 'Check your understanding', questions }: { id: string; title?: string; questions: Question[] }) {
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [round, setRound] = useState(0);
  const record = useProgress((s) => s.recordQuiz);
  const best = useProgress((s) => s.quizzes[id]?.best);
  const done = Object.keys(results).length === questions.length;
  const correct = Object.values(results).filter(Boolean).length;

  const answer = (i: number, ok: boolean) => {
    setResults((r) => {
      const next = { ...r, [i]: ok };
      if (Object.keys(next).length === questions.length) {
        record(id, Object.values(next).filter(Boolean).length / questions.length);
      }
      return next;
    });
  };

  return (
    <div className="widget quiz">
      <div className="widget-title">
        {title}
        {best !== undefined && <span className="pill good">Best: {Math.round(best * 100)}%</span>}
      </div>
      {questions.map((q, i) => (
        <QuestionView key={`${round}-${i}`} q={q} n={i + 1} onAnswer={(ok) => answer(i, ok)} />
      ))}
      {done && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>
            {correct} / {questions.length} correct
          </strong>
          <button
            className="btn btn-sm"
            onClick={() => {
              setResults({});
              setRound((r) => r + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
