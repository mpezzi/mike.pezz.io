export interface HistoryStorage {
  get(): string[];
  set(entries: string[]): void;
}

export const MAX_HISTORY = 200;

/**
 * Arrow-key command history: bounded ring with duplicate-collapse.
 * Storage is injected so the core stays pure (sessionStorage in the app,
 * an in-memory stub in tests).
 */
export class History {
  private entries: string[];
  private cursor: number | null = null;
  private pending = "";

  constructor(private storage?: HistoryStorage) {
    this.entries = storage?.get() ?? [];
  }

  push(entry: string): void {
    const trimmed = entry.trim();
    if (trimmed === "") return;
    if (this.entries[this.entries.length - 1] !== trimmed) {
      this.entries.push(trimmed);
      if (this.entries.length > MAX_HISTORY) {
        this.entries = this.entries.slice(-MAX_HISTORY);
      }
      this.storage?.set(this.entries);
    }
    this.reset();
  }

  /** Move back in history; `current` is preserved for a later next(). */
  prev(current: string): string | null {
    if (this.entries.length === 0) return null;
    if (this.cursor === null) {
      this.pending = current;
      this.cursor = this.entries.length - 1;
    } else if (this.cursor > 0) {
      this.cursor -= 1;
    }
    return this.entries[this.cursor] ?? null;
  }

  next(): string | null {
    if (this.cursor === null) return null;
    if (this.cursor < this.entries.length - 1) {
      this.cursor += 1;
      return this.entries[this.cursor] ?? null;
    }
    this.cursor = null;
    return this.pending;
  }

  reset(): void {
    this.cursor = null;
    this.pending = "";
  }

  all(): readonly string[] {
    return this.entries;
  }
}
