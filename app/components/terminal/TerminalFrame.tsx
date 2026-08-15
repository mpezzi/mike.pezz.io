import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router";
import { useEffects } from "~/hooks/useEffectsMode";
import { useShell } from "~/hooks/useShell";
import { useTheme } from "~/themes/ThemeProvider";
import { CrtCanvas } from "./CrtCanvas";
import { OutputBlocks } from "./OutputBlocks";
import { Prompt, type PromptHandle } from "./Prompt";

const NAV = [
  { to: "/", label: "~" },
  { to: "/blog", label: "blog/" },
  { to: "/work", label: "work/" },
  { to: "/contact", label: "contact.txt" },
  { to: "/settings", label: "settings/" },
];

export function TerminalFrame({ children }: { children: React.ReactNode }) {
  const shell = useShell();
  const { theme, toggleMode } = useTheme();
  const effects = useEffects();
  const promptRef = useRef<PromptHandle>(null);
  const mainRef = useRef<HTMLElement>(null);
  const scrollbackRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // "Type anywhere" — printable keys focus the prompt.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (e.key.length === 1 || e.key === "Backspace") {
        promptRef.current?.focus();
        if (e.key.length === 1) {
          promptRef.current?.insert(e.key);
          e.preventDefault();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // After navigation, move focus to the content region for screen readers.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  // Keep scrollback pinned to the latest output.
  useEffect(() => {
    const el = scrollbackRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shell.lines]);

  const inCanvasMode = effects.mode === "webgl";

  return (
    <>
      {inCanvasMode && <CrtCanvas />}
      <div className={inCanvasMode ? "term-frame term-sr-layer" : "term-frame"}>
        <header className="term-titlebar">
          <span>mike@pezz.io — psh</span>
          <nav aria-label="site">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main ref={mainRef} className="term-main term-screen" tabIndex={-1}>
          {children}
        </main>

        <div
          ref={scrollbackRef}
          className="term-scrollback"
          aria-live="polite"
          aria-label="command output"
        >
          {shell.lines.map((entry) => (
            <div key={entry.id}>
              <div>
                <span className="term-prompt-ps1">
                  mike@pezz.io:{entry.cwd}${" "}
                </span>
                {entry.input}
              </div>
              <OutputBlocks blocks={entry.output} />
            </div>
          ))}
        </div>

        <Prompt ref={promptRef} />

        <footer className="term-statusbar">
          <span>
            <button type="button" onClick={toggleMode}>
              [theme: {theme.id}]
            </button>{" "}
            <button
              type="button"
              onClick={() =>
                effects.setMode(
                  effects.mode === "webgl" ? "off" : effects.mode === "off" ? "css" : "webgl",
                )
              }
            >
              [effects: {effects.mode}]
            </button>
          </span>
          <span>help · man psh · tab completes</span>
        </footer>
      </div>
    </>
  );
}
