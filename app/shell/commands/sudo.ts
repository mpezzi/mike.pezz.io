import { fail, ok, type Command } from "../types";

export const sudo: Command = {
  name: "sudo",
  hidden: true,
  man: {
    synopsis: "sudo <command>",
    description: "Execute a command as another user. (You wish.)",
  },
  run(args) {
    if (args.join(" ") === "rm -rf /") {
      return ok([
        { type: "text", text: "nice try.", style: "error" },
        { type: "text", text: "this incident will be reported.", style: "dim" },
      ]);
    }
    return fail("mike is not in the sudoers file. This incident will be reported.");
  },
};
