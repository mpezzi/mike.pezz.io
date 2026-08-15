import { ok, type Command } from "../types";

export const echo: Command = {
  name: "echo",
  man: {
    synopsis: "echo [text...]",
    description: "Print arguments to the terminal.",
  },
  run(args) {
    return ok([{ type: "text", text: args.join(" ") }]);
  },
};
