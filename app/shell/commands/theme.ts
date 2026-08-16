import { getTheme, isThemeId, THEMES } from "~/themes/themes";
import { fail, ok, type Command, type TableCell } from "../types";

export const theme: Command = {
  name: "theme",
  man: {
    synopsis: "theme [ls | toggle | <theme-id>]",
    description:
      "List, switch, or toggle terminal color themes. toggle flips between light and dark within a theme family.",
    examples: ["theme ls", "theme gruvbox-dark", "theme toggle"],
  },
  run(args, _vfs, env) {
    const sub = args[0] ?? "ls";
    if (sub === "ls" || sub === "list") {
      const rows: TableCell[][] = THEMES.map((t) => [
        { text: t.id === env.themeId ? "*" : " " },
        { text: t.id, style: t.id === env.themeId ? "accent" : "plain" },
        { text: t.mode, style: "dim" },
        { text: t.label, style: "dim" },
      ]);
      return ok([
        { type: "table", rows },
        {
          type: "text",
          text: "theme <id> to switch, theme toggle for light/dark.",
          style: "dim",
        },
      ]);
    }
    if (sub === "toggle") {
      return ok([{ type: "text", text: "toggled light/dark mode", style: "dim" }], {
        effects: [{ type: "toggleThemeMode" }],
      });
    }
    if (!isThemeId(sub)) {
      return fail(`theme: unknown theme '${sub}' (try: theme ls)`);
    }
    return ok(
      [{ type: "text", text: `theme set to ${getTheme(sub).label}`, style: "dim" }],
      { effects: [{ type: "setTheme", themeId: sub }] },
    );
  },
  complete(partial, argIndex) {
    if (argIndex > 0) return [];
    return ["ls", "toggle", ...THEMES.map((t) => t.id)]
      .filter((v) => v.startsWith(partial))
      .sort();
  },
};
