import { ok, type Command } from "../types";

export const neofetch: Command = {
  name: "neofetch",
  man: {
    synopsis: "neofetch",
    description: "Show system information for this terminal.",
  },
  run() {
    return ok([{ type: "banner" }]);
  },
};
