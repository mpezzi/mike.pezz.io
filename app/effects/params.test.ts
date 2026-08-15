import { describe, expect, it } from "vitest";
import {
  clampParam,
  DEFAULT_PARAMS,
  EFFECT_PARAM_NAMES,
  forwardWarp,
  inverseWarp,
  isEffectParamName,
  PRESETS,
} from "./params";

describe("clampParam", () => {
  it("clamps to [0, 1]", () => {
    expect(clampParam(-1)).toBe(0);
    expect(clampParam(0.5)).toBe(0.5);
    expect(clampParam(2)).toBe(1);
    expect(clampParam(Number.NaN)).toBe(0);
  });
});

describe("param names", () => {
  it("every default param is a known name", () => {
    for (const name of Object.keys(DEFAULT_PARAMS)) {
      expect(isEffectParamName(name)).toBe(true);
      expect(EFFECT_PARAM_NAMES).toContain(name);
    }
  });

  it("rejects unknown names", () => {
    expect(isEffectParamName("sharpness")).toBe(false);
  });
});

describe("presets", () => {
  it("off zeroes every parameter", () => {
    for (const name of EFFECT_PARAM_NAMES) {
      expect(PRESETS.off[name]).toBe(0);
    }
  });

  it("static silences only time-driven effects", () => {
    expect(PRESETS.static).toEqual({ noise: 0, flicker: 0 });
  });
});

describe("barrel warp", () => {
  it("is the identity at zero curvature", () => {
    const [x, y] = forwardWarp(0.3, 0.8, 0);
    expect(x).toBeCloseTo(0.3, 10);
    expect(y).toBeCloseTo(0.8, 10);
  });

  it("inverseWarp(forwardWarp(p)) ≈ p across the screen and curvature range", () => {
    for (let curvature = 0; curvature <= 1; curvature += 0.25) {
      for (let i = 0; i < 200; i++) {
        // Deterministic pseudo-random points.
        const x = (i * 0.617) % 1;
        const y = (i * 0.239) % 1;
        const [wx, wy] = forwardWarp(x, y, curvature);
        const [ix, iy] = inverseWarp(wx, wy, curvature);
        expect(ix).toBeCloseTo(x, 4);
        expect(iy).toBeCloseTo(y, 4);
      }
    }
  });

  it("pushes edge points outward (barrel)", () => {
    const [x] = forwardWarp(1, 0.5, 1);
    expect(x).toBeGreaterThan(1);
    const [cx] = forwardWarp(0.5, 0.5, 1);
    expect(cx).toBeCloseTo(0.5, 10);
  });
});
