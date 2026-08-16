import { tokenize } from "./parser";
import type { Registry } from "./registry";
import type { ShellEnv } from "./types";
import type { Vfs } from "./vfs";

export interface CompletionResult {
  /** Full replacement input when completion succeeded (single match or common prefix grew). */
  replacement?: string;
  /** Candidates to display when ambiguous. */
  candidates: string[];
}

export function commonPrefix(values: string[]): string {
  if (values.length === 0) return "";
  let prefix = values[0] ?? "";
  for (const v of values.slice(1)) {
    while (!v.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

/** Default path completion against the VFS. */
export function completePath(
  partial: string,
  vfs: Vfs,
  env: ShellEnv,
  opts: { dirsOnly?: boolean } = {},
): string[] {
  const slash = partial.lastIndexOf("/");
  const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : "";
  const namePart = slash >= 0 ? partial.slice(slash + 1) : partial;
  const entries = vfs.list(env.cwd, dirPart === "" ? "." : dirPart);
  if (!entries) return [];
  return entries
    .filter((e) => e.name.startsWith(namePart))
    .filter((e) => !opts.dirsOnly || e.kind === "dir")
    .map((e) => dirPart + e.name + (e.kind === "dir" ? "/" : ""));
}

export function complete(
  input: string,
  vfs: Vfs,
  env: ShellEnv,
  registry: Registry,
): CompletionResult {
  const endsWithSpace = /\s$/.test(input);
  const tokens = tokenize(input);

  // Completing the command name itself.
  if (tokens.length === 0 || (tokens.length === 1 && !endsWithSpace)) {
    const partial = tokens[0] ?? "";
    const matches = registry
      .names()
      .filter((n) => n.startsWith(partial) && !registry.get(n)?.hidden);
    if (matches.length === 0) return { candidates: [] };
    if (matches.length === 1)
      return { replacement: `${matches[0]} `, candidates: matches };
    const prefix = commonPrefix(matches);
    return prefix.length > partial.length
      ? { replacement: prefix, candidates: matches }
      : { candidates: matches };
  }

  // Completing an argument.
  const cmdName = tokens[0] ?? "";
  const command = registry.get(cmdName);
  const partial = endsWithSpace ? "" : (tokens[tokens.length - 1] ?? "");
  const argIndex = tokens.length - (endsWithSpace ? 0 : 1) - 1;
  const matches = command?.complete
    ? command.complete(partial, argIndex, vfs, env)
    : completePath(partial, vfs, env);
  if (matches.length === 0) return { candidates: [] };
  const head = endsWithSpace ? input : input.slice(0, input.length - partial.length);
  if (matches.length === 1) {
    const value = matches[0] ?? "";
    return {
      replacement: head + value + (value.endsWith("/") ? "" : " "),
      candidates: matches,
    };
  }
  const prefix = commonPrefix(matches);
  return prefix.length > partial.length
    ? { replacement: head + prefix, candidates: matches }
    : { candidates: matches };
}
