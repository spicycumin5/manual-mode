import { PointerEvent, useEffect, useRef, useState } from 'react';
import { renderStill } from '../sim/stills';
import type { CameraSettings } from '../sim/types';
import { PHOTO_MANIFEST } from '../content/photos/manifest';

export interface Frame {
  label: string;
  scene: string;
  settings: Partial<CameraSettings>;
  /** Manifest slot id: if a real photo is registered, it replaces the simulation. */
  slot?: string;
}

/** Resolves a frame to an image URL (real photo if available, otherwise a simulator render). */
export function useFrameSrc(frame: Frame): { src: string | null; real: boolean; credit?: string } {
  const real = frame.slot ? PHOTO_MANIFEST[frame.slot] : undefined;
  const [src, setSrc] = useState<string | null>(real ? import.meta.env.BASE_URL + real.src : null);
  const key = frame.scene + JSON.stringify(frame.settings);
  useEffect(() => {
    if (real) return;
    let alive = true;
    renderStill(frame.scene, frame.settings).then((u) => alive && setSrc(u)).catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, real]);
  return { src, real: !!real, credit: real?.credit };
}

function FrameImg({ frame, alt }: { frame: Frame; alt?: string }) {
  const { src } = useFrameSrc(frame);
  return src ? <img src={src} alt={alt ?? frame.label} loading="lazy" /> : <div style={{ aspectRatio: '3/2', background: 'var(--surface-2)', borderRadius: 8 }} />;
}

export function PhotoStrip({ frames, note = true }: { frames: Frame[]; note?: boolean }) {
  const anySim = frames.some((f) => !(f.slot && PHOTO_MANIFEST[f.slot]));
  return (
    <div className="widget">
      <div className="strip">
        {frames.map((f, i) => (
          <figure key={i}>
            <FrameImg frame={f} />
            <figcaption>{f.label}</figcaption>
          </figure>
        ))}
      </div>
      {note && anySim && <div className="sim-note">Simulated renders. Add your own photos in <code>src/content/photos/manifest.ts</code>.</div>}
    </div>
  );
}

export function PhotoCompare({ a, b }: { a: Frame; b: Frame }) {
  const A = useFrameSrc(a);
  const B = useFrameSrc(b);
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const move = (e: PointerEvent) => {
    if (!dragging.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };
  return (
    <div className="widget">
      <div
        ref={ref}
        className="compare"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        onPointerUp={() => (dragging.current = false)}
        role="slider"
        aria-label="Comparison slider"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5));
          if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5));
        }}
      >
        {B.src && <img src={B.src} alt={b.label} />}
        {A.src && <img src={A.src} alt={a.label} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />}
        <div className="handle" style={{ left: `${pos}%` }} />
        <span className="tag" style={{ left: 10 }}>{a.label}</span>
        <span className="tag" style={{ right: 10 }}>{b.label}</span>
      </div>
      {(!A.real || !B.real) && <div className="sim-note">Simulated renders. Drag the handle to compare.</div>}
    </div>
  );
}
