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
import { useLocation, useNavigate } from "react-router";
import { blogEntries, workEntries } from "~/content/collections";
import { buildSiteVfs } from "~/content/site-vfs";
import { complete as completeInput } from "~/shell/completion";
import { execute } from "~/shell/execute";
import { History } from "~/shell/history";
import { createRegistry } from "~/shell/registry";
import type { OutputBlock, ShellEffect, ShellEnv } from "~/shell/types";
import { useTheme } from "~/themes/ThemeProvider";
import { useEffects } from "./useEffectsMode";

export interface ScrollbackLine {
  id: number;
  cwd: string;
  input: string;
  output: OutputBlock[];
}

interface ShellContextValue {
  cwd: string;
  lines: ScrollbackLine[];
  run: (input: string) => void;
  complete: (input: string) => { replacement?: string; candidates: string[] };
  historyPrev: (current: string) => string | null;
  historyNext: () => string | null;
  historyReset: () => void;
  clear: () => void;
  sessionStartMs: number;
}

const ShellContext = createContext<ShellContextValue | null>(null);

const HISTORY_KEY = "pezz.history";

function historyStorage() {
  if (typeof window === "undefined") return undefined;
  return {
    get(): string[] {
      try {
        const raw = window.sessionStorage.getItem(HISTORY_KEY);
        const parsed: unknown = raw === null ? [] : JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((e) => typeof e === "string") : [];
      } catch {
        return [];
      }
    },
    set(entries: string[]) {
      window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    },
  };
}

export function ShellProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, preference, setTheme, setAuto, toggleMode } = useTheme();
  const effects = useEffects();

  const vfs = useMemo(() => buildSiteVfs(blogEntries, workEntries), []);
  const registry = useMemo(() => createRegistry(), []);
  const history = useMemo(() => new History(historyStorage()), []);
  // Session start is captured once on mount by design (uptime origin).
  // eslint-disable-next-line react-hooks/purity
  const sessionStartMs = useMemo(() => Date.now(), []);

  const [cwd, setCwd] = useState("~");
  const [lines, setLines] = useState<ScrollbackLine[]>([]);
  const nextId = useRef(1);

  // The URL is the source of truth for cwd: menu clicks and back/forward
  // move the shell too.
  useEffect(() => {
    const path = vfs.pathForUrl(location.pathname);
    if (path !== undefined) {
      const node = vfs.resolve("~", path);
      setCwd(node?.kind === "dir" ? path : path.split("/").slice(0, -1).join("/") || "~");
    }
  }, [location.pathname, vfs]);

  const buildEnv = useCallback(
    (): ShellEnv => ({
      cwd,
      user: "mike",
      host: "pezz.io",
      columns: 80,
      themeId: theme.id,
      themeAuto: preference === "auto",
      effectsMode: effects.mode,
      crt: {
        resolved: effects.params,
        overrides: effects.settings.overrides,
        preset: effects.settings.preset,
      },
      uptimeMs: Date.now() - sessionStartMs,
    }),
    [
      cwd,
      theme.id,
      preference,
      effects.mode,
      effects.params,
      effects.settings,
      sessionStartMs,
    ],
  );

  const applyEffects = useCallback(
    (shellEffects: ShellEffect[]) => {
      for (const effect of shellEffects) {
        switch (effect.type) {
          case "navigate":
            void navigate(effect.to);
            break;
          case "setTheme":
            setTheme(effect.themeId);
            break;
          case "setThemeAuto":
            setAuto();
            break;
          case "toggleThemeMode":
            toggleMode();
            break;
          case "clear":
            setLines([]);
            break;
          case "openExternal":
            window.open(effect.url, "_blank", "noopener,noreferrer");
            break;
          case "setEffectsMode":
            effects.setMode(effect.mode);
            break;
          case "setCrtParam":
            effects.store.setParam(effect.param, effect.value);
            break;
          case "resetCrt":
            effects.store.reset(effect.param);
            break;
          case "setCrtPreset":
            effects.store.setPreset(effect.preset);
            break;
        }
      }
    },
    [navigate, setTheme, setAuto, toggleMode, effects],
  );

  const run = useCallback(
    (input: string) => {
      const env = buildEnv();
      const result = execute(input, vfs, env, registry);
      history.push(input);
      const cleared = result.effects?.some((e) => e.type === "clear") ?? false;
      if (!cleared) {
        setLines((prev) => [
          ...prev.slice(-100),
          { id: nextId.current++, cwd: env.cwd, input, output: result.output },
        ]);
      }
      if (result.env?.cwd !== undefined) setCwd(result.env.cwd);
      if (result.effects) applyEffects(result.effects);
    },
    [buildEnv, vfs, registry, history, applyEffects],
  );

  const complete = useCallback(
    (input: string) => completeInput(input, vfs, buildEnv(), registry),
    [vfs, buildEnv, registry],
  );

  const value = useMemo(
    () => ({
      cwd,
      lines,
      run,
      complete,
      historyPrev: (current: string) => history.prev(current),
      historyNext: () => history.next(),
      historyReset: () => history.reset(),
      clear: () => setLines([]),
      sessionStartMs,
    }),
    [cwd, lines, run, complete, history, sessionStartMs],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}
