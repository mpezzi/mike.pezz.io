import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { CrtEngine, type EngineContent } from "~/engine/crt-engine";
import { getEntry } from "~/content/collections";
import { useEffects } from "~/hooks/useEffectsMode";
import { useShell } from "~/hooks/useShell";
import { blank, line, rule, text } from "~/screen/builders";
import { useCurrentModel } from "~/screen/context";
import { mdxToScreen } from "~/screen/mdx-to-screen";
import type { Action, ScreenNode } from "~/screen/model";
import { outputToScreen } from "~/screen/output-to-screen";
import { useTheme } from "~/themes/ThemeProvider";

function resolveArticles(nodes: ScreenNode[]): ScreenNode[] {
  return nodes.flatMap((node) => {
    if (node.kind === "article") {
      const entry = getEntry(node.collection, node.slug);
      return entry ? mdxToScreen(entry.raw) : [];
    }
    return [node];
  });
}

const NAV_LINKS: [string, string][] = [
  ["~", "/"],
  ["blog/", "/blog"],
  ["work/", "/work"],
  ["contact.txt", "/contact"],
  ["settings/", "/settings"],
];

export function CrtCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CrtEngine | null>(null);
  const { theme } = useTheme();
  const effects = useEffects();
  const shell = useShell();
  const model = useCurrentModel();
  const navigate = useNavigate();
  const location = useLocation();
  const [prompt, setPrompt] = useState({ value: "", caret: 0 });
  const [ready, setReady] = useState(false);

  // Mirror the real (visually hidden) prompt input.
  useEffect(() => {
    const input = document.getElementById("shell-input");
    if (!(input instanceof HTMLInputElement)) return;
    const sync = () =>
      setPrompt({ value: input.value, caret: input.selectionStart ?? input.value.length });
    sync();
    const events = ["input", "keyup", "click", "focus"] as const;
    for (const evt of events) input.addEventListener(evt, sync);
    const interval = window.setInterval(sync, 250); // catch programmatic changes
    return () => {
      for (const evt of events) input.removeEventListener(evt, sync);
      window.clearInterval(interval);
    };
  }, []);

  const content = useMemo((): EngineContent => {
    const header: ScreenNode[] = [
      line(
        text("mike@pezz.io — psh   ", { fg: "dim" }),
        ...NAV_LINKS.flatMap(([label, to], i): ScreenNode[] => [
          {
            kind: "link",
            text: label,
            id: `nav-${i}`,
            action: { navigate: to },
            ...(location.pathname === to ? { style: { fg: "accent" as const } } : {}),
          },
          text("  "),
        ]),
      ),
      rule(),
    ];
    const page = model ? resolveArticles(model.nodes) : [];
    const scrollback: ScreenNode[] = shell.lines.flatMap((entry) => [
      blank(),
      line(
        text(`mike@pezz.io:${entry.cwd}$ `, { fg: "accent" }),
        text(entry.input),
      ),
      ...outputToScreen(entry.output, `sb-${entry.id}`),
    ]);
    return {
      nodes: [...header, ...page, ...(scrollback.length > 0 ? [blank(), rule()] : []), ...scrollback],
      ps1: `mike@pezz.io:${shell.cwd}$`,
      promptValue: prompt.value,
      promptCaret: prompt.caret,
      statusLeft: `[theme: ${theme.id}]  [effects: webgl]`,
      statusRight: "help · tab completes · effects off for selectable text",
    };
  }, [model, shell.lines, shell.cwd, prompt, theme.id, location.pathname]);

  // Engine lifecycle.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: CrtEngine | null = null;
    let cancelled = false;

    const boot = async () => {
      try {
        await document.fonts.load('15px "JetBrains Mono"');
        await document.fonts.ready;
      } catch {
        // fall back to system monospace metrics
      }
      if (cancelled) return;
      try {
        engine = new CrtEngine(canvas, theme, effects.params, {
          onAction: () => undefined,
          onContextLoss: () => effects.reportContextLoss(),
        });
        engineRef.current = engine;
        setReady(true);
      } catch {
        effects.setMode("css");
      }
    };
    void boot();

    return () => {
      cancelled = true;
      engineRef.current = null;
      engine?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) engineRef.current?.setTheme(theme);
  }, [theme, ready]);

  useEffect(() => {
    if (ready) engineRef.current?.setParams(effects.params);
  }, [effects.params, ready]);

  useEffect(() => {
    if (ready) engineRef.current?.setContent(content);
  }, [content, ready]);

  useEffect(() => {
    if (ready) engineRef.current?.setAnimated(!effects.reducedMotion);
  }, [effects.reducedMotion, ready]);

  // Window events.
  useEffect(() => {
    if (!ready) return;
    const onResize = () => engineRef.current?.resize();
    const onVisibility = () =>
      engineRef.current?.setVisible(document.visibilityState === "visible");
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready]);

  function dispatch(action: Action | undefined) {
    if (!action) return;
    if ("navigate" in action) void navigate(action.navigate);
    else if ("href" in action) window.open(action.href, "_blank", "noopener,noreferrer");
    else shell.run(action.run);
  }

  return (
    <canvas
      ref={canvasRef}
      className="crt-canvas"
      aria-hidden="true"
      onWheel={(e) => engineRef.current?.scrollBy(Math.sign(e.deltaY) * 3)}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        dispatch(
          engineRef.current?.actionAt(e.clientX - rect.left, e.clientY - rect.top),
        );
        document.getElementById("shell-input")?.focus();
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const action = engineRef.current?.actionAt(
          e.clientX - rect.left,
          e.clientY - rect.top,
        );
        e.currentTarget.style.cursor = action ? "pointer" : "default";
      }}
    />
  );
}
