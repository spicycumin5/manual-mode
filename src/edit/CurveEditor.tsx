import { MouseEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import { buildLut, Pt } from './curves';
import type { Histogram } from '../lib/histogram';

const COLORS = { rgb: '', r: '#ff5a5a', g: '#3fbf6a', b: '#4a7cff' };
const lineColor = (ch: keyof typeof COLORS) => COLORS[ch] || getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#888';

export function CurveEditor({
  points,
  onChange,
  channel,
  hist,
}: {
  points: Pt[];
  onChange: (p: Pt[]) => void;
  channel: 'rgb' | 'r' | 'g' | 'b';
  hist?: Histogram | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const S = c.clientWidth * dpr;
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, S, S);
    // Histogram backdrop
    if (hist) {
      const h = channel === 'rgb' ? hist.l : hist[channel];
      let max = 1;
      for (let i = 2; i < 254; i++) max = Math.max(max, h[i]);
      ctx.fillStyle = 'rgba(128,128,128,0.22)';
      ctx.beginPath();
      ctx.moveTo(0, S);
      for (let i = 0; i < 256; i++) ctx.lineTo((i / 255) * S, S - Math.min(1, h[i] / max) * S * 0.9);
      ctx.lineTo(S, S);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(128,128,128,0.25)';
    ctx.lineWidth = dpr;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath(); ctx.moveTo((S * k) / 4, 0); ctx.lineTo((S * k) / 4, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (S * k) / 4); ctx.lineTo(S, (S * k) / 4); ctx.stroke();
    }
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.beginPath(); ctx.moveTo(0, S); ctx.lineTo(S, 0); ctx.stroke();
    ctx.setLineDash([]);
    const lut = buildLut(points);
    ctx.strokeStyle = lineColor(channel);
    ctx.lineWidth = 2.2 * dpr;
    ctx.beginPath();
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * S;
      const y = S - lut[i] * S;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    points.forEach(([px, py], i) => {
      ctx.beginPath();
      ctx.arc(px * S, S - py * S, (i === drag || i === hover ? 7 : 5.5) * dpr, 0, Math.PI * 2);
      ctx.fillStyle = i === drag ? lineColor(channel) : getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#111';
      ctx.fill();
      ctx.strokeStyle = lineColor(channel);
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();
    });
  }, [points, channel, hist, drag, hover]);

  const toPt = (e: PointerEvent): Pt => {
    const r = ref.current!.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height))];
  };
  const find = (p: Pt) => {
    let best = -1, bd = 0.045;
    points.forEach((q, i) => {
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toPt(e);
    const i = find(p);
    if (i >= 0) {
      setDrag(i);
      return;
    }
    const next = [...points, p].sort((a, b) => a[0] - b[0]);
    onChange(next);
    setDrag(next.findIndex((q) => q === p));
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = toPt(e);
    if (drag === null) {
      setHover(find(p) >= 0 ? find(p) : null);
      return;
    }
    const next = points.map((q) => [...q] as Pt);
    const isEnd = drag === 0 || drag === points.length - 1;
    // Keep x ordering; end points may move vertically and inward.
    const minX = drag > 0 ? points[drag - 1][0] + 0.01 : 0;
    const maxX = drag < points.length - 1 ? points[drag + 1][0] - 0.01 : 1;
    next[drag] = [isEnd && drag === 0 ? Math.min(p[0], maxX) : isEnd ? Math.max(p[0], minX) : Math.min(maxX, Math.max(minX, p[0])), p[1]];
    onChange(next);
  };
  const up = () => setDrag(null);
  const dbl = (e: MouseEvent<HTMLCanvasElement>) => {
    const r = ref.current!.getBoundingClientRect();
    const p: Pt = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    const i = find(p);
    if (i > 0 && i < points.length - 1) onChange(points.filter((_, k) => k !== i));
  };

  return (
    <div>
      <canvas
        ref={ref}
        className="curve-editor"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDoubleClick={dbl}
        role="img"
        aria-label={`Tone curve with ${points.length} points`}
      />
      <div className="small muted" style={{ marginTop: 4 }}>Click to add a point, drag to move, double-click to remove.</div>
    </div>
  );
}
