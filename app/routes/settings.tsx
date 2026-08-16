import { useEffect, useMemo, useRef, useState } from "react";
import { EFFECT_PARAM_NAMES, type EffectPresetName } from "~/effects/params";
import { useEffects } from "~/hooks/useEffectsMode";
import { buildMeta } from "~/lib/seo";
import { blank, heading, line, text } from "~/screen/builders";
import { useRegisterModel } from "~/screen/context";
import type { ScreenModel } from "~/screen/model";
import type { EffectsMode } from "~/shell/types";
import { THEMES } from "~/themes/themes";
import { useTheme } from "~/themes/ThemeProvider";

export function meta() {
  return buildMeta({
    title: "settings",
    description: "Tune the CRT effects and pick a terminal theme.",
    path: "/settings",
  });
}

const MODES: EffectsMode[] = ["webgl", "css", "off"];
const PRESETS: EffectPresetName[] = ["full", "static", "off"];
const KEYS_HINT = "↑/↓ or k/j select · ←/→ or h/l adjust (shift = bigger steps)";

function bar(value: number, width = 10): string {
  const filled = Math.round(value * width);
  return `[${"■".repeat(filled)}${"□".repeat(width - filled)}]`;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const effects = useEffects();
  const [selected, setSelected] = useState(0);
  const sliderRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Vim-style keyboard control: j/k (or ↑/↓) move between parameter rows,
  // h/l (or ←/→) adjust the selected one. Registered in the capture phase
  // so it wins over the global "type anywhere → focus prompt" handler; it
  // steps aside whenever focus is in a text field (the shell prompt).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        (target instanceof HTMLInputElement && target.type === "text") ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      const step = e.shiftKey ? 0.1 : 0.05;
      switch (e.key) {
        case "j":
        case "J":
        case "ArrowDown": {
          const next = Math.min(selected + 1, EFFECT_PARAM_NAMES.length - 1);
          setSelected(next);
          sliderRefs.current[next]?.focus();
          break;
        }
        case "k":
        case "K":
        case "ArrowUp": {
          const prev = Math.max(selected - 1, 0);
          setSelected(prev);
          sliderRefs.current[prev]?.focus();
          break;
        }
        case "h":
        case "H":
        case "ArrowLeft": {
          const name = EFFECT_PARAM_NAMES[selected];
          if (name) effects.store.setParam(name, effects.params[name] - step);
          break;
        }
        case "l":
        case "L":
        case "ArrowRight": {
          const name = EFFECT_PARAM_NAMES[selected];
          if (name) effects.store.setParam(name, effects.params[name] + step);
          break;
        }
        default:
          return;
      }
      e.preventDefault();
      e.stopPropagation();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [selected, effects.store, effects.params]);

  // Static representation for the CRT canvas renderer, mirroring the
  // selected row so keyboard adjustment is visible in webgl mode too.
  const model = useMemo((): ScreenModel => {
    return {
      title: "settings",
      nodes: [
        heading(1, "~/settings"),
        blank(),
        ...EFFECT_PARAM_NAMES.map((name, i) =>
          line(
            text(i === selected ? "▸ " : "  ", { fg: "accent" }),
            text(name.padEnd(12), i === selected ? { fg: "accent", bold: true } : {}),
            text(` ${bar(effects.params[name])} `, { fg: "dim" }),
            text(effects.params[name].toFixed(2)),
            text(
              effects.settings.overrides[name] !== undefined ? "  (custom)" : "",
              { fg: "dim" },
            ),
          ),
        ),
        blank(),
        line(text(KEYS_HINT, { fg: "dim" })),
        line(
          text("also: ", { fg: "dim" }),
          text("crt set <param> <0-1>", { fg: "accent" }),
          text(" from the prompt", { fg: "dim" }),
        ),
      ],
    };
  }, [effects.params, effects.settings.overrides, selected]);
  useRegisterModel(model);

  return (
    <div>
      <h1>~/settings</h1>

      <h2>crt effects</h2>
      <p className="term-dim">
        Each parameter is 0–1 and persists in this browser. The same values drive the
        WebGL shader and the CSS fallback. Also available as the <code>crt</code>{" "}
        command.
      </p>
      <p className="term-dim">{KEYS_HINT}</p>
      {EFFECT_PARAM_NAMES.map((name, i) => (
        <div key={name} className="term-settings-row" data-selected={i === selected}>
          <label htmlFor={`crt-${name}`}>
            {i === selected ? "▸ " : "  "}
            {name}
            {effects.settings.overrides[name] !== undefined && (
              <span className="term-accent">*</span>
            )}
          </label>
          <input
            id={`crt-${name}`}
            ref={(el) => {
              sliderRefs.current[i] = el;
            }}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={effects.params[name]}
            onFocus={() => setSelected(i)}
            onChange={(e) => effects.store.setParam(name, Number(e.target.value))}
          />
          <span className="term-settings-value">{effects.params[name].toFixed(2)}</span>
        </div>
      ))}
      <p>
        <button type="button" className="term-button" onClick={() => effects.store.reset()}>
          reset all
        </button>
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="term-button"
            data-active={effects.settings.preset === preset}
            onClick={() => effects.store.setPreset(preset)}
          >
            preset: {preset}
          </button>
        ))}
      </p>

      <h2>rendering mode</h2>
      <p>
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            className="term-button"
            data-active={effects.mode === mode}
            onClick={() => effects.setMode(mode)}
          >
            {mode}
          </button>
        ))}
      </p>
      <p className="term-dim">
        webgl = full CRT shader · css = lightweight scanlines · off = plain selectable
        text. Reduced-motion preferences automatically silence noise and flicker.
      </p>

      <h2>theme</h2>
      <p>
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className="term-button"
            data-active={theme.id === t.id}
            onClick={() => setTheme(t.id)}
            style={{ marginBottom: "0.5rem" }}
          >
            {t.id}
          </button>
        ))}
      </p>
    </div>
  );
}
