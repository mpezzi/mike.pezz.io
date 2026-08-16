import type { EffectsMode } from "~/shell/types";

export const EFFECTS_MODE_STORAGE_KEY = "pezz.effects";

export interface CapabilityProbe {
  webgl2: boolean;
  contextLossCount: number;
  /** Primary input is touch — the canvas tier is hostile to it. */
  coarsePointer: boolean;
}

export function isEffectsMode(value: string | null): value is EffectsMode {
  return value === "webgl" || value === "css" || value === "off";
}

/**
 * Fallback ladder:
 * 1. an explicit stored preference is honored (downgraded if impossible)
 * 2. webgl2 unavailable or repeatedly lost -> css
 * 3. touch devices default to css — the WebGL canvas has no native
 *    scrolling, selection, or sane tap targets; it stays opt-in there
 * 4. default -> webgl
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
  if (webglBroken || probe.coarsePointer) return "css";
  return "webgl";
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
