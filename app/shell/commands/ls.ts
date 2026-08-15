import { completePath } from "../completion";
import { fail, ok, type Command, type TableCell } from "../types";

function formatDate(date: Date | undefined): string {
  if (!date) return "            ";
  return date
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .padEnd(12);
}

export const ls: Command = {
  name: "ls",
  man: {
    synopsis: "ls [-l] [path]",
    description:
      "List directory contents. Pages are directories; posts and projects are files. Use -l for details.",
    examples: ["ls", "ls -l blog", "ls ~/work"],
  },
  run(args, vfs, env) {
    const long = args.includes("-l") || args.includes("-la") || args.includes("-al");
    const paths = args.filter((a) => !a.startsWith("-"));
    const target = paths[0] ?? ".";
    const node = vfs.resolve(env.cwd, target);
    if (!node) return fail(`ls: cannot access '${target}': no such file or directory`);
    if (node.kind === "file") {
      return ok([{ type: "text", text: node.name }]);
    }
    const entries = vfs.list(env.cwd, target) ?? [];
    if (entries.length === 0) return ok([]);
    const canonicalDir = vfs.normalize(env.cwd, target);
    const rows: TableCell[][] = entries.map((entry) => {
      const path =
        canonicalDir === "~" ? `~/${entry.name}` : `${canonicalDir}/${entry.name}`;
      const url = vfs.urlForPath(path);
      const nameCell: TableCell = {
        text: entry.kind === "dir" ? `${entry.name}/` : entry.name,
        ...(entry.kind === "dir" ? { style: "accent" as const } : {}),
        ...(url !== undefined ? { to: url } : {}),
      };
      if (!long) return [nameCell];
      const perms = entry.kind === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
      const size =
        entry.kind === "file" ? String(entry.read().length).padStart(6) : "  4096";
      return [
        { text: perms, style: "dim" },
        { text: "mike", style: "dim" },
        { text: size, style: "dim" },
        { text: formatDate(entry.kind === "file" ? entry.meta?.date : undefined), style: "dim" },
        nameCell,
        ...(entry.kind === "file" && entry.meta?.title
          ? [{ text: entry.meta.title, style: "dim" as const }]
          : []),
      ];
    });
    return ok([{ type: "table", rows }]);
  },
  complete: (partial, _i, vfs, env) => completePath(partial, vfs, env),
};
