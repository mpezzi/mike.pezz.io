import { ok, type Command } from "../types";

const COW = [
  "        \\   ^__^",
  "         \\  (oo)\\_______",
  "            (__)\\       )\\/\\",
  "                ||----w |",
  "                ||     ||",
];

export const cowsay: Command = {
  name: "cowsay",
  hidden: true,
  man: {
    synopsis: "cowsay [text...]",
    description: "A cow says things.",
    examples: ["cowsay hello world"],
  },
  run(args) {
    const message = args.length > 0 ? args.join(" ") : "moo";
    const width = Math.min(message.length, 60);
    const lines: string[] = [];
    for (let i = 0; i < message.length; i += width) {
      lines.push(message.slice(i, i + width));
    }
    const border = "-".repeat(width + 2);
    const bubble = [
      ` ${border}`,
      ...lines.map((l, i) => {
        const pad = l.padEnd(width);
        if (lines.length === 1) return `< ${pad} >`;
        if (i === 0) return `/ ${pad} \\`;
        if (i === lines.length - 1) return `\\ ${pad} /`;
        return `| ${pad} |`;
      }),
      ` ${border}`,
      ...COW,
    ];
    return ok([{ type: "pre", lines: bubble }]);
  },
};
