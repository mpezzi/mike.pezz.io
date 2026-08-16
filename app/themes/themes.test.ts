import { describe, expect, it } from "vitest";
import { themeToCssVars } from "./css";
import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  getTheme,
  isThemeId,
  THEMES,
  toggledTheme,
} from "./themes";

describe("theme definitions", () => {
  it("every theme has 16 ANSI colors and valid hex values", () => {
    for (const theme of THEMES) {
      expect(theme.colors.ansi).toHaveLength(16);
      const all = [
        theme.colors.background,
        theme.colors.foreground,
        theme.colors.accent,
        theme.colors.link,
        theme.colors.error,
        theme.colors.dim,
        theme.phosphorTint,
        ...theme.colors.ansi,
      ];
      for (const color of all) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it("ids are unique and recognized", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(isThemeId(id)).toBe(true);
    expect(isThemeId("hotdog-stand")).toBe(false);
  });

  it("every family has both a light and a dark variant", () => {
    const families = new Set(THEMES.flatMap((t) => (t.family ? [t.family] : [])));
    for (const family of families) {
      const members = THEMES.filter((t) => t.family === family);
      expect(members.some((t) => t.mode === "dark")).toBe(true);
      expect(members.some((t) => t.mode === "light")).toBe(true);
    }
  });

  it("defaults exist and have the right modes", () => {
    expect(getTheme(DEFAULT_DARK_THEME).mode).toBe("dark");
    expect(getTheme(DEFAULT_LIGHT_THEME).mode).toBe("light");
  });
});

describe("getTheme", () => {
  it("throws on unknown ids", () => {
    expect(() => getTheme("hotdog-stand" as Parameters<typeof getTheme>[0])).toThrow(
      /unknown theme/,
    );
  });
});

describe("toggledTheme", () => {
  it("switches within a family", () => {
    expect(toggledTheme(getTheme("catppuccin-mocha")).id).toBe("catppuccin-latte");
    expect(toggledTheme(getTheme("catppuccin-latte")).id).toBe("catppuccin-mocha");
    expect(toggledTheme(getTheme("gruvbox-dark")).id).toBe("gruvbox-light");
    expect(toggledTheme(getTheme("solarized-light")).id).toBe("solarized-dark");
  });

  it("falls back to the default of the opposite mode without a family", () => {
    expect(toggledTheme(getTheme("dracula")).id).toBe(DEFAULT_LIGHT_THEME);
    expect(toggledTheme(getTheme("catppuccin-latte")).mode).toBe("dark");
  });

  it("falls back to the dark default from a familyless light theme", () => {
    const { family: _family, ...rest } = getTheme("catppuccin-latte");
    expect(toggledTheme(rest).id).toBe(DEFAULT_DARK_THEME);
  });

  it("falls back when a family has no counterpart in the target mode", () => {
    const orphan = { ...getTheme("dracula"), family: "orphan-family" };
    expect(toggledTheme(orphan).id).toBe(DEFAULT_LIGHT_THEME);
  });
});

describe("themeToCssVars", () => {
  it("emits the complete variable set for every theme", () => {
    for (const theme of THEMES) {
      const vars = themeToCssVars(theme);
      expect(vars["--term-bg"]).toBe(theme.colors.background);
      expect(vars["--term-fg"]).toBe(theme.colors.foreground);
      expect(vars["--term-phosphor"]).toBe(theme.phosphorTint);
      for (let i = 0; i < 16; i++) {
        expect(vars[`--term-ansi-${i}`]).toBeDefined();
      }
    }
  });
});
