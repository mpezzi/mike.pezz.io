import { fail, ok, type Command, type EffectsMode } from "../types";

const MODES: EffectsMode[] = ["webgl", "css", "off"];

export const effects: Command = {
  name: "effects",
  man: {
    synopsis: "effects [webgl | css | off]",
    description:
      "Show or set the rendering mode: webgl (full CRT shader), css (lightweight scanlines), or off (plain, selectable text). See crt to tune individual effect parameters.",
    examples: ["effects", "effects off", "effects webgl"],
  },
  run(args, _vfs, env) {
    const mode = args[0];
    if (mode === undefined) {
      return ok([
        { type: "text", text: `effects: ${env.effectsMode}` },
        { type: "text", text: "modes: webgl, css, off", style: "dim" },
      ]);
    }
    if (!(MODES as string[]).includes(mode)) {
      return fail(`effects: unknown mode '${mode}' (webgl, css, off)`);
    }
    return ok(
      [{ type: "text", text: `effects mode: ${mode}`, style: "dim" }],
      { effects: [{ type: "setEffectsMode", mode: mode as EffectsMode }] },
    );
  },
  complete(partial, argIndex) {
    if (argIndex > 0) return [];
    return MODES.filter((m) => m.startsWith(partial));
  },
};
