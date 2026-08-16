import { useEffect, useMemo, useRef, useState } from "react";
import { EFFECT_PARAM_NAMES, type EffectParamName } from "~/effects/params";
import type { EffectPresetName } from "~/effects/params";
import { useEffects } from "~/hooks/useEffectsMode";
import { buildMeta } from "~/lib/seo";
import { blank, heading, line, text } from "~/screen/builders";
import { useRegisterModel } from "~/screen/context";
import type { ScreenModel, ScreenNode } from "~/screen/model";
import type { EffectsMode } from "~/shell/types";
import { THEMES } from "~/themes/themes";
import type { ThemeId } from "~/themes/types";
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
const KEYS_HINT =
  "↑/↓ or k/j select · ←/→ or h/l adjust · enter picks a theme (shift = bigger steps)";

/** One keyboard-navigable row on this page, in visual order. */
type SettingsRow =
  | { kind: "param"; name: EffectParamName }
  | { kind: "mode" }
  | { kind: "theme"; id: ThemeId | "auto" };

const ROWS: SettingsRow[] = [
  ...EFFECT_PARAM_NAMES.map((name): SettingsRow => ({ kind: "param", name })),
  { kind: "mode" },
  { kind: "theme", id: "auto" },
  ...THEMES.map((t): SettingsRow => ({ kind: "theme", id: t.id })),
];

function bar(value: number, width = 10): string {
  const filled = Math.round(value * width);
  return `[${"■".repeat(filled)}${"□".repeat(width - filled)}]`;
}

export default function Settings() {
  const { theme, preference, setTheme, setAuto } = useTheme();
  const effects = useEffects();
  const [selected, setSelected] = useState(0);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);

  // Vim-style keyboard control: j/k (or ↑/↓) move through every row on the
  // page — CRT parameters, the rendering mode, then the theme menu. h/l
  // (or ←/→) adjust a parameter or cycle the mode; Enter activates the
  // focused row's control natively (that's how a theme is picked).
  // Registered in the capture phase so it wins over the global "type
  // anywhere → focus prompt" handler; it steps aside whenever focus is in
  // a text field (the shell prompt).
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
      const row = ROWS[selected];
      const step = e.shiftKey ? 0.1 : 0.05;
      switch (e.key) {
        case "j":
        case "J":
        case "ArrowDown": {
          const next = Math.min(selected + 1, ROWS.length - 1);
          setSelected(next);
          rowRefs.current[next]?.focus();
          break;
        }
        case "k":
        case "K":
        case "ArrowUp": {
          const prev = Math.max(selected - 1, 0);
          setSelected(prev);
          rowRefs.current[prev]?.focus();
          break;
        }
        case "h":
        case "H":
        case "ArrowLeft": {
          if (row?.kind === "param") {
            effects.store.setParam(row.name, effects.params[row.name] - step);
          } else if (row?.kind === "mode") {
            const i = MODES.indexOf(effects.mode);
            effects.setMode(MODES[(i - 1 + MODES.length) % MODES.length] ?? "webgl");
          }
          break;
        }
        case "l":
        case "L":
        case "ArrowRight": {
          if (row?.kind === "param") {
            effects.store.setParam(row.name, effects.params[row.name] + step);
          } else if (row?.kind === "mode") {
            const i = MODES.indexOf(effects.mode);
            effects.setMode(MODES[(i + 1) % MODES.length] ?? "webgl");
          }
          break;
        }
        default:
          // Enter/Space fall through to the focused button's native click.
          return;
      }
      e.preventDefault();
      e.stopPropagation();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [selected, effects]);

  // Static representation for the CRT canvas renderer, mirroring the
  // selected row so keyboard control is visible in webgl mode too.
  const model = useMemo((): ScreenModel => {
    const marker = (i: number) => text(i === selected ? "▸ " : "  ", { fg: "accent" });
    const paramNodes = EFFECT_PARAM_NAMES.map((name, i): ScreenNode =>
      line(
        marker(i),
        text(name.padEnd(12), i === selected ? { fg: "accent", bold: true } : {}),
        text(` ${bar(effects.params[name])} `, { fg: "dim" }),
        text(effects.params[name].toFixed(2)),
        text(effects.settings.overrides[name] !== undefined ? "  (custom)" : "", {
          fg: "dim",
        }),
      ),
    );
    const modeIndex = EFFECT_PARAM_NAMES.length;
    const modeNode = line(
      marker(modeIndex),
      text("mode".padEnd(12), modeIndex === selected ? { fg: "accent", bold: true } : {}),
      ...MODES.flatMap((mode) => [
        text(mode === effects.mode ? `[${mode}]` : ` ${mode} `, {
          fg: mode === effects.mode ? "accent" : "dim",
        }),
        text(" "),
      ]),
    );
    const autoRowIndex = modeIndex + 1;
    const autoNode = line(
      marker(autoRowIndex),
      text(preference === "auto" ? "* " : "  ", { fg: "accent" }),
      text(
        "auto".padEnd(18),
        autoRowIndex === selected ? { fg: "accent", bold: true } : {},
      ),
      text(
        ` follow system light/dark${preference === "auto" ? ` (now: ${theme.id})` : ""}`,
        { fg: "dim" },
      ),
    );
    const themeNodes = THEMES.map((t, i): ScreenNode => {
      const rowIndex = autoRowIndex + 1 + i;
      return line(
        marker(rowIndex),
        text(preference === t.id ? "* " : "  ", { fg: "accent" }),
        text(t.id.padEnd(18), rowIndex === selected ? { fg: "accent", bold: true } : {}),
        text(` ${t.mode}  ${t.label}`, { fg: "dim" }),
      );
    });
    return {
      title: "settings",
      nodes: [
        heading(1, "~/settings"),
        blank(),
        heading(2, "crt effects"),
        ...paramNodes,
        blank(),
        heading(2, "rendering mode"),
        modeNode,
        blank(),
        heading(2, "theme"),
        autoNode,
        ...themeNodes,
        blank(),
        line(text(KEYS_HINT, { fg: "dim" })),
        line(
          text("also: ", { fg: "dim" }),
          text("crt set <param> <0-1>", { fg: "accent" }),
          text(" and ", { fg: "dim" }),
          text("theme <id>", { fg: "accent" }),
          text(" from the prompt", { fg: "dim" }),
        ),
      ],
    };
  }, [
    effects.params,
    effects.settings.overrides,
    effects.mode,
    theme.id,
    preference,
    selected,
  ]);
  useRegisterModel(model);

  const modeRowIndex = EFFECT_PARAM_NAMES.length;
  const autoRow = modeRowIndex + 1;
  const themeRowIndex = (id: ThemeId) =>
    autoRow + 1 + THEMES.findIndex((t) => t.id === id);

  return (
    <div>
      <h1>~/settings</h1>

      <h2>crt effects</h2>
      <p className="term-dim">
        Each parameter is 0–1 and persists in this browser. The same values drive the
        WebGL shader and the CSS fallback. Also available as the <code>crt</code> command.
      </p>
      <p className="term-dim">{KEYS_HINT}</p>
      {EFFECT_PARAM_NAMES.map((name, i) => (
        <div key={name} className="term-settings-row" data-selected={i === selected}>
          <label htmlFor={`crt-${name}`}>
            {i === selected ? "▸ " : "  "}
            {name}
            {effects.settings.overrides[name] !== undefined && (
              <span className="term-accent">*</span>
            )}
          </label>
          <input
            id={`crt-${name}`}
            ref={(el) => {
              rowRefs.current[i] = el;
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
        <button
          type="button"
          className="term-button"
          onClick={() => effects.store.reset()}
        >
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
      <p data-selected={selected === modeRowIndex}>
        <span className={selected === modeRowIndex ? "term-accent" : "term-dim"}>
          {selected === modeRowIndex ? "▸ " : "  "}
        </span>
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            className="term-button"
            data-active={effects.mode === mode}
            ref={(el) => {
              if (effects.mode === mode) rowRefs.current[modeRowIndex] = el;
            }}
            onFocus={() => setSelected(modeRowIndex)}
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
      <ul className="term-theme-menu" aria-label="theme">
        <li data-selected={selected === autoRow}>
          <button
            type="button"
            className="term-button"
            data-active={preference === "auto"}
            ref={(el) => {
              rowRefs.current[autoRow] = el;
            }}
            onFocus={() => setSelected(autoRow)}
            onClick={setAuto}
          >
            <span className="term-accent">{selected === autoRow ? "▸ " : "  "}</span>
            <span>{preference === "auto" ? "* " : "  "}</span>
            {"auto".padEnd(18)}
            <span className="term-dim">
              {"  "}
              follow system light/dark
              {preference === "auto" ? ` · now: ${theme.id}` : ""}
            </span>
          </button>
        </li>
        {THEMES.map((t) => {
          const rowIndex = themeRowIndex(t.id);
          return (
            <li key={t.id} data-selected={selected === rowIndex}>
              <button
                type="button"
                className="term-button"
                data-active={preference === t.id}
                ref={(el) => {
                  rowRefs.current[rowIndex] = el;
                }}
                onFocus={() => setSelected(rowIndex)}
                onClick={() => setTheme(t.id)}
              >
                <span className="term-accent">{selected === rowIndex ? "▸ " : "  "}</span>
                <span>{preference === t.id ? "* " : "  "}</span>
                {t.id.padEnd(18)}
                <span className="term-dim">
                  {"  "}
                  {t.mode} · {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
