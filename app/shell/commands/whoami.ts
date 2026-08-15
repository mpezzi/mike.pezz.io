import { ok, type Command } from "../types";

export const whoami: Command = {
  name: "whoami",
  man: {
    synopsis: "whoami",
    description: "Print the current user.",
  },
  run(_args, _vfs, env) {
    return ok([
      { type: "text", text: env.user },
      { type: "text", text: "Mike Pezzi — Software Engineer", style: "dim" },
    ]);
  },
};
