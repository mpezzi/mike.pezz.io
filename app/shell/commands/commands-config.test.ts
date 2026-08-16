import { describe, expect, it } from "vitest";
import { execute } from "../execute";
import { createRegistry } from "../registry";
import { fixtureEnv, fixtureVfs } from "../test-fixtures";
import type { ShellEnv } from "../types";

const vfs = fixtureVfs();
const registry = createRegistry();

function run(input: string, env: ShellEnv = fixtureEnv()) {
  return execute(input, vfs, env, registry);
}

describe("theme", () => {
  it("lists themes marking the current one", () => {
    const result = run("theme ls");
    const table = result.output[0];
    if (table?.type !== "table") throw new Error("expected table");
    const current = table.rows.find((r) => r[0]?.text === "*");
    expect(current?.[1]?.text).toBe("green-phosphor");
  });

  it("sets a known theme", () => {
    const result = run("theme dracula");
    expect(result.effects).toEqual([{ type: "setTheme", themeId: "dracula" }]);
  });

  it("toggles light/dark", () => {
    expect(run("theme toggle").effects).toEqual([{ type: "toggleThemeMode" }]);
  });

  it("theme auto emits the auto effect", () => {
    expect(run("theme auto").effects).toEqual([{ type: "setThemeAuto" }]);
  });

  it("theme ls stars auto when the preference is auto", () => {
    const result = run("theme ls", fixtureEnv({ themeAuto: true }));
    const table = result.output[0];
    if (table?.type !== "table") throw new Error("expected table");
    const starred = table.rows.filter((r) => r[0]?.text === "*");
    expect(starred).toHaveLength(1);
    expect(starred[0]?.[1]?.text).toBe("auto");
  });

  it("rejects unknown themes", () => {
    expect(run("theme hotdog-stand").exitCode).toBe(1);
  });
});

describe("effects", () => {
  it("shows the current mode with no args", () => {
    const result = run("effects");
    expect(result.output[0]).toMatchObject({ text: "effects: webgl" });
    expect(result.effects).toBeUndefined();
  });

  it("sets a valid mode and rejects junk", () => {
    expect(run("effects off").effects).toEqual([{ type: "setEffectsMode", mode: "off" }]);
    expect(run("effects vhs").exitCode).toBe(1);
  });
});

describe("crt", () => {
  it("lists parameters with values", () => {
    const result = run("crt ls");
    const table = result.output[0];
    if (table?.type !== "table") throw new Error("expected table");
    expect(table.rows.map((r) => r[0]?.text)).toContain("curvature");
  });

  it("sets a clamped parameter", () => {
    expect(run("crt set curvature 3").effects).toEqual([
      { type: "setCrtParam", param: "curvature", value: 1 },
    ]);
    expect(run("crt set glow 0.5").effects).toEqual([
      { type: "setCrtParam", param: "glow", value: 0.5 },
    ]);
  });

  it("rejects unknown params, bad numbers, and bad usage", () => {
    expect(run("crt set sharpness 1").exitCode).toBe(1);
    expect(run("crt set glow abc").exitCode).toBe(2);
    expect(run("crt set glow").exitCode).toBe(2);
    expect(run("crt bogus").exitCode).toBe(2);
  });

  it("resets one or all params", () => {
    expect(run("crt reset glow").effects).toEqual([{ type: "resetCrt", param: "glow" }]);
    expect(run("crt reset").effects).toEqual([{ type: "resetCrt" }]);
  });

  it("sets presets", () => {
    expect(run("crt preset static").effects).toEqual([
      { type: "setCrtPreset", preset: "static" },
    ]);
    expect(run("crt preset extreme").exitCode).toBe(2);
  });
});

describe("help & man", () => {
  it("help lists visible commands only", () => {
    const result = run("help");
    const table = result.output.find((b) => b.type === "table");
    if (table?.type !== "table") throw new Error("expected table");
    const names = table.rows.map((r) => r[0]?.text);
    expect(names).toContain("ls");
    expect(names).not.toContain("sudo");
  });

  it("man shows a page with synopsis and examples", () => {
    const result = run("man ls");
    const texts = result.output.map((b) => (b.type === "text" ? b.text : ""));
    expect(texts.some((t) => t.includes("ls [-l] [path]"))).toBe(true);
  });

  it("man knows extra pages and rejects unknown topics", () => {
    expect(run("man mike").exitCode).toBe(0);
    expect(run("man frob").exitCode).toBe(1);
    expect(run("man").exitCode).toBe(2);
  });
});

describe("crt error branches", () => {
  it("rejects resetting an unknown parameter", () => {
    expect(run("crt reset sharpness").exitCode).toBe(1);
  });
});

describe("argument completion", () => {
  const env = fixtureEnv();

  it("crt completes subcommands and parameter names", () => {
    expect(registry.get("crt")?.complete?.("s", 0, vfs, env)).toEqual(["set"]);
    expect(registry.get("crt")?.complete?.("curv", 1, vfs, env)).toEqual(["curvature"]);
    expect(registry.get("crt")?.complete?.("x", 2, vfs, env)).toEqual([]);
  });

  it("effects completes modes at arg 0 only", () => {
    expect(registry.get("effects")?.complete?.("w", 0, vfs, env)).toEqual(["webgl"]);
    expect(registry.get("effects")?.complete?.("w", 1, vfs, env)).toEqual([]);
  });

  it("man completes command names and extra pages", () => {
    const matches = registry.get("man")?.complete?.("m", 0, vfs, env) ?? [];
    expect(matches).toContain("man");
    expect(matches).toContain("mike");
  });

  it("theme completes nothing past the first argument", () => {
    expect(registry.get("theme")?.complete?.("g", 1, vfs, env)).toEqual([]);
  });

  it("grep completes paths only from the second argument", () => {
    expect(registry.get("grep")?.complete?.("b", 0, vfs, env)).toEqual([]);
    expect(registry.get("grep")?.complete?.("b", 1, vfs, env)).toEqual(["blog/"]);
  });
});

describe("cowsay long messages", () => {
  it("wraps into a multi-line bubble", () => {
    const result = run(`cowsay ${"m".repeat(130)}`);
    if (result.output[0]?.type !== "pre") throw new Error("expected pre");
    const bubble = result.output[0].lines;
    expect(bubble.some((l) => l.startsWith("/ "))).toBe(true);
    expect(bubble.some((l) => l.startsWith("| "))).toBe(true);
    expect(bubble.some((l) => l.startsWith("\\ "))).toBe(true);
  });
});

describe("misc commands", () => {
  it("whoami, echo, clear, exit, sudo, cowsay, neofetch behave", () => {
    expect(run("whoami").output[0]).toMatchObject({ text: "mike" });
    expect(run("echo a b").output[0]).toMatchObject({ text: "a b" });
    expect(run("clear").effects).toEqual([{ type: "clear" }]);
    expect(run("exit").exitCode).toBe(0);
    expect(run("sudo make me a sandwich").exitCode).toBe(1);
    expect(run("sudo rm -rf /").exitCode).toBe(0);
    expect(run("neofetch").output[0]).toEqual({ type: "banner" });
    const cow = run("cowsay hi");
    if (cow.output[0]?.type !== "pre") throw new Error("expected pre");
    expect(cow.output[0].lines.join("\n")).toContain("< hi >");
  });

  it("ll aliases ls", () => {
    const result = run("ll");
    expect(result.output[0]?.type).toBe("table");
  });
});
