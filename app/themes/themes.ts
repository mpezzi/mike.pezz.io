import type { TerminalTheme, ThemeId, ThemeMode } from "./types";

const greenPhosphor: TerminalTheme = {
  id: "green-phosphor",
  label: "Green Phosphor (VT220)",
  mode: "dark",
  colors: {
    background: "#0a0f0a",
    foreground: "#33ff33",
    cursor: "#33ff33",
    selection: "#1c4a1c",
    accent: "#66ff66",
    link: "#99ff99",
    error: "#33ff33",
    dim: "#1f9e1f",
    ansi: [
      "#0a0f0a",
      "#1f9e1f",
      "#33ff33",
      "#66ff66",
      "#28c828",
      "#4ded4d",
      "#39e639",
      "#99ff99",
      "#146414",
      "#2bd42b",
      "#45ff45",
      "#80ff80",
      "#30dc30",
      "#5cf75c",
      "#4bf04b",
      "#ccffcc",
    ],
  },
  phosphorTint: "#33ff33",
  effectDefaults: { glow: 0.7, tintAmount: 0.55 },
};

const amberPhosphor: TerminalTheme = {
  id: "amber-phosphor",
  label: "Amber Phosphor",
  mode: "dark",
  colors: {
    background: "#100b02",
    foreground: "#ffb000",
    cursor: "#ffb000",
    selection: "#4a3510",
    accent: "#ffc94d",
    link: "#ffd98c",
    error: "#ffb000",
    dim: "#a06e00",
    ansi: [
      "#100b02",
      "#a06e00",
      "#ffb000",
      "#ffc94d",
      "#cc8c00",
      "#e8a000",
      "#d99a00",
      "#ffd98c",
      "#5e4100",
      "#bf8400",
      "#ffba1f",
      "#ffd166",
      "#e09800",
      "#f5aa00",
      "#eda300",
      "#ffe9bf",
    ],
  },
  phosphorTint: "#ffb000",
  effectDefaults: { glow: 0.65, tintAmount: 0.55 },
};

const monoWhite: TerminalTheme = {
  id: "mono-white",
  label: "IBM Mono White",
  mode: "dark",
  colors: {
    background: "#0d0d0d",
    foreground: "#e8e8e8",
    cursor: "#e8e8e8",
    selection: "#3a3a3a",
    accent: "#ffffff",
    link: "#cfcfcf",
    error: "#e8e8e8",
    dim: "#8a8a8a",
    ansi: [
      "#0d0d0d",
      "#8a8a8a",
      "#e8e8e8",
      "#ffffff",
      "#b5b5b5",
      "#d0d0d0",
      "#c2c2c2",
      "#f5f5f5",
      "#4d4d4d",
      "#a0a0a0",
      "#dcdcdc",
      "#ffffff",
      "#c8c8c8",
      "#e0e0e0",
      "#d6d6d6",
      "#ffffff",
    ],
  },
  phosphorTint: "#dcdcdc",
  effectDefaults: { glow: 0.5, tintAmount: 0.2 },
};

const catppuccinMocha: TerminalTheme = {
  id: "catppuccin-mocha",
  label: "Catppuccin Mocha",
  mode: "dark",
  family: "catppuccin",
  colors: {
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    cursor: "#f5e0dc",
    selection: "#45475a",
    accent: "#cba6f7",
    link: "#89b4fa",
    error: "#f38ba8",
    dim: "#6c7086",
    ansi: [
      "#45475a",
      "#f38ba8",
      "#a6e3a1",
      "#f9e2af",
      "#89b4fa",
      "#f5c2e7",
      "#94e2d5",
      "#bac2de",
      "#585b70",
      "#f38ba8",
      "#a6e3a1",
      "#f9e2af",
      "#89b4fa",
      "#f5c2e7",
      "#94e2d5",
      "#a6adc8",
    ],
  },
  phosphorTint: "#cdd6f4",
  effectDefaults: { tintAmount: 0.08 },
};

const catppuccinLatte: TerminalTheme = {
  id: "catppuccin-latte",
  label: "Catppuccin Latte",
  mode: "light",
  family: "catppuccin",
  colors: {
    background: "#eff1f5",
    foreground: "#4c4f69",
    cursor: "#dc8a78",
    selection: "#ccd0da",
    accent: "#8839ef",
    link: "#1e66f5",
    error: "#d20f39",
    dim: "#9ca0b0",
    ansi: [
      "#5c5f77",
      "#d20f39",
      "#40a02b",
      "#df8e1d",
      "#1e66f5",
      "#ea76cb",
      "#179299",
      "#acb0be",
      "#6c6f85",
      "#d20f39",
      "#40a02b",
      "#df8e1d",
      "#1e66f5",
      "#ea76cb",
      "#179299",
      "#bcc0cc",
    ],
  },
  phosphorTint: "#4c4f69",
  effectDefaults: { tintAmount: 0.05, glow: 0.2, noise: 0.15 },
};

const gruvboxDark: TerminalTheme = {
  id: "gruvbox-dark",
  label: "Gruvbox Dark",
  mode: "dark",
  family: "gruvbox",
  colors: {
    background: "#282828",
    foreground: "#ebdbb2",
    cursor: "#ebdbb2",
    selection: "#504945",
    accent: "#fe8019",
    link: "#83a598",
    error: "#fb4934",
    dim: "#928374",
    ansi: [
      "#282828",
      "#cc241d",
      "#98971a",
      "#d79921",
      "#458588",
      "#b16286",
      "#689d6a",
      "#a89984",
      "#928374",
      "#fb4934",
      "#b8bb26",
      "#fabd2f",
      "#83a598",
      "#d3869b",
      "#8ec07c",
      "#ebdbb2",
    ],
  },
  phosphorTint: "#ebdbb2",
  effectDefaults: { tintAmount: 0.1 },
};

const gruvboxLight: TerminalTheme = {
  id: "gruvbox-light",
  label: "Gruvbox Light",
  mode: "light",
  family: "gruvbox",
  colors: {
    background: "#fbf1c7",
    foreground: "#3c3836",
    cursor: "#3c3836",
    selection: "#d5c4a1",
    accent: "#af3a03",
    link: "#076678",
    error: "#9d0006",
    dim: "#928374",
    ansi: [
      "#fbf1c7",
      "#cc241d",
      "#98971a",
      "#d79921",
      "#458588",
      "#b16286",
      "#689d6a",
      "#7c6f64",
      "#928374",
      "#9d0006",
      "#79740e",
      "#b57614",
      "#076678",
      "#8f3f71",
      "#427b58",
      "#3c3836",
    ],
  },
  phosphorTint: "#3c3836",
  effectDefaults: { tintAmount: 0.05, glow: 0.2, noise: 0.15 },
};

const dracula: TerminalTheme = {
  id: "dracula",
  label: "Dracula",
  mode: "dark",
  colors: {
    background: "#282a36",
    foreground: "#f8f8f2",
    cursor: "#f8f8f2",
    selection: "#44475a",
    accent: "#bd93f9",
    link: "#8be9fd",
    error: "#ff5555",
    dim: "#6272a4",
    ansi: [
      "#21222c",
      "#ff5555",
      "#50fa7b",
      "#f1fa8c",
      "#bd93f9",
      "#ff79c6",
      "#8be9fd",
      "#f8f8f2",
      "#6272a4",
      "#ff6e6e",
      "#69ff94",
      "#ffffa5",
      "#d6acff",
      "#ff92df",
      "#a4ffff",
      "#ffffff",
    ],
  },
  phosphorTint: "#f8f8f2",
  effectDefaults: { tintAmount: 0.08 },
};

const nord: TerminalTheme = {
  id: "nord",
  label: "Nord",
  mode: "dark",
  colors: {
    background: "#2e3440",
    foreground: "#d8dee9",
    cursor: "#d8dee9",
    selection: "#434c5e",
    accent: "#88c0d0",
    link: "#81a1c1",
    error: "#bf616a",
    dim: "#4c566a",
    ansi: [
      "#3b4252",
      "#bf616a",
      "#a3be8c",
      "#ebcb8b",
      "#81a1c1",
      "#b48ead",
      "#88c0d0",
      "#e5e9f0",
      "#4c566a",
      "#bf616a",
      "#a3be8c",
      "#ebcb8b",
      "#81a1c1",
      "#b48ead",
      "#8fbcbb",
      "#eceff4",
    ],
  },
  phosphorTint: "#d8dee9",
  effectDefaults: { tintAmount: 0.06, glow: 0.3, noise: 0.15, flicker: 0.1 },
};

const solarizedDark: TerminalTheme = {
  id: "solarized-dark",
  label: "Solarized Dark",
  mode: "dark",
  family: "solarized",
  colors: {
    background: "#002b36",
    foreground: "#839496",
    cursor: "#839496",
    selection: "#073642",
    accent: "#b58900",
    link: "#268bd2",
    error: "#dc322f",
    dim: "#586e75",
    ansi: [
      "#073642",
      "#dc322f",
      "#859900",
      "#b58900",
      "#268bd2",
      "#d33682",
      "#2aa198",
      "#eee8d5",
      "#002b36",
      "#cb4b16",
      "#586e75",
      "#657b83",
      "#839496",
      "#6c71c4",
      "#93a1a1",
      "#fdf6e3",
    ],
  },
  phosphorTint: "#93a1a1",
  effectDefaults: { tintAmount: 0.08 },
};

const solarizedLight: TerminalTheme = {
  id: "solarized-light",
  label: "Solarized Light",
  mode: "light",
  family: "solarized",
  colors: {
    background: "#fdf6e3",
    foreground: "#657b83",
    cursor: "#657b83",
    selection: "#eee8d5",
    accent: "#b58900",
    link: "#268bd2",
    error: "#dc322f",
    dim: "#93a1a1",
    ansi: [
      "#073642",
      "#dc322f",
      "#859900",
      "#b58900",
      "#268bd2",
      "#d33682",
      "#2aa198",
      "#eee8d5",
      "#002b36",
      "#cb4b16",
      "#586e75",
      "#657b83",
      "#839496",
      "#6c71c4",
      "#93a1a1",
      "#fdf6e3",
    ],
  },
  phosphorTint: "#657b83",
  effectDefaults: { tintAmount: 0.05, glow: 0.2, noise: 0.15 },
};

export const THEMES: readonly TerminalTheme[] = [
  greenPhosphor,
  amberPhosphor,
  monoWhite,
  catppuccinMocha,
  catppuccinLatte,
  gruvboxDark,
  gruvboxLight,
  dracula,
  nord,
  solarizedDark,
  solarizedLight,
];

export const DEFAULT_DARK_THEME: ThemeId = "solarized-dark";
export const DEFAULT_LIGHT_THEME: ThemeId = "solarized-light";
export const THEME_STORAGE_KEY = "pezz.theme";

/**
 * What the user stored: a specific theme, or "auto" (the default) which
 * follows the system light/dark preference using the solarized pair.
 */
export type ThemePreference = ThemeId | "auto";

const byId = new Map(THEMES.map((t) => [t.id, t]));

export function getTheme(id: ThemeId): TerminalTheme {
  const theme = byId.get(id);
  if (!theme) throw new Error(`unknown theme: ${id}`);
  return theme;
}

export function isThemeId(id: string): id is ThemeId {
  return byId.has(id as ThemeId);
}

export function isThemePreference(value: string): value is ThemePreference {
  return value === "auto" || isThemeId(value);
}

/** Resolve a preference to a concrete theme id. */
export function resolveThemePreference(
  preference: ThemePreference,
  prefersLight: boolean,
): ThemeId {
  if (preference === "auto") {
    return prefersLight ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;
  }
  return preference;
}

/**
 * Toggling mode: prefer the counterpart within the same family;
 * otherwise fall back to the default theme of the target mode.
 */
export function toggledTheme(current: TerminalTheme): TerminalTheme {
  const targetMode: ThemeMode = current.mode === "dark" ? "light" : "dark";
  if (current.family) {
    const sibling = THEMES.find(
      (t) => t.family === current.family && t.mode === targetMode,
    );
    if (sibling) return sibling;
  }
  return getTheme(targetMode === "dark" ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME);
}
