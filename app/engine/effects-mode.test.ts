import { describe, expect, it } from "vitest";
import { isEffectsMode, resolveEffectsMode } from "./effects-mode";

describe("isEffectsMode", () => {
  it("accepts the three modes and nothing else", () => {
    expect(isEffectsMode("webgl")).toBe(true);
    expect(isEffectsMode("css")).toBe(true);
    expect(isEffectsMode("off")).toBe(true);
    expect(isEffectsMode("crt")).toBe(false);
    expect(isEffectsMode(null)).toBe(false);
  });
});

describe("resolveEffectsMode ladder", () => {
  const capable = { webgl2: true, contextLossCount: 0 };
  const broken = { webgl2: false, contextLossCount: 0 };
  const flaky = { webgl2: true, contextLossCount: 2 };

  it("defaults to webgl when capable", () => {
    expect(resolveEffectsMode(null, capable)).toBe("webgl");
  });

  it("honors an explicit stored preference", () => {
    expect(resolveEffectsMode("off", capable)).toBe("off");
    expect(resolveEffectsMode("css", capable)).toBe("css");
  });

  it("downgrades stored webgl when the context is unavailable or flaky", () => {
    expect(resolveEffectsMode("webgl", broken)).toBe("css");
    expect(resolveEffectsMode("webgl", flaky)).toBe("css");
    expect(resolveEffectsMode("webgl", capable)).toBe("webgl");
  });

  it("falls back to css without webgl2", () => {
    expect(resolveEffectsMode(null, broken)).toBe("css");
    expect(resolveEffectsMode("garbage", broken)).toBe("css");
  });

  it("never upgrades an explicit off", () => {
    expect(resolveEffectsMode("off", broken)).toBe("off");
  });
});
