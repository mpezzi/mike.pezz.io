import {
  clampParam,
  EFFECT_PARAM_NAMES,
  isEffectParamName,
  type EffectPresetName,
} from "~/effects/params";
import { fail, ok, type Command, type TableCell } from "../types";

const PRESET_NAMES: EffectPresetName[] = ["full", "static", "off"];

function bar(value: number, width = 10): string {
  const filled = Math.round(value * width);
  return `[${"■".repeat(filled)}${"□".repeat(width - filled)}]`;
}

export const crt: Command = {
  name: "crt",
  man: {
    synopsis: "crt [ls | set <param> <0-1> | reset [param] | preset <full|static|off>]",
    description:
      "Tune the CRT effect parameters (curvature, scanlines, glow, noise, ...). Values are 0–1 and persist in your browser. Also adjustable at /settings, where ↑/↓ (or k/j) select a parameter and ←/→ (or h/l) adjust it.",
    examples: ["crt ls", "crt set curvature 0.8", "crt reset", "crt preset static"],
  },
  run(args, _vfs, env) {
    const sub = args[0] ?? "ls";

    if (sub === "ls" || sub === "list") {
      const rows: TableCell[][] = EFFECT_PARAM_NAMES.map((name) => {
        const value = env.crt.resolved[name];
        const overridden = env.crt.overrides[name] !== undefined;
        return [
          { text: name, style: overridden ? "accent" : "plain" },
          { text: bar(value), style: "dim" },
          { text: value.toFixed(2) },
          { text: overridden ? "(custom)" : "", style: "dim" },
        ];
      });
      return ok([
        { type: "table", rows },
        {
          type: "text",
          text: `preset: ${env.crt.preset} — crt set <param> <0-1> to adjust, or open /settings`,
          style: "dim",
        },
      ]);
    }

    if (sub === "set") {
      const param = args[1];
      const raw = args[2];
      if (param === undefined || raw === undefined) {
        return fail("usage: crt set <param> <0-1>", 2);
      }
      if (!isEffectParamName(param)) {
        return fail(`crt: unknown parameter '${param}' (try: crt ls)`);
      }
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) return fail(`crt: not a number: ${raw}`, 2);
      const value = clampParam(parsed);
      return ok(
        [{ type: "text", text: `${param} = ${value.toFixed(2)}`, style: "dim" }],
        { effects: [{ type: "setCrtParam", param, value }] },
      );
    }

    if (sub === "reset") {
      const param = args[1];
      if (param !== undefined && !isEffectParamName(param)) {
        return fail(`crt: unknown parameter '${param}' (try: crt ls)`);
      }
      return ok(
        [
          {
            type: "text",
            text: param
              ? `${param} reset to default`
              : "all parameters reset to defaults",
            style: "dim",
          },
        ],
        {
          effects: [
            param !== undefined && isEffectParamName(param)
              ? { type: "resetCrt", param }
              : { type: "resetCrt" },
          ],
        },
      );
    }

    if (sub === "preset") {
      const preset = args[1];
      if (preset === undefined || !(PRESET_NAMES as string[]).includes(preset)) {
        return fail("usage: crt preset <full|static|off>", 2);
      }
      return ok([{ type: "text", text: `preset: ${preset}`, style: "dim" }], {
        effects: [{ type: "setCrtPreset", preset: preset as EffectPresetName }],
      });
    }

    return fail(`crt: unknown subcommand '${sub}' (ls, set, reset, preset)`, 2);
  },
  complete(partial, argIndex, _vfs, _env) {
    if (argIndex === 0) {
      return ["ls", "set", "reset", "preset"].filter((s) => s.startsWith(partial));
    }
    if (argIndex === 1) {
      return [...EFFECT_PARAM_NAMES, ...PRESET_NAMES]
        .filter((s) => s.startsWith(partial))
        .sort();
    }
    return [];
  },
};
