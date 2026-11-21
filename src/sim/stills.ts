// Renders simulator stills to image URLs with one shared, offscreen WebGL context.
import { SimRenderer } from './renderer';
import { computeMetrics } from './camera';
import { getScene } from './scenes';
import { CameraSettings, DEFAULT_SETTINGS } from './types';

let renderer: SimRenderer | null = null;
let queue: Promise<unknown> = Promise.resolve();
const cache = new Map<string, Promise<string>>();

export function renderStill(sceneId: string, settings: Partial<CameraSettings>): Promise<string> {
  const key = sceneId + JSON.stringify(settings);
  const hit = cache.get(key);
  if (hit) return hit;
  const job = queue.then(async () => {
    if (!renderer) renderer = new SimRenderer(document.createElement('canvas'), { preserve: true });
    const scene = getScene(sceneId);
    await renderer.setScene(scene);
    const s: CameraSettings = { ...DEFAULT_SETTINGS, ...scene.defaults, focusLayer: scene.subjectLayer, ...settings };
    renderer.render(computeMetrics(scene, s), 0.37, false);
    return renderer.canvas.toDataURL('image/jpeg', 0.88);
  });
  queue = job.catch(() => undefined);
  cache.set(key, job);
  return job;
}
