import { DOF_FRAG, FINAL_FRAG, LAYER_FRAG, MOTION_FRAG, VERT } from './shaders';
import type { SimMetrics } from './camera';
import { SIM_H, SIM_W, Scene, SceneLayer } from './types';
import { wrapSvg } from './scenes/svg';

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

interface Target {
  fb: WebGLFramebuffer;
  tex: WebGLTexture;
}

interface LayerTex {
  layer: SceneLayer;
  tex: WebGLTexture;
  texScale: number;
}

const SHAKE_DIR = { x: 0.86, y: 0.5 };

export interface RenderResult {
  pixels: Uint8Array; // RGBA, bottom-up rows
  width: number;
  height: number;
}

async function rasterize(layer: SceneLayer, scale: number): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.decoding = 'async';
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(wrapSvg(layer.svg, scale));
  await img.decode();
  const c = document.createElement('canvas');
  c.width = SIM_W * scale;
  c.height = SIM_H * scale;
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

const sceneCanvasCache = new Map<string, Promise<HTMLCanvasElement[]>>();

function rasterizeScene(scene: Scene): Promise<HTMLCanvasElement[]> {
  let p = sceneCanvasCache.get(scene.id);
  if (!p) {
    p = Promise.all(scene.layers.map((l) => rasterize(l, l.hiRes ? 2 : 1)));
    sceneCanvasCache.set(scene.id, p);
  }
  return p;
}

export class SimRenderer {
  readonly gl: WebGL2RenderingContext;
  private progs: Record<'dof' | 'motion' | 'layer' | 'final', Prog>;
  private a: Target;
  private b: Target;
  private c: Target;
  private d: Target;
  private layers: LayerTex[] = [];
  private sceneId = '';
  private loading: Promise<void> | null = null;
  readonly floatTargets: boolean;

  constructor(readonly canvas: HTMLCanvasElement, opts: { preserve?: boolean } = {}) {
    canvas.width = SIM_W;
    canvas.height = SIM_H;
    const gl = canvas.getContext('webgl2', {
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: !!opts.preserve,
    });
    if (!gl) throw new Error('WebGL2 is not available in this browser.');
    this.gl = gl;
    this.floatTargets = !!gl.getExtension('EXT_color_buffer_float');

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    this.progs = {
      dof: this.program(DOF_FRAG, ['uSrc', 'uRes', 'uRadius', 'uScale', 'uTexScale', 'uBleed']),
      motion: this.program(MOTION_FRAG, ['uSrc', 'uRes', 'uVec']),
      layer: this.program(LAYER_FRAG, ['uSrc', 'uIntensity']),
      final: this.program(FINAL_FRAG, ['uSrc', 'uGain', 'uNoise', 'uSeed', 'uVignette']),
    };
    this.a = this.target();
    this.b = this.target();
    this.c = this.target();
    this.d = this.target();
  }

  private program(frag: string, uniforms: string[]): Prog {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader error');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link error');
    const u: Prog['u'] = {};
    uniforms.forEach((n) => (u[n] = gl.getUniformLocation(p, n)));
    return { p, u };
  }

  private target(): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (this.floatTargets) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIM_W, SIM_H, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, SIM_W, SIM_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { fb, tex };
  }

  async setScene(scene: Scene): Promise<void> {
    if (this.sceneId === scene.id && !this.loading) return;
    if (this.sceneId === scene.id && this.loading) return this.loading;
    this.sceneId = scene.id;
    this.loading = (async () => {
      const canvases = await rasterizeScene(scene);
      if (this.sceneId !== scene.id) return;
      const gl = this.gl;
      this.layers.forEach((l) => gl.deleteTexture(l.tex));
      this.layers = scene.layers.map((layer, i) => {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, canvases[i]);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return { layer, tex, texScale: layer.hiRes ? 2 : 1 };
      });
    })();
    await this.loading;
    this.loading = null;
  }

  get ready() {
    return this.layers.length > 0 && !this.loading;
  }

  private pass(prog: Prog, src: WebGLTexture, dst: Target | null) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
    gl.viewport(0, 0, SIM_W, SIM_H);
    gl.useProgram(prog.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src);
    gl.uniform1i(prog.u.uSrc, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  render(m: SimMetrics, seed = 0.37, readback = true): RenderResult | null {
    if (!this.ready) return null;
    const gl = this.gl;
    const { dof, motion, layer, final } = this.progs;

    // Clear the composite.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.c.fb);
    gl.viewport(0, 0, SIM_W, SIM_H);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (const lt of this.layers) {
      const lm = m.layers.find((x) => x.id === lt.layer.id);
      if (!lm) continue;
      const radius = Math.hypot(lm.dofPx, m.diffractionPx) / 2;

      gl.useProgram(dof.p);
      gl.uniform2f(dof.u.uRes, SIM_W, SIM_H);
      gl.uniform1f(dof.u.uRadius, radius);
      gl.uniform1f(dof.u.uScale, lm.scale);
      gl.uniform1f(dof.u.uTexScale, lt.texScale);
      gl.uniform1f(dof.u.uBleed, lt.layer.bleed ? 1 : 0);
      this.pass(dof, lt.tex, this.a);

      gl.useProgram(motion.p);
      gl.uniform2f(motion.u.uRes, SIM_W, SIM_H);
      gl.uniform2f(motion.u.uVec, lm.motionPx.x, -lm.motionPx.y);
      this.pass(motion, this.a.tex, this.b);

      gl.useProgram(layer.p);
      gl.uniform1f(layer.u.uIntensity, lm.intensity);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      this.pass(layer, this.b.tex, this.c);
      gl.disable(gl.BLEND);
    }

    // Camera shake smears the whole frame.
    gl.useProgram(motion.p);
    gl.uniform2f(motion.u.uRes, SIM_W, SIM_H);
    gl.uniform2f(motion.u.uVec, SHAKE_DIR.x * m.shakePx, SHAKE_DIR.y * m.shakePx);
    this.pass(motion, this.c.tex, this.d);

    gl.useProgram(final.p);
    gl.uniform1f(final.u.uGain, Math.pow(2, m.exposure.offset));
    gl.uniform1f(final.u.uNoise, m.noise);
    gl.uniform1f(final.u.uSeed, seed);
    gl.uniform1f(final.u.uVignette, m.vignette);
    this.pass(final, this.d.tex, null);

    if (!readback) return null;
    const pixels = new Uint8Array(SIM_W * SIM_H * 4);
    gl.readPixels(0, 0, SIM_W, SIM_H, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return { pixels, width: SIM_W, height: SIM_H };
  }

  dispose() {
    const gl = this.gl;
    this.layers.forEach((l) => gl.deleteTexture(l.tex));
    this.layers = [];
    this.sceneId = '';
    // Note: we don't force-lose the context; React StrictMode remounts reuse the same canvas.
  }
}
