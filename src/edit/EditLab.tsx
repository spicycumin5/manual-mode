import { ChangeEvent, PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { EditPipeline } from './pipeline';
import { DEFAULT_PARAMS, EditParams, HSL_BANDS, withParams } from './params';
import { CurveEditor } from './CurveEditor';
import { EXERCISES, ExerciseDef, PanelKey, PRESETS } from './exercises';
import { computeHistogram, Histogram } from '../lib/histogram';
import { HistogramView } from '../components/HistogramView';
import { renderStill } from '../sim/stills';
import { SCENE_LIST } from '../sim/scenes';
import { useLab } from './labStore';
import { useProgress } from '../progress/store';

const ALL_PANELS: PanelKey[] = ['basic', 'wb', 'curves', 'hsl', 'color', 'grade'];
const PANEL_TITLES: Record<PanelKey, string> = {
  basic: 'Light',
  wb: 'White balance',
  curves: 'Tone curve',
  hsl: 'Color mixer (HSL)',
  color: 'Vibrance & saturation',
  grade: 'Color grading',
};

function Slider({ label, value, onChange, min = -100, max = 100, step = 1, fmt }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; fmt?: (v: number) => string }) {
  return (
    <div className="slider-row">
      <label>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} onDoubleClick={() => onChange(0)} aria-label={label} />
      <span className="val">{fmt ? fmt(value) : value > 0 ? `+${value}` : value}</span>
    </div>
  );
}

interface Props {
  panels?: PanelKey[];
  exercise?: string | ExerciseDef;
  /** Show the sample picker, upload and export (the full lab page). */
  full?: boolean;
  defaultScene?: string;
}

export function EditLab({ panels: panelsProp, exercise: exProp, full = false, defaultScene = 'park-runner' }: Props) {
  const exercise = typeof exProp === 'string' ? EXERCISES[exProp] : exProp;
  const panels = exercise?.panels ?? panelsProp ?? ALL_PANELS;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipe = useRef<EditPipeline | null>(null);
  const labImage = useLab((s) => s.image);
  const labLabel = useLab((s) => s.label);
  const recordChallenge = useProgress((s) => s.recordChallenge);
  const [params, setParams] = useState<EditParams>(() => withParams(exercise?.start ?? {}));
  const [hist, setHist] = useState<Histogram | null>(null);
  const [split, setSplit] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<'rgb' | 'r' | 'g' | 'b'>('rgb');
  const [source, setSource] = useState<string>(full && labImage ? 'lab' : `scene:${exercise?.image.scene ?? defaultScene}`);
  const [targetSrc, setTargetSrc] = useState<string | null>(null);
  const [match, setMatch] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [reload, setReload] = useState(0);
  const uploadUrl = useRef<string | null>(null);

  useEffect(() => {
    try {
      pipe.current = new EditPipeline(canvasRef.current!);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // Load the image.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      let src: string;
      if (source === 'lab' && labImage) src = labImage;
      else if (source === 'upload' && uploadUrl.current) src = uploadUrl.current;
      else {
        const sceneId = source.startsWith('scene:') ? source.slice(6) : defaultScene;
        const settings = exercise && exercise.image.scene === sceneId ? exercise.image.settings : {};
        src = await renderStill(sceneId, settings);
      }
      const img = new Image();
      img.src = src;
      await img.decode();
      if (!alive || !pipe.current) return;
      pipe.current.setImage(img);
      if (exercise) {
        pipe.current.render(withParams(exercise.target));
        setTargetSrc(canvasRef.current!.toDataURL('image/jpeg', 0.85));
      }
      setLoaded((n) => n + 1);
    };
    load().catch((e) => setError(String(e)));
    return () => {
      alive = false;
    };
  }, [source, labImage, exercise, defaultScene, reload]);

  // Render on change.
  useEffect(() => {
    if (!loaded || !pipe.current) return;
    const id = requestAnimationFrame(() => {
      const px = pipe.current!.render(params, split);
      setHist(computeHistogram(px, 7));
    });
    return () => cancelAnimationFrame(id);
  }, [params, split, loaded]);

  const set = useCallback(<K extends keyof EditParams>(k: K, v: EditParams[K]) => {
    setParams((p) => ({ ...p, [k]: v }));
    setMatch(null);
  }, []);

  const setBand = (k: 'hslHue' | 'hslSat' | 'hslLum', i: number, v: number) => {
    setParams((p) => {
      const arr = [...p[k]];
      arr[i] = v;
      return { ...p, [k]: arr };
    });
    setMatch(null);
  };

  const checkMatch = () => {
    if (!exercise || !pipe.current) return;
    const a = pipe.current.render(withParams(exercise.target));
    const b = pipe.current.render(params);
    let sum = 0, n = 0;
    for (let i = 0; i < a.length; i += 4 * 9) {
      sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      n += 3;
    }
    const diff = sum / n;
    const score = Math.max(0, Math.round(100 - diff * 4));
    setMatch(score);
    recordChallenge(`edit-${exercise.id}`, score / 100, score >= 90);
    pipe.current.render(params, split);
  };

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (uploadUrl.current) URL.revokeObjectURL(uploadUrl.current);
    uploadUrl.current = URL.createObjectURL(f);
    setUploadName(f.name);
    setSource('upload');
    setReload((n) => n + 1);
    e.target.value = '';
  };

  const exportJpeg = () => {
    if (!pipe.current) return;
    pipe.current.render(params, 0);
    canvasRef.current!.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'manual-mode-edit.jpg';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        pipe.current!.render(params, split);
      },
      'image/jpeg',
      0.92,
    );
  };

  const dragSplit = useRef(false);
  const onSplitMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragSplit.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    setSplit(Math.min(1, Math.max(0.001, (e.clientX - r.left) / r.width)));
  };

  const fmtStops = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`;

  return (
    <div className="lab">
      <div style={{ display: 'grid', gap: 12 }}>
        {full && (
          <div className="control-row">
            <label className="small muted">
              Photo{' '}
              <select value={source.startsWith('upload') ? 'upload' : source} onChange={(e) => { setSource(e.target.value); setLoaded(0); }}>
                {labImage && <option value="lab">Your simulator shot</option>}
                {uploadUrl.current && <option value="upload">{uploadName}</option>}
                {SCENE_LIST.map((s) => (<option key={s.id} value={`scene:${s.id}`}>Sample: {s.name}</option>))}
              </select>
            </label>
            <label className="btn btn-sm">
              Open your photo…
              <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
            </label>
            <span className="small muted">Photos stay on your device and are never uploaded.</span>
          </div>
        )}
        {full && source === 'lab' && labLabel && <div className="small muted">Editing: {labLabel}</div>}
        <div
          className="lab-canvas-wrap"
          onPointerMove={onSplitMove}
          onPointerUp={() => (dragSplit.current = false)}
          onPointerLeave={() => (dragSplit.current = false)}
        >
          <canvas ref={canvasRef} aria-label="Edited photo" role="img" />
          {error && <div className="vf-loading">⚠ {error}</div>}
          {split > 0 && (
            <>
              <div
                className="lab-split"
                style={{ left: `${split * 100}%` }}
                onPointerDown={(e) => { dragSplit.current = true; e.currentTarget.setPointerCapture(e.pointerId); }}
              />
              <span className="lab-split-label" style={{ left: 8 }}>Before</span>
              <span className="lab-split-label" style={{ right: 8 }}>After</span>
            </>
          )}
        </div>
        <div className="control-row">
          <label className="toggle">
            <input type="checkbox" checked={split > 0} onChange={(e) => setSplit(e.target.checked ? 0.5 : 0)} /> Before / after
          </label>
          <button className="btn btn-sm" onClick={() => { setParams(withParams(exercise?.start ?? {})); setMatch(null); }}>Reset all</button>
          {full && <button className="btn btn-sm" onClick={exportJpeg}>Export JPEG</button>}
          {full && (
            <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(JSON.stringify(params, null, 2))}>Copy settings</button>
          )}
        </div>
        {full && (
          <div className="control-row">
            <span className="control-label">Looks</span>
            {PRESETS.map((p) => (
              <button key={p.name} className="btn btn-sm" onClick={() => setParams(withParams(p.params))}>{p.name}</button>
            ))}
          </div>
        )}
        {exercise && (
          <div className="widget" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,160px) 1fr', gap: 14, alignItems: 'center' }}>
            <div>
              <div className="small muted">Target</div>
              {targetSrc && <img src={targetSrc} alt="Target look" style={{ width: '100%', borderRadius: 6, display: 'block' }} />}
            </div>
            <div>
              <strong>{exercise.title}</strong>
              <p className="small muted" style={{ margin: '4px 0 8px' }}>{exercise.brief}</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={checkMatch}>Check match</button>
                {match !== null && (
                  <span className={`pill ${match >= 90 ? 'good' : ''}`}>{match}% match{match >= 90 ? ' · Great!' : match >= 75 ? ' · Close' : ''}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <div className="panel" style={{ padding: 12 }}>
          <div className="control-label" style={{ marginBottom: 6 }}>Histogram</div>
          <HistogramView hist={hist} />
        </div>
        {panels.includes('basic') && (
          <details className="panel" open>
            <summary>{PANEL_TITLES.basic}</summary>
            <div className="panel-body">
              <Slider label="Exposure" value={params.exposure} onChange={(v) => set('exposure', v)} min={-3} max={3} step={0.05} fmt={fmtStops} />
              <Slider label="Contrast" value={params.contrast} onChange={(v) => set('contrast', v)} />
              <Slider label="Highlights" value={params.highlights} onChange={(v) => set('highlights', v)} />
              <Slider label="Shadows" value={params.shadows} onChange={(v) => set('shadows', v)} />
              <Slider label="Whites" value={params.whites} onChange={(v) => set('whites', v)} />
              <Slider label="Blacks" value={params.blacks} onChange={(v) => set('blacks', v)} />
            </div>
          </details>
        )}
        {panels.includes('wb') && (
          <details className="panel" open>
            <summary>{PANEL_TITLES.wb}</summary>
            <div className="panel-body">
              <Slider label="Temperature" value={params.temp} onChange={(v) => set('temp', v)} />
              <Slider label="Tint" value={params.tint} onChange={(v) => set('tint', v)} />
              <div className="small muted">Temperature: blue ↔ yellow. Tint: green ↔ magenta.</div>
            </div>
          </details>
        )}
        {panels.includes('curves') && (
          <details className="panel" open>
            <summary>{PANEL_TITLES.curves}</summary>
            <div className="panel-body">
              <div className="segmented" role="group" aria-label="Curve channel">
                {(['rgb', 'r', 'g', 'b'] as const).map((c) => (
                  <button key={c} aria-pressed={channel === c} onClick={() => setChannel(c)}>{c.toUpperCase()}</button>
                ))}
              </div>
              <CurveEditor
                points={params.curves[channel]}
                channel={channel}
                hist={hist}
                onChange={(pts) => setParams((p) => ({ ...p, curves: { ...p.curves, [channel]: pts } }))}
              />
              <button className="btn btn-sm" style={{ justifySelf: 'start' }} onClick={() => setParams((p) => ({ ...p, curves: { ...p.curves, [channel]: DEFAULT_PARAMS.curves.rgb } }))}>
                Reset curve
              </button>
            </div>
          </details>
        )}
        {panels.includes('hsl') && (
          <details className="panel" open>
            <summary>{PANEL_TITLES.hsl}</summary>
            <div className="panel-body">
              {(['hslHue', 'hslSat', 'hslLum'] as const).map((k) => (
                <div key={k} style={{ display: 'grid', gap: 4 }}>
                  <div className="control-label">{k === 'hslHue' ? 'Hue' : k === 'hslSat' ? 'Saturation' : 'Luminance'}</div>
                  {HSL_BANDS.map((b, i) => (
                    <div className="slider-row" key={b.name}>
                      <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, display: 'inline-block' }} /> {b.name}
                      </label>
                      <input type="range" min={-100} max={100} value={params[k][i]} onChange={(e) => setBand(k, i, +e.target.value)} onDoubleClick={() => setBand(k, i, 0)} aria-label={`${b.name} ${k}`} />
                      <span className="val">{params[k][i]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </details>
        )}
        {panels.includes('color') && (
          <details className="panel" open={!full}>
            <summary>{PANEL_TITLES.color}</summary>
            <div className="panel-body">
              <Slider label="Vibrance" value={params.vibrance} onChange={(v) => set('vibrance', v)} />
              <Slider label="Saturation" value={params.saturation} onChange={(v) => set('saturation', v)} />
            </div>
          </details>
        )}
        {panels.includes('grade') && (
          <details className="panel" open={!full}>
            <summary>{PANEL_TITLES.grade}</summary>
            <div className="panel-body">
              <div className="control-label">Shadows</div>
              <Slider label="Hue" value={params.gradeShadowHue} onChange={(v) => set('gradeShadowHue', v)} min={0} max={359} fmt={(v) => `${v}°`} />
              <Slider label="Amount" value={params.gradeShadowSat} onChange={(v) => set('gradeShadowSat', v)} min={0} max={100} />
              <div className="control-label">Highlights</div>
              <Slider label="Hue" value={params.gradeHighHue} onChange={(v) => set('gradeHighHue', v)} min={0} max={359} fmt={(v) => `${v}°`} />
              <Slider label="Amount" value={params.gradeHighSat} onChange={(v) => set('gradeHighSat', v)} min={0} max={100} />
              <Slider label="Balance" value={params.gradeBalance} onChange={(v) => set('gradeBalance', v)} />
              <div style={{ height: 10, borderRadius: 999, background: 'linear-gradient(90deg, hsl(0 80% 55%), hsl(60 80% 55%), hsl(120 80% 45%), hsl(180 80% 45%), hsl(240 80% 60%), hsl(300 80% 55%), hsl(360 80% 55%))' }} />
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
