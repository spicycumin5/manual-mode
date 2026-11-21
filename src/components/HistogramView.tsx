import { useEffect, useRef } from 'react';
import type { Histogram } from '../lib/histogram';

export function HistogramView({ hist, rgb = true, height = 90 }: { hist: Histogram | null; rgb?: boolean; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c || !hist) return;
    const dpr = window.devicePixelRatio || 1;
    const W = c.clientWidth * dpr;
    const H = height * dpr;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    const smooth = (a: Uint32Array) => {
      const out = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        let s = 0, w = 0;
        for (let k = -2; k <= 2; k++) {
          const j = i + k;
          if (j >= 0 && j < 256) { s += a[j]; w++; }
        }
        out[i] = s / w;
      }
      return out;
    };
    const chans: [Uint32Array, string][] = rgb
      ? [[hist.r, 'rgba(255,80,80,0.55)'], [hist.g, 'rgba(80,220,110,0.5)'], [hist.b, 'rgba(90,150,255,0.55)']]
      : [];
    chans.push([hist.l, rgb ? 'rgba(235,235,235,0.55)' : 'rgba(235,235,235,0.85)']);
    const all = chans.map(([a]) => smooth(a));
    // Scale by a high percentile so a single spike doesn't flatten everything.
    const sorted = Array.from(all[all.length - 1]).sort((a, b) => a - b);
    const max = Math.max(sorted[Math.floor(255 * 0.97)] * 1.25, 1);

    ctx.globalCompositeOperation = 'lighter';
    all.forEach((data, ci) => {
      ctx.fillStyle = chans[ci][1];
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * W;
        const y = H - Math.min(1, data[i] / max) * (H - 2);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    // Thirds guides
    ctx.strokeStyle = 'rgba(128,128,128,0.25)';
    ctx.lineWidth = dpr;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo((W * k) / 4, 0);
      ctx.lineTo((W * k) / 4, H);
      ctx.stroke();
    }
    // Clipping warnings
    if (hist.clipHi > 0.004) { ctx.fillStyle = '#ff5a5a'; ctx.fillRect(W - 6 * dpr, 0, 6 * dpr, H); }
    if (hist.clipLo > 0.02) { ctx.fillStyle = '#5a8cff'; ctx.fillRect(0, 0, 6 * dpr, H); }
  }, [hist, rgb, height]);

  return <canvas ref={ref} className="histogram" style={{ height }} aria-label="Histogram" role="img" />;
}
