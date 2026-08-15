import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PARAMS } from "./params";
import {
  createSettingsStore,
  parseSettings,
  resolveParams,
  type SettingsStorage,
} from "./settings-store";

function memoryStorage(initial: string | null = null): SettingsStorage & {
  value: string | null;
} {
  const box = {
    value: initial,
    get: () => box.value,
    set: (v: string) => {
      box.value = v;
    },
  };
  return box;
}

describe("parseSettings", () => {
  it("returns defaults for null, junk, and malformed JSON", () => {
    expect(parseSettings(null)).toEqual({ preset: "full", overrides: {} });
    expect(parseSettings("not json")).toEqual({ preset: "full", overrides: {} });
    expect(parseSettings('"str"')).toEqual({ preset: "full", overrides: {} });
  });

  it("drops unknown params and clamps values", () => {
    const parsed = parseSettings(
      JSON.stringify({ preset: "static", overrides: { curvature: 5, bogus: 1 } }),
    );
    expect(parsed.preset).toBe("static");
    expect(parsed.overrides).toEqual({ curvature: 1 });
  });
});

describe("resolveParams layering", () => {
  it("applies defaults ← theme ← preset ← overrides in order", () => {
    const resolved = resolveParams(
      { glow: 0.9, curvature: 0.5 },
      { preset: "static", overrides: { curvature: 0.1 } },
    );
    expect(resolved.glow).toBe(0.9); // theme wins over default
    expect(resolved.noise).toBe(0); // static preset silences noise
    expect(resolved.curvature).toBe(0.1); // user override wins over all
    expect(resolved.vignette).toBe(DEFAULT_PARAMS.vignette); // untouched default
  });

  it("off preset zeroes everything not overridden", () => {
    const resolved = resolveParams({ glow: 0.9 }, { preset: "off", overrides: {} });
    expect(resolved.glow).toBe(0);
    expect(resolved.scanline).toBe(0);
  });
});

describe("createSettingsStore", () => {
  it("persists changes and round-trips through storage", () => {
    const storage = memoryStorage();
    const store = createSettingsStore(storage);
    store.setParam("glow", 0.8);
    store.setPreset("static");
    const reloaded = createSettingsStore(memoryStorage(storage.value));
    expect(reloaded.get()).toEqual({ preset: "static", overrides: { glow: 0.8 } });
  });

  it("clamps setParam values", () => {
    const store = createSettingsStore(memoryStorage());
    store.setParam("noise", 42);
    expect(store.get().overrides.noise).toBe(1);
  });

  it("reset(param) removes one override; reset() removes all", () => {
    const store = createSettingsStore(memoryStorage());
    store.setParam("glow", 0.8);
    store.setParam("noise", 0.2);
    store.reset("glow");
    expect(store.get().overrides).toEqual({ noise: 0.2 });
    store.reset();
    expect(store.get().overrides).toEqual({});
  });

  it("notifies subscribers and honors unsubscribe", () => {
    const store = createSettingsStore(memoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setParam("glow", 0.5);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.setParam("glow", 0.6);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
