import { useRef, useState, KeyboardEvent, PointerEvent } from 'react';
import { nearestIndex, nearestLinearIndex } from '../sim/stops';

const CELL = 46;

interface Props {
  label: string;
  values: number[];
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  /** Short tick labels (defaults to format). */
  tickFormat?: (v: number) => string;
  /** Which indices get a tall tick (e.g. full stops). */
  isFull?: (v: number, i: number) => boolean;
  disabled?: boolean;
  autoLabel?: string;
  hint?: string;
}

export function RulerDial({ label, values, value, onChange, format, tickFormat, isFull, disabled, autoLabel, hint }: Props) {
  let idx = values.findIndex((v) => Math.abs(v - value) < 1e-9);
  if (idx < 0) idx = values[0] > 0 ? nearestIndex(values, value) : nearestLinearIndex(values, value);
  const drag = useRef<{ x: number; idx: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const set = (i: number) => {
    const c = Math.max(0, Math.min(values.length - 1, i));
    if (values[c] !== value) onChange(values[c]);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, idx };
    setDragging(true);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const d = Math.round((drag.current.x - e.clientX) / (CELL * 0.6));
    set(drag.current.idx + d);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current && Math.abs(drag.current.x - e.clientX) < 4) {
      // A click: jump to the tapped cell.
      const rect = e.currentTarget.getBoundingClientRect();
      const offset = Math.round((e.clientX - (rect.left + rect.width / 2)) / CELL);
      set(idx + offset);
    }
    drag.current = null;
    setDragging(false);
  };
  const onKey = (e: KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(idx + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(idx - 1); e.preventDefault(); }
    if (e.key === 'Home') set(0);
    if (e.key === 'End') set(values.length - 1);
  };

  return (
    <div className="dial">
      <div className="dial-head">
        <span className="control-label">{label}</span>
        <span className={`dial-value ${autoLabel ? 'auto' : ''}`}>
          {autoLabel ? `${autoLabel} ` : ''}
          {format(value)}
        </span>
      </div>
      <div className="dial-row">
        <button className="dial-btn" aria-label={`Decrease ${label}`} disabled={disabled || idx <= 0} onClick={() => set(idx - 1)}>‹</button>
        <div
          className="dial-track"
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={values.length - 1}
          aria-valuenow={idx}
          aria-valuetext={format(value)}
          aria-disabled={disabled}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey}        >
          <div className={`dial-strip ${dragging ? 'dragging' : ''}`} style={{ transform: `translateX(${-idx * CELL - CELL / 2}px)` }}>
            {values.map((v, i) => {
              const full = isFull ? isFull(v, i) : true;
              return (
                <div key={i} className={`dial-cell ${full ? 'full' : ''} ${i === idx ? 'sel' : ''}`}>
                  {full || i === idx ? (tickFormat ?? format)(v) : ''}
                </div>
              );
            })}
          </div>
          <div className="dial-marker" />
        </div>
        <button className="dial-btn" aria-label={`Increase ${label}`} disabled={disabled || idx >= values.length - 1} onClick={() => set(idx + 1)}>›</button>
      </div>
      {hint && <div className="small muted">{hint}</div>}
    </div>
  );
}
