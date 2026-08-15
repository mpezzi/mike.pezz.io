import { describe, expect, it } from "vitest";
import { History, MAX_HISTORY, type HistoryStorage } from "./history";

function memoryStorage(initial: string[] = []): HistoryStorage & { data: string[] } {
  const box = {
    data: initial,
    get: () => box.data,
    set: (entries: string[]) => {
      box.data = entries;
    },
  };
  return box;
}

describe("History", () => {
  it("recalls entries backwards and forwards, restoring the pending input", () => {
    const history = new History();
    history.push("ls");
    history.push("cd blog");
    expect(history.prev("typed")).toBe("cd blog");
    expect(history.prev("typed")).toBe("ls");
    expect(history.prev("typed")).toBe("ls"); // clamped at oldest
    expect(history.next()).toBe("cd blog");
    expect(history.next()).toBe("typed"); // back to what was being typed
    expect(history.next()).toBeNull();
  });

  it("ignores blank input and collapses consecutive duplicates", () => {
    const history = new History();
    history.push("  ");
    history.push("ls");
    history.push("ls");
    history.push("pwd");
    history.push("ls");
    expect(history.all()).toEqual(["ls", "pwd", "ls"]);
  });

  it("bounds the ring at MAX_HISTORY", () => {
    const history = new History();
    for (let i = 0; i < MAX_HISTORY + 50; i++) history.push(`cmd${i}`);
    expect(history.all()).toHaveLength(MAX_HISTORY);
    expect(history.all()[0]).toBe("cmd50");
  });

  it("persists via injected storage", () => {
    const storage = memoryStorage();
    const history = new History(storage);
    history.push("ls");
    expect(storage.data).toEqual(["ls"]);
    const restored = new History(memoryStorage(["ls"]));
    expect(restored.prev("")).toBe("ls");
  });

  it("push resets the cursor", () => {
    const history = new History();
    history.push("first");
    history.prev("");
    history.push("second");
    expect(history.prev("")).toBe("second");
  });
});
