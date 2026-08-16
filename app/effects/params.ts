/**
 * CRT effect parameters. Every value is normalized to [0, 1].
 * This module is the single source of truth for the barrel-warp math:
 * the composite shader and the mouse hit-testing must stay in sync,
 * so both consume the functions/constants defined here.
 */

export interface EffectParams {
  curvature: number;
  aberration: number;
  glow: number;
  scanline: number;
  noise: number;
  vignette: number;
  flicker: number;
  tintAmount: number;
}

export type EffectParamName = keyof EffectParams;

export const EFFECT_PARAM_NAMES: readonly EffectParamName[] = [
  "curvature",
  "aberration",
  "glow",
  "scanline",
  "noise",
  "vignette",
  "flicker",
  "tintAmount",
];

export function isEffectParamName(name: string): name is EffectParamName {
  return (EFFECT_PARAM_NAMES as readonly string[]).includes(name);
}

export function clampParam(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export type EffectPresetName = "full" | "static" | "off";

/** Baseline params used when a theme provides no overrides. */
export const DEFAULT_PARAMS: EffectParams = {
  curvature: 0.35,
  aberration: 0.25,
  glow: 0.45,
  scanline: 0.4,
  noise: 0.25,
  vignette: 0.45,
  flicker: 0.2,
  tintAmount: 0.15,
};

/** Presets are overlays applied on top of theme defaults. */
export const PRESETS: Record<EffectPresetName, Partial<EffectParams>> = {
  full: {},
  // Static: everything time-driven is silenced; the tube look remains.
  static: { noise: 0, flicker: 0 },
  off: {
    curvature: 0,
    aberration: 0,
    glow: 0,
    scanline: 0,
    noise: 0,
    vignette: 0,
    flicker: 0,
    tintAmount: 0,
  },
};

/**
 * Barrel distortion. `uv` in [0,1]^2; curvature 0 = identity.
 * Mirrors composite.frag's barrelWarp — keep the formula identical.
 * Maximum bulge strength when curvature = 1.
 */
export const MAX_WARP = 0.18;

export function forwardWarp(x: number, y: number, curvature: number): [number, number] {
  const cx = x * 2 - 1;
  const cy = y * 2 - 1;
  const r2 = cx * cx + cy * cy;
  const k = curvature * MAX_WARP;
  const f = 1 + k * r2;
  return [(cx * f + 1) / 2, (cy * f + 1) / 2];
}

/**
 * Inverse of forwardWarp via Newton iteration (the warp is radial and
 * monotonic for k in range, so 3 iterations converge well below 1e-4).
 */
export function inverseWarp(x: number, y: number, curvature: number): [number, number] {
  const k = curvature * MAX_WARP;
  if (k === 0) return [x, y];
  const tx = x * 2 - 1;
  const ty = y * 2 - 1;
  const rTarget = Math.hypot(tx, ty);
  if (rTarget === 0) return [x, y];
  // Solve r * (1 + k r^2) = rTarget for r.
  let r = rTarget;
  for (let i = 0; i < 4; i++) {
    const f = r * (1 + k * r * r) - rTarget;
    const df = 1 + 3 * k * r * r;
    r -= f / df;
  }
  const scale = r / rTarget;
  return [(tx * scale + 1) / 2, (ty * scale + 1) / 2];
}
