export const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Defocus: disc ("bokeh") blur sampled on a golden-angle spiral, with layer magnification.
export const DOF_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uSrc;   // sRGB texture (auto-linearized), premultiplied alpha
uniform vec2 uRes;        // output size in px
uniform float uRadius;    // blur radius in output px
uniform float uScale;     // layer magnification about the image center
uniform float uTexScale;  // texture px per output px
uniform float uBleed;     // 1 = clamp to edge, 0 = transparent outside

vec4 tap(vec2 uvOut, float lod) {
  vec2 uv = (uvOut - 0.5) / uScale + 0.5;
  if (uBleed < 0.5 && (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0)) return vec4(0.0);
  return textureLod(uSrc, clamp(uv, 0.0, 1.0), lod);
}

void main() {
  float lodBase = max(0.0, log2(uTexScale / uScale));
  if (uRadius < 0.6) { o = tap(vUv, lodBase); return; }
  int n = int(clamp(uRadius * uRadius * 1.2, 24.0, 192.0));
  float spacing = uRadius / sqrt(float(n));
  float lod = lodBase + log2(max(1.0, spacing * 0.8));
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 192; i++) {
    if (i >= n) break;
    float fi = float(i) + 0.5;
    float r = sqrt(fi / float(n)) * uRadius;
    float a = fi * 2.39996323;
    vec2 off = vec2(cos(a), sin(a)) * r / uRes;
    acc += tap(vUv + off, lod);
  }
  o = acc / float(n);
}`;

// Directional box blur: subject/scene motion during the exposure, or camera shake.
export const MOTION_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform vec2 uVec;  // total blur vector in px
void main() {
  float len = length(uVec);
  if (len < 0.6) { o = texture(uSrc, vUv); return; }
  int n = int(clamp(ceil(len * 1.5), 2.0, 384.0));
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 384; i++) {
    if (i >= n) break;
    float k = (float(i) + 0.5) / float(n) - 0.5;
    acc += texture(uSrc, vUv + uVec * k / uRes);
  }
  o = acc / float(n);
}`;

// Composite one blurred layer onto the frame (premultiplied "over" via GL blending).
export const LAYER_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uSrc;
uniform float uIntensity;
void main() {
  vec4 c = texture(uSrc, vUv);
  o = vec4(c.rgb * uIntensity, c.a);
}`;

// Final: exposure gain, vignette, highlight shoulder + clipping, ISO noise, sRGB encode.
export const FINAL_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uSrc;
uniform float uGain;
uniform float uNoise;
uniform float uSeed;
uniform float uVignette;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423) + uSeed);
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}
float gauss(vec2 p) {
  float u1 = max(hash(p), 1e-4);
  float u2 = hash(p + 17.31);
  return sqrt(-2.0 * log(u1)) * cos(6.2831853 * u2);
}
vec3 shoulder(vec3 x) {
  const float k = 0.62;
  vec3 hi = k + (1.0 - k) * (1.0 - exp(-(x - k) / (1.0 - k)));
  return mix(x, hi, step(k, x));
}
vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main() {
  vec3 lin = texture(uSrc, vUv).rgb * uGain;
  vec2 d = vUv - 0.5;
  lin *= 1.0 - uVignette * dot(d, d) * 1.3;
  // Sensor saturates: anything above ~2 stops over middle grey clips.
  lin = min(shoulder(max(lin, 0.0)), vec3(1.0));
  vec3 s = toSrgb(lin);
  if (uNoise > 0.0) {
    vec2 px = gl_FragCoord.xy;
    float lum = dot(s, vec3(0.299, 0.587, 0.114));
    float amp = uNoise * (0.55 + 0.9 * (1.0 - lum)) * (1.0 - smoothstep(0.96, 1.0, lum));
    float g = gauss(px);
    vec3 chroma = vec3(gauss(px + 3.1), gauss(px + 7.7), gauss(px + 11.3));
    s += amp * (g + 0.55 * chroma);
  }
  o = vec4(clamp(s, 0.0, 1.0), 1.0);
}`;
