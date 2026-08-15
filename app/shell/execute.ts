import { tokenize } from "./parser";
import type { Registry } from "./registry";
import type { CommandResult, ShellEnv } from "./types";
import type { Vfs } from "./vfs";

/** Parse and run one input line against the pure shell core. */
export function execute(
  input: string,
  vfs: Vfs,
  env: ShellEnv,
  registry: Registry,
): CommandResult {
  const tokens = tokenize(input);
  const name = tokens[0];
  if (name === undefined) return { output: [], exitCode: 0 };
  const command = registry.get(name);
  if (!command) {
    return {
      output: [
        {
          type: "text",
          text: `${name}: command not found (try: help)`,
          style: "error",
        },
      ],
      exitCode: 2,
    };
  }
  return command.run(tokens.slice(1), vfs, env);
}
