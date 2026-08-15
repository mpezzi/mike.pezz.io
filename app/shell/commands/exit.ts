import { ok, type Command } from "../types";

export const exit: Command = {
  name: "exit",
  hidden: true,
  man: {
    synopsis: "exit",
    description: "Exit the shell. Except you can't.",
  },
  run() {
    return ok([
      { type: "text", text: "logout" },
      {
        type: "text",
        text: "...just kidding. There is no escape. Try cd ~ instead.",
        style: "dim",
      },
    ]);
  },
};
