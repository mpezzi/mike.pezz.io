import type { EffectParamName, EffectParams, EffectPresetName } from "~/effects/params";
import type { ThemeId } from "~/themes/types";
import type { Vfs } from "./vfs";

export type EffectsMode = "webgl" | "css" | "off";

/** Read-only environment a command executes against. */
export interface ShellEnv {
  cwd: string; // e.g. "~" or "~/blog"
  user: string;
  host: string;
  columns: number;
  themeId: ThemeId;
  /** True when the theme preference is "auto" (follow the system scheme). */
  themeAuto: boolean;
  effectsMode: EffectsMode;
  crt: {
    resolved: EffectParams;
    overrides: Partial<EffectParams>;
    preset: EffectPresetName;
  };
  /** ms since session start; used by neofetch uptime. */
  uptimeMs: number;
}

export type ShellEffect =
  | { type: "navigate"; to: string }
  | { type: "setTheme"; themeId: ThemeId }
  | { type: "setThemeAuto" }
  | { type: "toggleThemeMode" }
  | { type: "clear" }
  | { type: "openExternal"; url: string }
  | { type: "setEffectsMode"; mode: EffectsMode }
  | { type: "setCrtParam"; param: EffectParamName; value: number }
  | { type: "resetCrt"; param?: EffectParamName }
  | { type: "setCrtPreset"; preset: EffectPresetName };

export type OutputStyle = "plain" | "error" | "dim" | "accent" | "heading";

export interface TableCell {
  text: string;
  style?: OutputStyle;
  /** In-app route to navigate to when activated. */
  to?: string;
}

export type OutputBlock =
  | { type: "text"; text: string; style?: OutputStyle }
  | { type: "table"; rows: TableCell[][] }
  | { type: "link"; label: string; to: string }
  | { type: "pre"; lines: string[]; style?: OutputStyle }
  | { type: "banner" };

export interface CommandResult {
  output: OutputBlock[];
  env?: Partial<Pick<ShellEnv, "cwd">>;
  effects?: ShellEffect[];
  exitCode: 0 | 1 | 2;
}

export interface ManPage {
  synopsis: string;
  description: string;
  examples?: string[];
}

export interface Command {
  name: string;
  run(args: string[], vfs: Vfs, env: ShellEnv): CommandResult;
  /** Complete the argument at `argIndex` (0 = first arg after the command). */
  complete?(partial: string, argIndex: number, vfs: Vfs, env: ShellEnv): string[];
  man: ManPage;
  hidden?: boolean;
}

export function ok(output: OutputBlock[], rest?: Partial<CommandResult>): CommandResult {
  return { output, exitCode: 0, ...rest };
}

export function fail(message: string, exitCode: 1 | 2 = 1): CommandResult {
  return { output: [{ type: "text", text: message, style: "error" }], exitCode };
}
