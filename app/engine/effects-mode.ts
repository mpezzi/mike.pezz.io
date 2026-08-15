import type { EffectsMode } from "~/shell/types";

export const EFFECTS_MODE_STORAGE_KEY = "pezz.effects";

export interface CapabilityProbe {
  webgl2: boolean;
  contextLossCount: number;
}

export function isEffectsMode(value: string | null): value is EffectsMode {
  return value === "webgl" || value === "css" || value === "off";
}

/**
 * Fallback ladder:
 * 1. an explicit stored preference is honored (downgraded if impossible)
 * 2. webgl2 unavailable or repeatedly lost -> css
 * 3. default -> webgl
 */
export function resolveEffectsMode(
  stored: string | null,
  probe: CapabilityProbe,
): EffectsMode {
  const webglBroken = !probe.webgl2 || probe.contextLossCount >= 2;
  if (isEffectsMode(stored)) {
    if (stored === "webgl" && webglBroken) return "css";
    return stored;
  }
  return webglBroken ? "css" : "webgl";
}

export function probeWebgl2(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return canvas.getContext("webgl2") !== null;
  } catch {
    return false;
  }
}
