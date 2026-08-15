import type { TerminalTheme } from "./types";

/** Map a theme to the CSS custom properties consumed by terminal.css. */
export function themeToCssVars(theme: TerminalTheme): Record<string, string> {
  const vars: Record<string, string> = {
    "--term-bg": theme.colors.background,
    "--term-fg": theme.colors.foreground,
    "--term-cursor": theme.colors.cursor,
    "--term-selection": theme.colors.selection,
    "--term-accent": theme.colors.accent,
    "--term-link": theme.colors.link,
    "--term-error": theme.colors.error,
    "--term-dim": theme.colors.dim,
    "--term-phosphor": theme.phosphorTint,
  };
  theme.colors.ansi.forEach((color, i) => {
    vars[`--term-ansi-${i}`] = color;
  });
  return vars;
}

export function applyThemeCssVars(theme: TerminalTheme, root: HTMLElement): void {
  for (const [name, value] of Object.entries(themeToCssVars(theme))) {
    root.style.setProperty(name, value);
  }
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.mode;
}
