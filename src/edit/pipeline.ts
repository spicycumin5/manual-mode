// WebGL2 photo-editing pipeline: one fragment shader applies the whole develop stack.
import { buildLut } from './curves';
import { EditParams, HSL_BANDS } from './params';

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uImg;
uniform sampler2D uLut;   // 256x1: r,g,b = per-channel curves, a = master curve
uniform float uExposure, uContrast, uHighlights, uShadows, uWhites, uBlacks;
uniform vec3 uWb;
uniform float uHslHue[8], uHslSat[8], uHslLum[8], uBandHue[8];
uniform float uVibrance, uSaturation;
uniform vec3 uShadowTint, uHighTint;
uniform float uBalance;
uniform float uSplit;     // 0..1: left of this x shows the original

vec3 toLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 rgb2hsl(vec3 c) {
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  float l = (mx + mn) * 0.5, h = 0.0, s = 0.0, d = mx - mn;
  if (d > 1e-5) {
    s = l > 0.5 ? d / (2.0 - mx - mn) : d / (mx + mn);
    if (mx == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    else if (mx == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
    h /= 6.0;
  }
  return vec3(h, s, l);
}
float hue2rgb(float p, float q, float t) {
  t = fract(t);
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}
vec3 hsl2rgb(vec3 h) {
  if (h.y < 1e-5) return vec3(h.z);
  float q = h.z < 0.5 ? h.z * (1.0 + h.y) : h.z + h.y - h.z * h.y;
  float p = 2.0 * h.z - q;
  return vec3(hue2rgb(p, q, h.x + 1.0/3.0), hue2rgb(p, q, h.x), hue2rgb(p, q, h.x - 1.0/3.0));
}

vec3 develop(vec3 src) {
  vec3 lin = toLin(src) * exp2(uExposure) * uWb;
  vec3 c = toSrgb(lin);
  float L = luma(c);
  // Shadows / highlights: lift or pull tones by luminance region.
  float wS = 1.0 - smoothstep(0.0, 0.55, L);
  float wH = smoothstep(0.45, 1.0, L);
  c += uShadows * 0.4 * wS * (uShadows > 0.0 ? (1.0 - c) * smoothstep(0.0, 0.1, c + 0.02) : c);
  c += uHighlights * 0.35 * wH * (uHighlights < 0.0 ? c : (1.0 - c));
  // Whites / blacks: move the end points.
  float lo = -uBlacks * 0.12;
  float hi = 1.0 - uWhites * 0.12;
  c = (c - lo) / max(hi - lo, 0.05);
  // Contrast around mid grey.
  c = (c - 0.5) * (1.0 + uContrast * 0.8) + 0.5;
  c = clamp(c, 0.0, 1.0);
  // Tone curves: master, then per channel.
  c = vec3(texture(uLut, vec2((c.r * 255.0 + 0.5) / 256.0, 0.5)).a,
           texture(uLut, vec2((c.g * 255.0 + 0.5) / 256.0, 0.5)).a,
           texture(uLut, vec2((c.b * 255.0 + 0.5) / 256.0, 0.5)).a);
  c = vec3(texture(uLut, vec2((c.r * 255.0 + 0.5) / 256.0, 0.5)).r,
           texture(uLut, vec2((c.g * 255.0 + 0.5) / 256.0, 0.5)).g,
           texture(uLut, vec2((c.b * 255.0 + 0.5) / 256.0, 0.5)).b);
  // HSL per color band.
  vec3 h = rgb2hsl(c);
  float hueDeg = h.x * 360.0;
  float dh = 0.0, ds = 0.0, dl = 0.0, wsum = 0.0;
  for (int i = 0; i < 8; i++) {
    float d = abs(mod(hueDeg - uBandHue[i] + 540.0, 360.0) - 180.0);
    float w = max(0.0, 1.0 - d / 45.0);
    w = w * w * (3.0 - 2.0 * w);
    dh += uHslHue[i] * w; ds += uHslSat[i] * w; dl += uHslLum[i] * w; wsum += w;
  }
  float satMask = smoothstep(0.02, 0.2, h.y);
  h.x = fract(h.x + dh * 30.0 / 360.0 * satMask);
  h.y = clamp(h.y * (1.0 + ds * satMask), 0.0, 1.0);
  h.z = clamp(h.z + dl * 0.25 * satMask * h.y * (1.0 - abs(2.0 * h.z - 1.0)) * 2.0, 0.0, 1.0);
  c = hsl2rgb(h);
  // Vibrance (protects already-saturated colors) and saturation.
  float Lc = luma(c);
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  float vib = uVibrance * (1.0 - sat);
  c = mix(vec3(Lc), c, 1.0 + uSaturation + vib);
  // Split toning.
  float Lt = luma(clamp(c, 0.0, 1.0));
  float bal = uBalance * 0.5;
  float sh = 1.0 - smoothstep(0.0, 0.6 + bal, Lt);
  float hl = smoothstep(0.4 + bal, 1.0, Lt);
  c += uShadowTint * sh + uHighTint * hl;
  return clamp(c, 0.0, 1.0);
}

void main() {
  vec3 src = texture(uImg, vUv).rgb;
  vec3 c = vUv.x < uSplit ? src : develop(src);
  if (uSplit > 0.0 && abs(vUv.x - uSplit) < 0.0015) c = vec3(1.0);
  o = vec4(c, 1.0);
}`;

function hueToRgb(hDeg: number): [number, number, number] {
  const h = hDeg / 60;
  const x = 1 - Math.abs((h % 2) - 1);
  const t: [number, number, number][] = [[1, x, 0], [x, 1, 0], [0, 1, x], [0, x, 1], [x, 0, 1], [1, 0, x]];
  return t[Math.floor(h) % 6];
}

export class EditPipeline {
  readonly gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private img: WebGLTexture;
  private lut: WebGLTexture;
  width = 0;
  height = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 is not available in this browser.');
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
    this.prog = p;
    const names = ['uImg', 'uLut', 'uExposure', 'uContrast', 'uHighlights', 'uShadows', 'uWhites', 'uBlacks', 'uWb', 'uHslHue', 'uHslSat', 'uHslLum', 'uBandHue', 'uVibrance', 'uSaturation', 'uShadowTint', 'uHighTint', 'uBalance', 'uSplit'];
    names.forEach((n) => (this.u[n] = gl.getUniformLocation(p, n)));
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const mk = () => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.img = mk();
    this.lut = mk();
  }

  setImage(source: HTMLImageElement | HTMLCanvasElement, maxEdge = 1400) {
    const gl = this.gl;
    const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const shh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    const k = Math.min(1, maxEdge / Math.max(sw, shh));
    const c = document.createElement('canvas');
    c.width = Math.round(sw * k);
    c.height = Math.round(shh * k);
    c.getContext('2d')!.drawImage(source, 0, 0, c.width, c.height);
    this.width = c.width;
    this.height = c.height;
    this.canvas.width = c.width;
    this.canvas.height = c.height;
    gl.bindTexture(gl.TEXTURE_2D, this.img);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  }

  render(p: EditParams, split = 0): Uint8Array {
    const gl = this.gl;
    const r = buildLut(p.curves.r), g = buildLut(p.curves.g), b = buildLut(p.curves.b), m = buildLut(p.curves.rgb);
    const data = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
      data[i * 4] = Math.round(r[i] * 255);
      data[i * 4 + 1] = Math.round(g[i] * 255);
      data[i * 4 + 2] = Math.round(b[i] * 255);
      data[i * 4 + 3] = Math.round(m[i] * 255);
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.lut);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.img);
    gl.uniform1i(this.u.uImg, 0);
    gl.uniform1i(this.u.uLut, 1);
    gl.uniform1f(this.u.uExposure, p.exposure);
    gl.uniform1f(this.u.uContrast, p.contrast / 100);
    gl.uniform1f(this.u.uHighlights, p.highlights / 100);
    gl.uniform1f(this.u.uShadows, p.shadows / 100);
    gl.uniform1f(this.u.uWhites, p.whites / 100);
    gl.uniform1f(this.u.uBlacks, p.blacks / 100);
    const t = p.temp / 100, ti = p.tint / 100;
    gl.uniform3f(this.u.uWb, 1 + t * 0.35, 1 - ti * 0.25, 1 - t * 0.35);
    gl.uniform1fv(this.u.uHslHue, p.hslHue.map((v) => v / 100));
    gl.uniform1fv(this.u.uHslSat, p.hslSat.map((v) => v / 100));
    gl.uniform1fv(this.u.uHslLum, p.hslLum.map((v) => v / 100));
    gl.uniform1fv(this.u.uBandHue, HSL_BANDS.map((bd) => bd.hue));
    gl.uniform1f(this.u.uVibrance, p.vibrance / 100);
    gl.uniform1f(this.u.uSaturation, p.saturation / 100);
    const tint = (hue: number, sat: number) => {
      const [rr, gg, bb] = hueToRgb(hue);
      const avg = (rr + gg + bb) / 3;
      const k = (sat / 100) * 0.18;
      return [(rr - avg) * k, (gg - avg) * k, (bb - avg) * k] as const;
    };
    gl.uniform3f(this.u.uShadowTint, ...tint(p.gradeShadowHue, p.gradeShadowSat));
    gl.uniform3f(this.u.uHighTint, ...tint(p.gradeHighHue, p.gradeHighSat));
    gl.uniform1f(this.u.uBalance, p.gradeBalance / 100);
    gl.uniform1f(this.u.uSplit, split);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const px = new Uint8Array(this.width * this.height * 4);
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px;
  }
}
