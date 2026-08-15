import type { Registry } from "../registry";
import { fail, ok, type Command, type OutputBlock } from "../types";

/** Extra man pages that aren't commands. */
const EXTRA_PAGES: Record<string, { synopsis: string; description: string }> = {
  mike: {
    synopsis: "mike — software engineer",
    description:
      "Mike Pezzi builds software. Currently shipping things at Reactiv. This website is his terminal. See also: ls ~/work, cat contact.txt.",
  },
};

export function makeMan(registry: () => Registry): Command {
  return {
    name: "man",
    man: {
      synopsis: "man <command>",
      description: "Show the manual page for a command.",
      examples: ["man ls", "man crt", "man mike"],
    },
    run(args) {
      const topic = args[0];
      if (topic === undefined) return fail("What manual page do you want?", 2);
      const cmd = registry().get(topic);
      const page = cmd?.man ?? EXTRA_PAGES[topic];
      if (!page) return fail(`No manual entry for ${topic}`);
      const output: OutputBlock[] = [
        { type: "text", text: `${topic.toUpperCase()}(1)`, style: "heading" },
        { type: "text", text: "" },
        { type: "text", text: "SYNOPSIS", style: "accent" },
        { type: "text", text: `    ${page.synopsis}` },
        { type: "text", text: "" },
        { type: "text", text: "DESCRIPTION", style: "accent" },
        { type: "text", text: `    ${page.description}` },
      ];
      const examples = cmd?.man.examples;
      if (examples && examples.length > 0) {
        output.push(
          { type: "text", text: "" },
          { type: "text", text: "EXAMPLES", style: "accent" },
          ...examples.map((e) => ({ type: "text" as const, text: `    ${e}`, style: "dim" as const })),
        );
      }
      return ok(output);
    },
    complete(partial, _i, _vfs, _env) {
      return [...registry().names(), ...Object.keys(EXTRA_PAGES)]
        .filter((n) => n.startsWith(partial))
        .sort();
    },
  };
}
