import type { Action } from "~/screen/model";

/** Maps numeric region ids (stored per-cell in the buffer) to actions. */
export class RegionMap {
  private actions = new Map<number, Action>();
  private nextId = 1;

  register(action: Action): number {
    const id = this.nextId++;
    this.actions.set(id, action);
    return id;
  }

  get(id: number): Action | undefined {
    return this.actions.get(id);
  }

  clear(): void {
    this.actions.clear();
    this.nextId = 1;
  }

  get size(): number {
    return this.actions.size;
  }
}
