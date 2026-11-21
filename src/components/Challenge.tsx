import { useCallback, useState } from 'react';
import { Simulator } from './Simulator';
import type { SimMetrics } from '../sim/camera';
import type { CameraSettings } from '../sim/types';
import { useProgress } from '../progress/store';
import { CHALLENGES, ChallengeDef } from '../content/challenges';

export function Challenge({ id, def: defProp, wide = false }: { id?: string; def?: ChallengeDef; wide?: boolean }) {
  const def = defProp ?? CHALLENGES[id!];
  const [state, setState] = useState<{ m: SimMetrics; s: CameraSettings } | null>(null);
  const [shot, setShot] = useState<{ ok: boolean[] } | null>(null);
  const record = useProgress((st) => st.recordChallenge);
  const prev = useProgress((st) => st.challenges[def.id]);
  const onMetrics = useCallback((m: SimMetrics, s: CameraSettings) => {
    setState({ m, s });
    setShot(null);
  }, []);

  if (!def) return null;
  const live = state ? def.goals.map((g) => g.test(state.m, state.s)) : def.goals.map(() => false);

  const take = () => {
    if (!state) return;
    const ok = def.goals.map((g) => g.test(state.m, state.s));
    const score = ok.filter(Boolean).length / ok.length;
    record(def.id, score, ok.every(Boolean));
    setShot({ ok });
  };

  const aside = (
    <div className="control-panel">
      <div>
        <div className="eyebrow">Challenge</div>
        <h3 style={{ margin: '4px 0' }}>{def.title}</h3>
        <p className="small muted" style={{ margin: 0 }}>{def.brief}</p>
      </div>
      <ul className="challenge-goals">
        {def.goals.map((g, i) => {
          const ok = shot ? shot.ok[i] : live[i];
          return (
            <li key={i}>
              <span className={`goal-dot ${ok ? 'ok' : 'no'}`}>{ok ? '✓' : i + 1}</span>
              <span>
                {g.label}
                {shot && !shot.ok[i] && g.hint && <div className="small muted">{g.hint}</div>}
              </span>
            </li>
          );
        })}
      </ul>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={take}>📸 Take the shot</button>
        {prev?.passed && <span className="pill good">Completed</span>}
      </div>
      {shot && (
        <div className={`callout ${shot.ok.every(Boolean) ? 'tip' : 'warn'}`} style={{ margin: 0 }}>
          {shot.ok.every(Boolean)
            ? def.success ?? 'Nailed it! Every goal met.'
            : `${shot.ok.filter(Boolean).length} of ${shot.ok.length} goals met. Adjust and try again.`}
        </div>
      )}
    </div>
  );

  return (
    <div className="widget" style={{ padding: 12 }}>
      <Simulator
        scene={def.scene}
        initial={def.initial}
        controls={def.controls}
        onMetrics={onMetrics}
        aside={aside}
        readouts={def.readouts ?? true}
        layout={wide ? "wide" : "stacked"}
        sendToLab={false}
      />
    </div>
  );
}
