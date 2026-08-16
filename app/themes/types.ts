import type { EffectParams } from "~/effects/params";

export type ThemeMode = "dark" | "light";

export type ThemeId =
  | "green-phosphor"
  | "amber-phosphor"
  | "mono-white"
  | "catppuccin-mocha"
  | "catppuccin-latte"
  | "gruvbox-dark"
  | "gruvbox-light"
  | "dracula"
  | "nord"
  | "solarized-dark"
  | "solarized-light";

/** Indexes into the 16-color ANSI palette, plus semantic slots. */
export interface ThemeColors {
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  accent: string;
  link: string;
  error: string;
  dim: string;
  /** ANSI 0–15: black, red, green, yellow, blue, magenta, cyan, white, then bright variants. */
  ansi: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
}

export interface TerminalTheme {
  id: ThemeId;
  label: string;
  mode: ThemeMode;
  /** Themes sharing a family are light/dark variants of each other. */
  family?: string;
  colors: ThemeColors;
  /** Phosphor tint applied by the CRT composite pass (hex color). */
  phosphorTint: string;
  /** Per-theme overrides on top of DEFAULT_PARAMS. */
  effectDefaults?: Partial<EffectParams>;
}
