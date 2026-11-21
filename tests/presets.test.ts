import { describe, expect, it } from 'vitest';
import { resolveExposure } from '../src/sim/camera';
import { getScene } from '../src/sim/scenes';
import { DEFAULT_SETTINGS, CameraSettings } from '../src/sim/types';
import { EXERCISES } from '../src/edit/exercises';
import { QUIZZES } from '../src/content/quizzes';
import { SCENARIOS } from '../src/content/scenarios';
import { SCENE_LIST } from '../src/sim/scenes';

function offset(sceneId: string, settings: Partial<CameraSettings>) {
  const sc = getScene(sceneId);
  return resolveExposure(sc, { ...DEFAULT_SETTINGS, ...sc.defaults, focusLayer: sc.subjectLayer, ...settings }).offset;
}

describe('preset stills are correctly exposed', () => {
  it('scene defaults', () => {
    for (const sc of SCENE_LIST) {
      // The snow scene deliberately starts in Av, fooled by the meter.
      if (sc.id === 'snow') continue;
      expect(Math.abs(offset(sc.id, {})), sc.id).toBeLessThan(0.7);
    }
  });

  it('edit exercises', () => {
    for (const ex of Object.values(EXERCISES)) {
      expect(Math.abs(offset(ex.image.scene, ex.image.settings)), ex.id).toBeLessThan(0.7);
    }
  });

  it('quiz image frames', () => {
    for (const [id, qs] of Object.entries(QUIZZES)) {
      for (const q of qs) {
        if (q.type !== 'image') continue;
        for (const f of q.frames) expect(Math.abs(offset(f.scene, f.settings)), `${id} ${f.label}`).toBeLessThan(0.7);
      }
    }
  });

  it('scenario simulator presets', () => {
    for (const s of SCENARIOS) {
      if (!s.sim) continue;
      const o = offset(s.sim.scene, s.sim.settings);
      expect(Math.abs(o), s.id).toBeLessThan(0.7);
    }
  });
});
