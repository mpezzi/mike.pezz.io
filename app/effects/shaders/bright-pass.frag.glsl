#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform float uThreshold;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec3 color = texture(uScene, vUv).rgb;
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float mask = smoothstep(uThreshold, uThreshold + 0.2, luma);
  fragColor = vec4(color * mask, 1.0);
}
