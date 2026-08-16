import { getTheme, isThemeId, THEMES } from "~/themes/themes";
import { fail, ok, type Command, type TableCell } from "../types";

export const theme: Command = {
  name: "theme",
  man: {
    synopsis: "theme [ls | auto | toggle | <theme-id>]",
    description:
      "List, switch, or toggle terminal color themes. auto follows your system's light/dark preference (solarized); picking a theme directly overrides it. toggle flips between light and dark within a theme family.",
    examples: ["theme ls", "theme gruvbox-dark", "theme auto", "theme toggle"],
  },
  run(args, _vfs, env) {
    const sub = args[0] ?? "ls";
    if (sub === "ls" || sub === "list") {
      const autoRow: TableCell[] = [
        { text: env.themeAuto ? "*" : " " },
        { text: "auto", style: env.themeAuto ? "accent" : "plain" },
        { text: "", style: "dim" },
        {
          text: `follow system light/dark${env.themeAuto ? ` (now: ${env.themeId})` : ""}`,
          style: "dim",
        },
      ];
      const rows: TableCell[][] = [
        autoRow,
        ...THEMES.map((t): TableCell[] => {
          const active = !env.themeAuto && t.id === env.themeId;
          return [
            { text: active ? "*" : " " },
            { text: t.id, style: active ? "accent" : "plain" },
            { text: t.mode, style: "dim" },
            { text: t.label, style: "dim" },
          ];
        }),
      ];
      return ok([
        { type: "table", rows },
        {
          type: "text",
          text: "theme <id> to switch, theme auto to follow the system, theme toggle for light/dark.",
          style: "dim",
        },
      ]);
    }
    if (sub === "auto") {
      return ok(
        [
          {
            type: "text",
            text: "theme follows the system light/dark preference",
            style: "dim",
          },
        ],
        { effects: [{ type: "setThemeAuto" }] },
      );
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
    return ["ls", "auto", "toggle", ...THEMES.map((t) => t.id)]
      .filter((v) => v.startsWith(partial))
      .sort();
  },
};
