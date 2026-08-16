import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createSettingsStore,
  resolveParams,
  type CrtSettings,
  type CrtSettingsStore,
  CRT_STORAGE_KEY,
} from "~/effects/settings-store";
import type { EffectParams } from "~/effects/params";
import {
  EFFECTS_MODE_STORAGE_KEY,
  probeWebgl2,
  resolveEffectsMode,
} from "~/engine/effects-mode";
import type { EffectsMode } from "~/shell/types";
import { useTheme } from "~/themes/ThemeProvider";

interface EffectsContextValue {
  mode: EffectsMode;
  setMode: (mode: EffectsMode) => void;
  /** True when prefers-reduced-motion forces the static preset. */
  reducedMotion: boolean;
  settings: CrtSettings;
  store: CrtSettingsStore;
  /** Fully resolved params (theme defaults + preset + user overrides). */
  params: EffectParams;
  reportContextLoss: () => void;
}

const EffectsContext = createContext<EffectsContextValue | null>(null);

function initialMode(): EffectsMode {
  if (typeof window === "undefined") return "off";
  return resolveEffectsMode(window.localStorage.getItem(EFFECTS_MODE_STORAGE_KEY), {
    webgl2: probeWebgl2(),
    contextLossCount: 0,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
  });
}

export function EffectsProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  // "off" until mounted: the prerendered HTML must be the plain DOM UI.
  const [mode, setModeState] = useState<EffectsMode>("off");
  const [reducedMotion, setReducedMotion] = useState(false);
  const contextLosses = useRef(0);

  const store = useMemo(
    () =>
      createSettingsStore(
        typeof window === "undefined"
          ? undefined
          : {
              get: () => window.localStorage.getItem(CRT_STORAGE_KEY),
              set: (v) => window.localStorage.setItem(CRT_STORAGE_KEY, v),
            },
      ),
    [],
  );
  const [settings, setSettings] = useState<CrtSettings>(() => store.get());

  useEffect(() => store.subscribe(setSettings), [store]);

  useEffect(() => {
    // Prerendered HTML hydrates in "off" mode; the real capability-resolved
    // mode (and the reduced-motion media state) is external browser state we
    // sync exactly once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModeState(initialMode());
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    setReducedMotion(media.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setMode = useCallback((next: EffectsMode) => {
    setModeState(next);
    window.localStorage.setItem(EFFECTS_MODE_STORAGE_KEY, next);
  }, []);

  const reportContextLoss = useCallback(() => {
    contextLosses.current += 1;
    if (contextLosses.current >= 2) setModeState("css");
  }, []);

  const params = useMemo(() => {
    const resolved = resolveParams(theme.effectDefaults, settings);
    // Reduced motion silences the animated effects regardless of preset,
    // unless the user explicitly chose otherwise via overrides.
    if (reducedMotion) {
      return {
        ...resolved,
        noise: settings.overrides.noise ?? 0,
        flicker: settings.overrides.flicker ?? 0,
      };
    }
    return resolved;
  }, [theme, settings, reducedMotion]);

  // Mirror params into CSS custom properties for the css-effects tier.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--crt-scanline", String(params.scanline));
    root.style.setProperty("--crt-glow", String(params.glow));
    root.style.setProperty("--crt-vignette", String(params.vignette));
    root.style.setProperty("--crt-flicker", String(params.flicker));
    root.dataset.effects = mode;
  }, [params, mode]);

  const value = useMemo(
    () => ({ mode, setMode, reducedMotion, settings, store, params, reportContextLoss }),
    [mode, setMode, reducedMotion, settings, store, params, reportContextLoss],
  );

  return <EffectsContext.Provider value={value}>{children}</EffectsContext.Provider>;
}

export function useEffects(): EffectsContextValue {
  const ctx = useContext(EffectsContext);
  if (!ctx) throw new Error("useEffects must be used within EffectsProvider");
  return ctx;
}
