import { cat } from "./commands/cat";
import { cd, open } from "./commands/cd";
import { clear } from "./commands/clear";
import { cowsay } from "./commands/cowsay";
import { crt } from "./commands/crt";
import { echo } from "./commands/echo";
import { effects } from "./commands/effects";
import { exit } from "./commands/exit";
import { grep } from "./commands/grep";
import { makeHelp } from "./commands/help";
import { ls } from "./commands/ls";
import { makeMan } from "./commands/man";
import { neofetch } from "./commands/neofetch";
import { pwd } from "./commands/pwd";
import { sudo } from "./commands/sudo";
import { theme } from "./commands/theme";
import { whoami } from "./commands/whoami";
import type { Command } from "./types";

const COMMANDS: Command[] = [
  cat, cd, open, clear, cowsay, crt, echo, effects, exit,
  grep, ls, neofetch, pwd, sudo, theme, whoami,
];

export interface Registry {
  get(name: string): Command | undefined;
  names(): string[];
  visible(): Command[];
}

export function createRegistry(extra: Command[] = []): Registry {
  const map = new Map<string, Command>();
  const self: Registry = {
    get: (name) => map.get(name),
    names: () => [...map.keys()].sort(),
    visible: () =>
      [...new Set(map.values())]
        .filter((c) => !c.hidden)
        .sort((a, b) => a.name.localeCompare(b.name)),
  };
  const lazy = () => self;
  for (const cmd of [...COMMANDS, makeHelp(lazy), makeMan(lazy), ...extra]) {
    map.set(cmd.name, cmd);
  }
  // Aliases
  const aliasTo = (alias: string, target: string) => {
    const cmd = map.get(target);
    if (cmd) map.set(alias, { ...cmd, name: alias, hidden: true });
  };
  aliasTo("ll", "ls");
  aliasTo("dir", "ls");
  return self;
}
