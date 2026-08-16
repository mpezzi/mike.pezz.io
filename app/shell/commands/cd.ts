import { completePath } from "../completion";
import { fail, ok, type Command } from "../types";

export const cd: Command = {
  name: "cd",
  man: {
    synopsis: "cd [directory]",
    description:
      "Change the working directory. Directories are pages: cd blog takes you to /blog.",
    examples: ["cd blog", "cd ..", "cd ~"],
  },
  run(args, vfs, env) {
    const target = args[0] ?? "~";
    const canonical = vfs.normalize(env.cwd, target);
    const node = vfs.resolve(env.cwd, target);
    if (!node) return fail(`cd: no such file or directory: ${target}`);
    if (node.kind !== "dir") return fail(`cd: not a directory: ${target}`);
    const url = vfs.urlForPath(canonical);
    return ok([], {
      env: { cwd: canonical },
      effects: url !== undefined ? [{ type: "navigate", to: url }] : [],
    });
  },
  complete: (partial, _i, vfs, env) =>
    completePath(partial, vfs, env, { dirsOnly: true }),
};

export const open: Command = {
  name: "open",
  man: {
    synopsis: "open <path>",
    description:
      "Open a file or directory as a page. Opening a blog post navigates to it.",
    examples: ["open blog/hello-world.md", "open contact.txt"],
  },
  run(args, vfs, env) {
    const target = args[0];
    if (target === undefined) return fail("open: missing operand", 2);
    const canonical = vfs.normalize(env.cwd, target);
    const node = vfs.resolve(env.cwd, target);
    if (!node) return fail(`open: no such file or directory: ${target}`);
    const url = vfs.urlForPath(canonical);
    if (url === undefined) return fail(`open: ${target}: nothing to open`);
    const envPatch = node.kind === "dir" ? { env: { cwd: canonical } } : {};
    return ok([], { ...envPatch, effects: [{ type: "navigate", to: url }] });
  },
  complete: (partial, _i, vfs, env) => completePath(partial, vfs, env),
};
