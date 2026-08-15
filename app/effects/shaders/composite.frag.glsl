#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2 uResolution;
uniform float uTime;
uniform float uRows;
uniform vec3 uPhosphor;
uniform vec2 uCursorCell; // (col, row) in cell units; negative = hidden
uniform vec2 uCellSize;   // in uv units

// EffectParams, all 0..1
uniform float uCurvature;
uniform float uAberration;
uniform float uGlow;
uniform float uScanline;
uniform float uNoise;
uniform float uVignette;
uniform float uFlicker;
uniform float uTint;

in vec2 vUv;
out vec4 fragColor;

// Must match MAX_WARP in app/effects/params.ts
const float MAX_WARP = 0.18;

vec2 barrelWarp(vec2 uv, float curvature) {
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + curvature * MAX_WARP * r2;
  return c * 0.5 + 0.5;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y); // scene texture is top-left origin
  vec2 warped = barrelWarp(uv, uCurvature);

  // VHS tracking: a drifting horizontal band that shifts x and adds noise.
  float band = fract(warped.y * 0.7 - uTime * 0.06);
  float tracking = smoothstep(0.0, 0.015, band) * smoothstep(0.03, 0.015, band);
  warped.x += tracking * uNoise * 0.012 * (hash(vec2(floor(uTime * 24.0), floor(warped.y * 90.0))) - 0.5);

  // Outside the tube face: dark border.
  if (warped.x < 0.0 || warped.x > 1.0 || warped.y < 0.0 || warped.y > 1.0) {
    fragColor = vec4(0.01, 0.01, 0.01, 1.0);
    return;
  }

  // Chromatic aberration: radial RGB split.
  vec2 dir = (warped - 0.5);
  vec2 caOffset = dir * uAberration * 0.004;
  vec3 color;
  color.r = texture(uScene, warped + caOffset).r;
  color.g = texture(uScene, warped).g;
  color.b = texture(uScene, warped - caOffset).b;

  // Cursor block blink.
  if (uCursorCell.x >= 0.0) {
    vec2 cellUv = floor(warped / uCellSize);
    if (cellUv.x == uCursorCell.x && cellUv.y == uCursorCell.y &&
        fract(uTime * 1.2) < 0.55) {
      color = mix(color, uPhosphor, 0.85);
    }
  }

  // Bloom (quarter-res blurred bright pass), tinted by phosphor.
  vec3 bloom = texture(uBloom, warped).rgb;
  color += bloom * uGlow * mix(vec3(1.0), uPhosphor, 0.5);

  // Scanlines, locked to character rows (2 lines per row reads best).
  float scan = 1.0 - uScanline * 0.45 *
    (0.5 + 0.5 * sin(warped.y * uRows * 6.28318 * 2.0));
  color *= scan;

  // Static noise.
  float grain = hash(warped * uResolution + fract(uTime) * 100.0) - 0.5;
  color += grain * uNoise * 0.06;

  // Vignette / overscan shading.
  float dist = length(uv - 0.5) * 1.414;
  color *= 1.0 - uVignette * 0.6 * smoothstep(0.55, 1.05, dist);

  // Flicker: subtle whole-frame luminance wobble.
  color *= 1.0 - uFlicker * (0.02 * sin(uTime * 87.0) + 0.015 * (hash(vec2(floor(uTime * 60.0))) - 0.5));

  // Phosphor tint.
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(color, uPhosphor * luma * 1.15, uTint);

  fragColor = vec4(color, 1.0);
}
