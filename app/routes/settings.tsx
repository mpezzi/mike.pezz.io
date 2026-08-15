import { useMemo } from "react";
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

function bar(value: number, width = 10): string {
  const filled = Math.round(value * width);
  return `[${"■".repeat(filled)}${"□".repeat(width - filled)}]`;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const effects = useEffects();

  // Static representation for the CRT canvas renderer.
  const model = useMemo((): ScreenModel => {
    return {
      title: "settings",
      nodes: [
        heading(1, "~/settings"),
        blank(),
        ...EFFECT_PARAM_NAMES.map((name) =>
          line(
            text(name.padEnd(12)),
            text(` ${bar(effects.params[name])} `, { fg: "dim" }),
            text(effects.params[name].toFixed(2)),
          ),
        ),
        blank(),
        line(
          text("adjust with ", { fg: "dim" }),
          text("crt set <param> <0-1>", { fg: "accent" }),
          text(" — sliders available with effects off", { fg: "dim" }),
        ),
      ],
    };
  }, [effects.params]);
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
      {EFFECT_PARAM_NAMES.map((name) => (
        <div key={name} className="term-settings-row">
          <label htmlFor={`crt-${name}`}>
            {name}
            {effects.settings.overrides[name] !== undefined && (
              <span className="term-accent">*</span>
            )}
          </label>
          <input
            id={`crt-${name}`}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={effects.params[name]}
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
