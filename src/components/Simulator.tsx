import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimRenderer, RenderResult } from '../sim/renderer';
import { computeMetrics, SimMetrics } from '../sim/camera';
import { CameraSettings, DEFAULT_SETTINGS, MeterMode, Mode, SIM_H, SIM_W } from '../sim/types';
import { SCENE_LIST, getScene } from '../sim/scenes';
import { APERTURES, EV_COMP, FOCALS, ISOS, SHUTTERS, formatAperture, formatEv, formatShutter } from '../sim/stops';
import { computeHistogram, Histogram } from '../lib/histogram';
import { RulerDial } from './RulerDial';
import { MeterScale } from './MeterScale';
import { HistogramView } from './HistogramView';
import { useLab } from '../edit/labStore';

export type ControlKey =
  | 'mode' | 'aperture' | 'shutter' | 'iso' | 'autoIso' | 'comp' | 'focal' | 'focus'
  | 'meter' | 'tripod' | 'ibis' | 'pan' | 'nd';

const ALL_CONTROLS: ControlKey[] = [
  'mode', 'aperture', 'shutter', 'iso', 'autoIso', 'comp', 'focal', 'focus', 'meter', 'tripod', 'ibis', 'pan', 'nd',
];

export interface SimulatorProps {
  scene?: string;
  /** Show a scene picker with these scenes ('all' = every scene). */
  scenes?: string[] | 'all';
  initial?: Partial<CameraSettings>;
  controls?: ControlKey[];
  layout?: 'wide' | 'stacked';
  readouts?: boolean;
  histogram?: boolean;
  blinkies?: boolean;
  caption?: ReactNode;
  onMetrics?: (m: SimMetrics, s: CameraSettings) => void;
  sendToLab?: boolean;
  aside?: ReactNode;
}

const isFullStopN = (v: number) => [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22].includes(v);
const fullT = [30, 15, 8, 4, 2, 1, 0.5, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 60, 1 / 125, 1 / 250, 1 / 500, 1 / 1000, 1 / 2000, 1 / 4000, 1 / 8000];
const isFullStopT = (v: number) => fullT.some((x) => Math.abs(x - v) / x < 0.01);
const isFullStopIso = (v: number) => [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600].includes(v);
const shortIso = (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`);

const MODE_HELP: Record<Mode, string> = {
  M: 'Manual: you set aperture, shutter and ISO. The meter only advises.',
  Av: 'Aperture priority: you pick the aperture, the camera picks the shutter speed.',
  Tv: 'Shutter priority: you pick the shutter speed, the camera picks the aperture.',
  P: 'Program: the camera picks both. You can still steer with exposure compensation.',
};

function settingsFor(sceneId: string, initial?: Partial<CameraSettings>): CameraSettings {
  const sc = getScene(sceneId);
  return { ...DEFAULT_SETTINGS, ...sc.defaults, focusLayer: sc.subjectLayer, ...initial };
}

export function Simulator({
  scene: sceneProp = 'park-runner',
  scenes,
  initial,
  controls = ALL_CONTROLS,
  layout = 'stacked',
  readouts = true,
  histogram = true,
  blinkies: blinkiesDefault = true,
  caption,
  onMetrics,
  sendToLab = true,
  aside,
}: SimulatorProps) {
  const [sceneId, setSceneId] = useState(sceneProp);
  const scene = getScene(sceneId);
  const [s, setS] = useState<CameraSettings>(() => settingsFor(sceneProp, initial));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SimRenderer | null>(null);
  const lastFrame = useRef<RenderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [hist, setHist] = useState<Histogram | null>(null);
  const [showBlinkies, setShowBlinkies] = useState(blinkiesDefault);
  const navigate = useNavigate();
  const setLabImage = useLab((st) => st.setImage);

  const has = (k: ControlKey) => controls.includes(k);
  const metrics = useMemo(() => computeMetrics(scene, s), [scene, s]);
  const ex = metrics.exposure;

  // Create the renderer once.
  useEffect(() => {
    try {
      rendererRef.current = new SimRenderer(canvasRef.current!);
    } catch (e) {
      setError((e as Error).message);
    }
    return () => rendererRef.current?.dispose();
  }, []);

  // Load the scene textures.
  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    setReady(false);
    r.setScene(scene).then(() => setReady(true)).catch((e) => setError(String(e)));
  }, [scene]);

  // Render on every change.
  useEffect(() => {
    const r = rendererRef.current;
    if (!r || !ready) return;
    const id = requestAnimationFrame(() => {
      const res = r.render(metrics);
      if (!res) return;
      lastFrame.current = res;
      setHist(computeHistogram(res.pixels, 3));
      drawMask(res);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, ready, showBlinkies]);

  useEffect(() => {
    onMetrics?.(metrics, s);
  }, [metrics, s, onMetrics]);

  function drawMask(res: RenderResult) {
    const c = maskRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, SIM_W, SIM_H);
    if (!showBlinkies) return;
    const img = ctx.createImageData(SIM_W, SIM_H);
    const src = res.pixels;
    const dst = img.data;
    for (let y = 0; y < SIM_H; y++) {
      const sy = SIM_H - 1 - y;
      for (let x = 0; x < SIM_W; x++) {
        const si = (sy * SIM_W + x) * 4;
        if (src[si] >= 253 && src[si + 1] >= 253 && src[si + 2] >= 253) {
          const di = (y * SIM_W + x) * 4;
          const stripe = ((x + y) >> 3) & 1;
          dst[di] = stripe ? 255 : 0;
          dst[di + 1] = 0;
          dst[di + 2] = stripe ? 0 : 0;
          dst[di + 3] = 200;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  const update = (patch: Partial<CameraSettings>) => setS((prev) => ({ ...prev, ...patch }));

  const changeScene = (id: string) => {
    setSceneId(id);
    setS(settingsFor(id, initial));
  };

  const editShot = () => {
    const f = lastFrame.current;
    if (!f) return;
    const c = document.createElement('canvas');
    c.width = f.width;
    c.height = f.height;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(f.width, f.height);
    for (let y = 0; y < f.height; y++) {
      const row = f.pixels.subarray((f.height - 1 - y) * f.width * 4, (f.height - y) * f.width * 4);
      img.data.set(row, y * f.width * 4);
    }
    ctx.putImageData(img, 0, 0);
    setLabImage(c.toDataURL('image/png'), `${scene.name} · ${formatAperture(ex.N)} · ${formatShutter(ex.t)} · ISO ${ex.iso}`);
    navigate('/edit');
  };

  const focals = FOCALS.filter((f) => f >= scene.focalRange[0] && f <= scene.focalRange[1]);
  const autoN = ex.auto.aperture;
  const autoT = ex.auto.shutter;
  const autoI = ex.auto.iso;
  const shake = !s.tripod && ex.t > ex.safeShutter * 1.05;
  const sceneOptions = scenes === 'all' ? SCENE_LIST : scenes ? SCENE_LIST.filter((x) => scenes.includes(x.id)) : [];
  const focusLayers = scene.layers.filter((l) => l.focusable);

  const subjBlurGood = metrics.subjectBlurPx < 2;
  const offGood = Math.abs(ex.offset) <= 0.35;

  const viewfinder = (
    <div>
      <div className="viewfinder">
        <canvas ref={canvasRef} aria-label={`Simulated photo of ${scene.name}`} role="img" />
        <canvas ref={maskRef} width={SIM_W} height={SIM_H} className="overlay blinkies" style={{ width: '100%', height: '100%' }} />
        {!ready && !error && <div className="vf-loading">Loading scene…</div>}
        {error && <div className="vf-loading">⚠ {error}</div>}
        <div className="vf-badges">
          {shake && <span className="vf-badge warn">Camera shake: below 1/{Math.round(1 / ex.safeShutter)}s handheld</span>}
          {ex.outOfRange && <span className="vf-badge warn">Exposure out of range</span>}
          {s.pan && <span className="vf-badge">Panning</span>}
          {s.tripod && <span className="vf-badge">Tripod</span>}
          {s.nd > 0 && <span className="vf-badge">ND {s.nd} stops</span>}
        </div>
        <div className="vf-hud">
          <span>{s.mode}</span>
          <span className={autoT ? 'auto' : ''}>{formatShutter(ex.t)}</span>
          <span className={autoN ? 'auto' : ''}>{formatAperture(ex.N)}</span>
          <span className={autoI ? 'auto' : ''}>ISO {ex.iso}</span>
          <MeterScale value={ex.meterReading} warn={ex.outOfRange} />
          {(s.mode !== 'M' || s.autoIso) && s.comp !== 0 && <span>EV{formatEv(s.comp)}</span>}
        </div>
      </div>
      {caption && <div className="small muted" style={{ marginTop: 6 }}>{caption}</div>}
      {layout === 'wide' && aside && <div style={{ marginTop: 14 }}>{aside}</div>}
    </div>
  );

  const panel = (
    <div className="controls">
      <div className="control-panel">
        {sceneOptions.length > 1 && (
          <div className="control-row">
            <span className="control-label">Scene</span>
            <select value={sceneId} onChange={(e) => changeScene(e.target.value)} aria-label="Scene">
              {sceneOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}
        {has('mode') && (
          <div className="dial">
            <span className="control-label">Mode</span>
            <div className="segmented" role="group" aria-label="Shooting mode">
              {(['M', 'Av', 'Tv', 'P'] as Mode[]).map((m) => (
                <button key={m} aria-pressed={s.mode === m} onClick={() => update({ mode: m, aperture: ex.N, shutter: ex.t })} title={MODE_HELP[m]}>
                  {m}
                </button>
              ))}
            </div>
            <span className="small muted">{MODE_HELP[s.mode]}</span>
          </div>
        )}
        {has('aperture') && (
          <RulerDial
            label="Aperture"
            values={APERTURES}
            value={ex.N}
            onChange={(v) => update({ aperture: v })}
            format={formatAperture}
            tickFormat={(v) => `${v}`}
            isFull={isFullStopN}
            disabled={autoN}
            autoLabel={autoN ? 'AUTO' : undefined}
          />
        )}
        {has('shutter') && (
          <RulerDial
            label="Shutter speed"
            values={SHUTTERS}
            value={ex.t}
            onChange={(v) => update({ shutter: v })}
            format={formatShutter}
            isFull={isFullStopT}
            disabled={autoT}
            autoLabel={autoT ? 'AUTO' : undefined}
          />
        )}
        {has('iso') && (
          <RulerDial
            label="ISO"
            values={ISOS}
            value={ex.iso}
            onChange={(v) => update({ iso: v })}
            format={(v) => `${v}`}
            tickFormat={shortIso}
            isFull={isFullStopIso}
            disabled={autoI}
            autoLabel={autoI ? 'AUTO' : undefined}
          />
        )}
        {has('comp') && (s.mode !== 'M' || s.autoIso) && (
          <RulerDial
            label="Exposure compensation"
            values={EV_COMP}
            value={s.comp}
            onChange={(v) => update({ comp: v })}
            format={formatEv}
            isFull={(v) => Number.isInteger(v)}
          />
        )}
        {has('focal') && (
          <RulerDial label="Focal length" values={focals} value={s.focal} onChange={(v) => update({ focal: v })} format={(v) => `${v}mm`} tickFormat={(v) => `${v}`} />
        )}
        <div className="control-row">
          {has('autoIso') && (
            <label className="toggle"><input type="checkbox" checked={s.autoIso} onChange={(e) => update({ autoIso: e.target.checked, iso: ex.iso })} /> Auto ISO</label>
          )}
          {has('tripod') && (
            <label className="toggle"><input type="checkbox" checked={s.tripod} onChange={(e) => update({ tripod: e.target.checked })} /> Tripod</label>
          )}
          {has('pan') && (
            <label className="toggle"><input type="checkbox" checked={s.pan} onChange={(e) => update({ pan: e.target.checked })} /> Pan with subject</label>
          )}
          {histogram && (
            <label className="toggle"><input type="checkbox" checked={showBlinkies} onChange={(e) => setShowBlinkies(e.target.checked)} /> Highlight warning</label>
          )}
        </div>
        {(has('focus') || has('meter') || has('ibis') || has('nd')) && (
          <div className="control-row">
            {has('focus') && focusLayers.length > 1 && (
              <label className="small muted">
                Focus on{' '}
                <select value={s.focusLayer} onChange={(e) => update({ focusLayer: e.target.value })}>
                  {focusLayers.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
                </select>
              </label>
            )}
            {has('meter') && (
              <label className="small muted">
                Metering{' '}
                <select value={s.meterMode} onChange={(e) => update({ meterMode: e.target.value as MeterMode })}>
                  <option value="evaluative">Evaluative</option>
                  <option value="center">Center-weighted</option>
                  <option value="spot">Spot (subject)</option>
                </select>
              </label>
            )}
            {has('ibis') && (
              <label className="small muted">
                Stabilization{' '}
                <select value={s.ibisStops} onChange={(e) => update({ ibisStops: +e.target.value })}>
                  {[0, 2, 3, 4, 5].map((v) => (<option key={v} value={v}>{v ? `${v} stops` : 'Off'}</option>))}
                </select>
              </label>
            )}
            {has('nd') && (
              <label className="small muted">
                ND filter{' '}
                <select value={s.nd} onChange={(e) => update({ nd: +e.target.value })}>
                  {[0, 3, 6, 10].map((v) => (<option key={v} value={v}>{v ? `${v} stops` : 'None'}</option>))}
                </select>
              </label>
            )}
          </div>
        )}
      </div>
      {(histogram || readouts) && (
        <div className="control-panel">
          {histogram && (
            <div className="dial">
              <span className="control-label">Histogram</span>
              <HistogramView hist={hist} />
            </div>
          )}
          {readouts && (
            <div className="readouts">
              <div className="readout"><div className="k">Exposure</div><div className={`v ${offGood ? 'good' : 'bad'}`}>{formatEv(ex.offset)} stops</div></div>
              <div className="readout"><div className="k">Subject blur</div><div className={`v ${subjBlurGood ? 'good' : 'bad'}`}>{metrics.subjectBlurPx.toFixed(1)} px</div></div>
              <div className="readout"><div className="k">Background blur</div><div className="v">{metrics.backgroundBlurPx.toFixed(1)} px</div></div>
              <div className="readout"><div className="k">Noise</div><div className={`v ${ex.iso > 6400 ? 'bad' : ''}`}>{noiseLabel(ex.iso)}</div></div>
              <div className="readout"><div className="k">In focus</div><div className="v">{fmtM(metrics.dof.near)} – {fmtM(metrics.dof.far)}</div></div>
              <div className="readout"><div className="k">Safe handheld</div><div className="v">{formatShutter(ex.safeShutter)}</div></div>
            </div>
          )}
          {sendToLab && (
            <button className="btn btn-sm" onClick={editShot} disabled={!ready}>Edit this shot in the lab →</button>
          )}
        </div>
      )}
      {layout !== 'wide' && aside}
    </div>
  );

  return <div className={`sim ${layout === 'wide' ? 'sim-wide' : ''}`}>{viewfinder}{panel}</div>;
}

function fmtM(m: number) {
  if (!isFinite(m)) return '∞';
  if (m >= 100) return `${Math.round(m)} m`;
  if (m >= 10) return `${m.toFixed(0)} m`;
  return `${m.toFixed(2)} m`;
}

function noiseLabel(iso: number) {
  if (iso <= 400) return 'Clean';
  if (iso <= 1600) return 'Low';
  if (iso <= 6400) return 'Visible';
  return 'Heavy';
}
