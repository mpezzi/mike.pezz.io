import { completePath } from "../completion";
import { fail, ok, type Command, type TableCell } from "../types";
import type { VfsNode } from "../vfs";

function* walk(node: VfsNode, path: string): Generator<{ path: string; node: VfsNode }> {
  yield { path, node };
  if (node.kind === "dir") {
    for (const child of node.children.values()) {
      yield* walk(child, path === "~" ? `~/${child.name}` : `${path}/${child.name}`);
    }
  }
}

export const grep: Command = {
  name: "grep",
  man: {
    synopsis: "grep [-i] <pattern> [path]",
    description:
      "Search file contents recursively. Matching lines link to the file's page when it has one.",
    examples: ["grep -i react ~/blog", "grep typescript"],
  },
  run(args, vfs, env) {
    const ignoreCase = args.includes("-i");
    const positional = args.filter((a) => !a.startsWith("-"));
    const pattern = positional[0];
    if (pattern === undefined) return fail("usage: grep [-i] <pattern> [path]", 2);
    const target = positional[1] ?? "~";
    const start = vfs.resolve(env.cwd, target);
    if (!start) return fail(`grep: ${target}: no such file or directory`);

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, ignoreCase ? "i" : "");
    } catch {
      return fail(`grep: invalid pattern: ${pattern}`, 2);
    }

    const rows: TableCell[][] = [];
    const startPath = vfs.normalize(env.cwd, target);
    for (const { path, node } of walk(start, startPath)) {
      if (node.kind !== "file") continue;
      for (const [i, lineText] of node.read().split("\n").entries()) {
        if (!regex.test(lineText)) continue;
        const url = vfs.urlForPath(path);
        rows.push([
          {
            text: `${path}:${i + 1}`,
            style: "accent",
            ...(url !== undefined ? { to: url } : {}),
          },
          { text: lineText.trim().slice(0, 120) },
        ]);
        if (rows.length >= 50) break;
      }
      if (rows.length >= 50) break;
    }
    if (rows.length === 0) {
      return { output: [], exitCode: 1 };
    }
    return ok([{ type: "table", rows }]);
  },
  complete: (partial, argIndex, vfs, env) =>
    argIndex >= 1 ? completePath(partial, vfs, env) : [],
};
