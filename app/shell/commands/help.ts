import type { Registry } from "../registry";
import { ok, type Command, type TableCell } from "../types";

export function makeHelp(registry: () => Registry): Command {
  return {
    name: "help",
    man: {
      synopsis: "help",
      description: "List available commands. See man <command> for details.",
    },
    run() {
      const rows: TableCell[][] = registry()
        .visible()
        .map((cmd) => [
          { text: cmd.name, style: "accent" },
          { text: cmd.man.description.split(".")[0] ?? "", style: "dim" },
        ]);
      return ok([
        { type: "text", text: "Available commands:", style: "heading" },
        { type: "table", rows },
        {
          type: "text",
          text: "Tab completes; ↑/↓ recall history; man <cmd> for details.",
          style: "dim",
        },
      ]);
    },
  };
}
