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
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  getTheme,
  isThemeId,
  THEME_STORAGE_KEY,
  THEMES,
  toggledTheme,
} from "./themes";
import type { TerminalTheme, ThemeId } from "./types";

interface ThemeContextValue {
  theme: TerminalTheme;
  setTheme: (id: ThemeId) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function initialThemeId(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_DARK_THEME;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored !== null && isThemeId(stored)) return stored;
  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return DEFAULT_LIGHT_THEME;
  }
  return DEFAULT_DARK_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(initialThemeId);
  const theme = getTheme(themeId);

  useEffect(() => {
    applyThemeCssVars(theme, document.documentElement);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => setThemeId(id), []);
  const toggleMode = useCallback(() => {
    setThemeId((current) => toggledTheme(getTheme(current)).id);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleMode }),
    [theme, setTheme, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/**
 * Inline no-flash script for <head>: applies the stored (or system) theme's
 * background/foreground before first paint. The full palette is applied by
 * ThemeProvider on mount.
 */
export function themeNoFlashScript(): string {
  const minimal = Object.fromEntries(
    THEMES.map((t) => [
      t.id,
      [t.colors.background, t.colors.foreground, t.mode] as const,
    ]),
  );
  return (
    "(function(){try{" +
    `var m=${JSON.stringify(minimal)};` +
    `var k=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});` +
    `var d=k&&m[k]?k:(matchMedia("(prefers-color-scheme: light)").matches?${JSON.stringify(DEFAULT_LIGHT_THEME)}:${JSON.stringify(DEFAULT_DARK_THEME)});` +
    "var t=m[d];var r=document.documentElement;" +
    'r.dataset.theme=d;r.style.setProperty("--term-bg",t[0]);' +
    'r.style.setProperty("--term-fg",t[1]);r.style.colorScheme=t[2];' +
    "}catch(e){}})();"
  );
}
