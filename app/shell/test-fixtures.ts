import { DEFAULT_PARAMS } from "~/effects/params";
import type { ShellEnv } from "./types";
import { createVfs, dir, file, type Vfs } from "./vfs";

export function fixtureVfs(): Vfs {
  return createVfs(
    dir(
      "~",
      [
        dir(
          "blog",
          [
            file("hello.md", "# hello\nsome react content here", {
              meta: { title: "hello", date: new Date("2026-01-02") },
              urlPath: "/blog/hello",
            }),
            file("second.md", "more text\nreact again", {
              meta: { title: "second", date: new Date("2026-02-03") },
              urlPath: "/blog/second",
            }),
          ],
          "/blog",
        ),
        dir("work", [], "/work"),
        file("about.txt", "hi, i'm mike", { urlPath: "/" }),
        file(".plan", "ship it"),
      ],
      "/",
    ),
  );
}

export function fixtureEnv(overrides: Partial<ShellEnv> = {}): ShellEnv {
  return {
    cwd: "~",
    user: "mike",
    host: "pezz.io",
    columns: 80,
    themeId: "green-phosphor",
    themeAuto: false,
    effectsMode: "webgl",
    crt: { resolved: { ...DEFAULT_PARAMS }, overrides: {}, preset: "full" },
    uptimeMs: 1000,
    ...overrides,
  };
}
