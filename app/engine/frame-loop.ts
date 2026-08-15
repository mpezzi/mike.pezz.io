export type FrameMode = "animated" | "static" | "stopped";

/**
 * rAF orchestration: "animated" renders every frame (noise/flicker/cursor
 * are functions of time); "static" renders only when requestRender() is
 * called; "stopped" does nothing (tab hidden).
 */
export class FrameLoop {
  private mode: FrameMode = "stopped";
  private rafId: number | null = null;
  private pending = false;

  constructor(private render: (timeMs: number) => void) {}

  setMode(mode: FrameMode): void {
    this.mode = mode;
    if (mode === "animated") {
      this.start();
    } else {
      this.stop();
      if (mode === "static" && this.pending) {
        this.pending = false;
        this.render(performance.now());
      }
    }
  }

  getMode(): FrameMode {
    return this.mode;
  }

  /** Request a render in static mode (no-op needed in animated mode). */
  requestRender(): void {
    if (this.mode === "animated") return;
    if (this.mode === "stopped") {
      this.pending = true;
      return;
    }
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame((t) => {
      this.pending = false;
      if (this.mode === "static") this.render(t);
    });
  }

  private start(): void {
    if (this.rafId !== null) return;
    const tick = (t: number) => {
      this.rafId = requestAnimationFrame(tick);
      this.render(t);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  dispose(): void {
    this.stop();
    this.mode = "stopped";
  }
}
