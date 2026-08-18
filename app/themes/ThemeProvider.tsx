import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyThemeCssVars } from "./css";
import {
  DEFAULT_THEME_PREFERENCE,
  getTheme,
  isThemePreference,
  resolveThemePreference,
  THEME_STORAGE_KEY,
  THEMES,
  toggledTheme,
  type ThemePreference,
} from "./themes";
import type { TerminalTheme, ThemeId } from "./types";

interface ThemeContextValue {
  theme: TerminalTheme;
  /** "auto" (follow the system scheme) or the explicitly chosen id. */
  preference: ThemePreference;
  setTheme: (id: ThemeId) => void;
  setAuto: () => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LIGHT_QUERY = "(prefers-color-scheme: light)";

function initialPreference(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFERENCE;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored !== null && isThemePreference(stored)) return stored;
  return DEFAULT_THEME_PREFERENCE;
}

function initialPrefersLight(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(LIGHT_QUERY).matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const [prefersLight, setPrefersLight] = useState(initialPrefersLight);
  const theme = getTheme(resolveThemePreference(preference, prefersLight));

  // In auto mode the theme follows the system scheme live.
  useEffect(() => {
    const media = window.matchMedia(LIGHT_QUERY);
    const onChange = (e: MediaQueryListEvent) => setPrefersLight(e.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    applyThemeCssVars(theme, document.documentElement);
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  }, [theme, preference]);

  const setTheme = useCallback((id: ThemeId) => setPreference(id), []);
  const setAuto = useCallback(() => setPreference("auto"), []);
  // Toggling picks a concrete theme (an explicit choice), based on
  // whatever is currently resolved.
  const toggleMode = useCallback(() => {
    setPreference(
      (current) =>
        toggledTheme(getTheme(resolveThemePreference(current, prefersLight))).id,
    );
  }, [prefersLight]);

  const value = useMemo(
    () => ({ theme, preference, setTheme, setAuto, toggleMode }),
    [theme, preference, setTheme, setAuto, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/**
 * Inline no-flash script for <head>: applies the stored theme's (stored
 * "auto" resolves via the system scheme; nothing stored means the default
 * preference) background/foreground before first paint. The full palette
 * is applied by ThemeProvider on mount.
 */
export function themeNoFlashScript(): string {
  const minimal = Object.fromEntries(
    THEMES.map((t) => [
      t.id,
      [t.colors.background, t.colors.foreground, t.mode] as const,
    ]),
  );
  const autoDark = JSON.stringify(resolveThemePreference("auto", false));
  const autoLight = JSON.stringify(resolveThemePreference("auto", true));
  const fallback = JSON.stringify(DEFAULT_THEME_PREFERENCE);
  return (
    "(function(){try{" +
    `var m=${JSON.stringify(minimal)};` +
    `var k=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});` +
    `var p=k&&m[k]?k:(k==="auto"?"auto":${fallback});` +
    `var d=p==="auto"?(matchMedia(${JSON.stringify(LIGHT_QUERY)}).matches?${autoLight}:${autoDark}):p;` +
    "var t=m[d];var r=document.documentElement;" +
    'r.dataset.theme=d;r.style.setProperty("--term-bg",t[0]);' +
    'r.style.setProperty("--term-fg",t[1]);r.style.colorScheme=t[2];' +
    "}catch(e){}})();"
  );
}
