import { ok, type Command } from "../types";

export const pwd: Command = {
  name: "pwd",
  man: {
    synopsis: "pwd",
    description: "Print the current working directory.",
  },
  run(_args, _vfs, env) {
    return ok([{ type: "text", text: env.cwd.replace(/^~/, "/home/mike") }]);
  },
};
