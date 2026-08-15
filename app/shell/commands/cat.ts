import { completePath } from "../completion";
import { fail, ok, type Command, type OutputBlock } from "../types";

export const cat: Command = {
  name: "cat",
  man: {
    synopsis: "cat <file>...",
    description: "Print file contents. Try cat contact.txt or cat blog/<post>.md.",
    examples: ["cat about.txt", "cat blog/hello-world.md"],
  },
  run(args, vfs, env) {
    if (args.length === 0) return fail("cat: missing operand", 2);
    const output: OutputBlock[] = [];
    let exitCode: 0 | 1 = 0;
    for (const target of args) {
      const node = vfs.resolve(env.cwd, target);
      if (!node) {
        output.push({
          type: "text",
          text: `cat: ${target}: no such file or directory`,
          style: "error",
        });
        exitCode = 1;
        continue;
      }
      if (node.kind === "dir") {
        output.push({ type: "text", text: `cat: ${target}: is a directory`, style: "error" });
        exitCode = 1;
        continue;
      }
      output.push({ type: "pre", lines: node.read().split("\n") });
    }
    return { ...ok(output), exitCode };
  },
  complete: (partial, _i, vfs, env) => completePath(partial, vfs, env),
};
