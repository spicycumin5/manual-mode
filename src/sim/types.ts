export type Mode = 'M' | 'Av' | 'Tv' | 'P';
export type MeterMode = 'evaluative' | 'center' | 'spot';

export interface CameraSettings {
  mode: Mode;
  aperture: number;
  shutter: number;
  iso: number;
  autoIso: boolean;
  comp: number; // exposure compensation (stops), used by auto modes / auto ISO
  focal: number; // mm
  focusLayer: string; // id of the layer the AF point is on
  meterMode: MeterMode;
  tripod: boolean;
  ibisStops: number;
  pan: boolean; // track the subject while the shutter is open
  nd: number; // ND filter strength in stops
}

export interface SceneLayer {
  id: string;
  name: string;
  /** Full SVG markup, drawn on a W×H canvas with a transparent background. */
  svg: string;
  /** Distance from the camera (m) at the scene's base focal length. */
  distance: number;
  /** Image-space motion at base scale, px per second. */
  motion?: { x: number; y: number };
  /** Light emission multiplier (>1 for lamps, stars, headlights). */
  intensity?: number;
  /** Rasterize at higher resolution (for layers that get magnified). */
  hiRes?: boolean;
  /** Layer fills the frame: blur by clamping to its edges instead of fading to transparent. */
  bleed?: boolean;
  /** Can the AF point be placed on this layer? */
  focusable?: boolean;
}

export interface Scene {
  id: string;
  name: string;
  blurb: string;
  ev100: number;
  baseFocal: number;
  /** Id of the main subject layer (its distance follows focal length to keep framing). */
  subjectLayer: string;
  /** Stops the meter reads "too bright" when exposure is actually correct, by meter mode. */
  meterBias: Record<MeterMode, number>;
  layers: SceneLayer[];
  defaults: Partial<CameraSettings>;
  /** Allowed focal range for this scene. */
  focalRange: [number, number];
  /** Exaggeration for star trailing so it's visible at screen size. */
  notes?: string;
}

export const SIM_W = 960;
export const SIM_H = 640;

export const DEFAULT_SETTINGS: CameraSettings = {
  mode: 'M',
  aperture: 5.6,
  shutter: 1 / 250,
  iso: 100,
  autoIso: false,
  comp: 0,
  focal: 50,
  focusLayer: '',
  meterMode: 'evaluative',
  tripod: false,
  ibisStops: 0,
  pan: false,
  nd: 0,
};
