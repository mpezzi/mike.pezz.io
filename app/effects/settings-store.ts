import {
  clampParam,
  DEFAULT_PARAMS,
  PRESETS,
  type EffectParamName,
  type EffectParams,
  type EffectPresetName,
} from "./params";

export const CRT_STORAGE_KEY = "pezz.crt";

export interface CrtSettings {
  preset: EffectPresetName;
  overrides: Partial<EffectParams>;
}

export interface SettingsStorage {
  get(): string | null;
  set(value: string): void;
}

const EMPTY: CrtSettings = { preset: "full", overrides: {} };

export function parseSettings(json: string | null): CrtSettings {
  if (!json) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return EMPTY;
    const candidate = parsed as Partial<CrtSettings>;
    const preset: EffectPresetName =
      candidate.preset === "static" || candidate.preset === "off"
        ? candidate.preset
        : "full";
    const overrides: Partial<EffectParams> = {};
    if (typeof candidate.overrides === "object" && candidate.overrides !== null) {
      for (const [key, value] of Object.entries(candidate.overrides)) {
        if (key in DEFAULT_PARAMS && typeof value === "number") {
          overrides[key as EffectParamName] = clampParam(value);
        }
      }
    }
    return { preset, overrides };
  } catch {
    return EMPTY;
  }
}

/**
 * Resolution order: baseline defaults ← theme overrides ← preset ← user overrides.
 */
export function resolveParams(
  themeDefaults: Partial<EffectParams> | undefined,
  settings: CrtSettings,
): EffectParams {
  return {
    ...DEFAULT_PARAMS,
    ...themeDefaults,
    ...PRESETS[settings.preset],
    ...settings.overrides,
  };
}

export type SettingsListener = (settings: CrtSettings) => void;

export interface CrtSettingsStore {
  get(): CrtSettings;
  setParam(param: EffectParamName, value: number): void;
  reset(param?: EffectParamName): void;
  setPreset(preset: EffectPresetName): void;
  subscribe(listener: SettingsListener): () => void;
}

export function createSettingsStore(storage?: SettingsStorage): CrtSettingsStore {
  let settings = parseSettings(storage?.get() ?? null);
  const listeners = new Set<SettingsListener>();

  function commit(next: CrtSettings) {
    settings = next;
    storage?.set(JSON.stringify(next));
    for (const listener of listeners) listener(next);
  }

  return {
    get: () => settings,
    setParam(param, value) {
      commit({
        ...settings,
        overrides: { ...settings.overrides, [param]: clampParam(value) },
      });
    },
    reset(param) {
      if (param === undefined) {
        commit({ ...settings, overrides: {} });
      } else {
        const { [param]: _removed, ...rest } = settings.overrides;
        commit({ ...settings, overrides: rest });
      }
    },
    setPreset(preset) {
      commit({ ...settings, preset });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
