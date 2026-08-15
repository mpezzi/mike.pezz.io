#version 300 es
precision highp float;

uniform sampler2D uSource;
uniform vec2 uDirection; // (1/width, 0) or (0, 1/height)

in vec2 vUv;
out vec4 fragColor;

void main() {
  // 9-tap separable gaussian.
  float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
  vec3 sum = texture(uSource, vUv).rgb * weights[0];
  for (int i = 1; i < 5; i++) {
    vec2 offset = uDirection * float(i) * 1.5;
    sum += texture(uSource, vUv + offset).rgb * weights[i];
    sum += texture(uSource, vUv - offset).rgb * weights[i];
  }
  fragColor = vec4(sum, 1.0);
}
