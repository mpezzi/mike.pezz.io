import { ok, type Command } from "../types";

export const clear: Command = {
  name: "clear",
  man: {
    synopsis: "clear",
    description: "Clear the terminal scrollback. Ctrl+L does the same.",
  },
  run() {
    return ok([], { effects: [{ type: "clear" }] });
  },
};
