import type { EffectParams } from "~/effects/params";
import type { Action, ScreenNode } from "~/screen/model";
import type { TerminalTheme } from "~/themes/types";
import { measureFont, type FontMetrics } from "./font/font-metrics";
import { FrameLoop } from "./frame-loop";
import { hitTest } from "./hit-test";
import { Layout } from "./layout";
import { RegionMap } from "./regions";
import { SceneRenderer } from "./renderer/scene-canvas2d";
import { CrtPipeline, hexToRgb } from "./renderer/webgl/pipeline";
import { ATTR_BOLD, COLOR_SLOTS, ScreenBuffer } from "./screen-buffer";

export interface EngineContent {
  /** Scrollable content (header, page, scrollback). */
  nodes: ScreenNode[];
  /** Prompt line pieces. */
  ps1: string;
  promptValue: string;
  promptCaret: number;
  statusLeft: string;
  statusRight: string;
}

export interface EngineCallbacks {
  onAction: (action: Action) => void;
  onContextLoss: () => void;
}

const FONT_FAMILY = `"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`;

/**
 * Owns the canvas: cell layout, scene rendering, WebGL post-processing,
 * scrolling, and pointer dispatch. React feeds it state; it never touches
 * React.
 */
export class CrtEngine {
  private gl: WebGL2RenderingContext;
  private metrics: FontMetrics;
  private view: ScreenBuffer;
  private virtual: ScreenBuffer;
  private regions = new RegionMap();
  private scene: SceneRenderer;
  private pipeline: CrtPipeline;
  private loop: FrameLoop;
  private theme: TerminalTheme;
  private params: EffectParams;
  private content: EngineContent | null = null;
  private contentRows = 0;
  private scroll = 0;
  private stickToBottom = true;
  private sceneDirty = true;
  private animated = true;
  private disposed = false;
  private dpr: number;

  cols = 80;
  private viewRows = 24;

  constructor(
    private canvas: HTMLCanvasElement,
    theme: TerminalTheme,
    params: EffectParams,
    private callbacks: EngineCallbacks,
  ) {
    this.theme = theme;
    this.params = params;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const gl = canvas.getContext("webgl2", { antialias: false });
    if (!gl) throw new Error("webgl2 unavailable");
    this.gl = gl;

    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) throw new Error("2d context unavailable");
    const fontSize = Math.round((window.innerWidth < 640 ? 13 : 15) * this.dpr);
    this.metrics = measureFont(probe, FONT_FAMILY, fontSize);

    this.sizeToWindow();
    this.view = new ScreenBuffer(this.cols, this.viewRows);
    this.virtual = new ScreenBuffer(this.cols, 400);
    this.scene = new SceneRenderer(this.metrics, theme, this.cols, this.viewRows);
    this.pipeline = new CrtPipeline(
      gl,
      this.scene.canvas.width,
      this.scene.canvas.height,
    );
    this.loop = new FrameLoop((t) => this.renderFrame(t));
    this.loop.setMode("animated");

    canvas.addEventListener("webglcontextlost", this.handleContextLost);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onContextLoss();
  };

  private sizeToWindow(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.cols = Math.max(20, Math.floor(this.canvas.width / this.metrics.cellWidth));
    this.viewRows = Math.max(
      10,
      Math.floor(this.canvas.height / this.metrics.cellHeight),
    );
  }

  resize(): void {
    this.sizeToWindow();
    this.view = new ScreenBuffer(this.cols, this.viewRows);
    this.scene.resize(this.cols, this.viewRows);
    this.pipeline.resizeScene(this.scene.canvas.width, this.scene.canvas.height);
    this.relayout();
  }

  setTheme(theme: TerminalTheme): void {
    this.theme = theme;
    this.scene.setTheme(theme);
    this.relayout();
  }

  setParams(params: EffectParams): void {
    this.params = params;
    this.requestRender();
  }

  setAnimated(animated: boolean): void {
    this.animated = animated;
    this.loop.setMode(animated ? "animated" : "static");
    this.requestRender();
  }

  setVisible(visible: boolean): void {
    if (!visible) {
      this.loop.setMode("stopped");
    } else {
      this.loop.setMode(this.animated ? "animated" : "static");
      this.requestRender();
    }
  }

  setContent(content: EngineContent): void {
    this.content = content;
    this.relayout();
  }

  scrollBy(deltaRows: number): void {
    const maxScroll = Math.max(0, this.contentRows - this.scrollViewRows());
    const next = Math.min(maxScroll, Math.max(0, this.scroll + deltaRows));
    if (next === this.scroll) return;
    this.scroll = next;
    this.stickToBottom = next >= maxScroll;
    this.blit();
  }

  /** Rows available for scrollable content (prompt + status are fixed). */
  private scrollViewRows(): number {
    return this.viewRows - 2;
  }

  private relayout(): void {
    if (!this.content) return;
    this.regions.clear();
    // Layout into the virtual buffer, growing it as needed.
    const needed = Math.max(400, this.contentRows + 100);
    if (this.virtual.cols !== this.cols || this.virtual.rows < needed) {
      this.virtual = new ScreenBuffer(this.cols, needed);
    } else {
      this.virtual.clear();
    }
    const layout = new Layout(this.virtual, this.regions, 1);
    this.contentRows = layout.render(this.content.nodes, 0);
    if (this.contentRows > this.virtual.rows - 4) {
      this.virtual = new ScreenBuffer(this.cols, this.contentRows + 100);
      this.regions.clear();
      this.contentRows = new Layout(this.virtual, this.regions, 1).render(
        this.content.nodes,
        0,
      );
    }
    const maxScroll = Math.max(0, this.contentRows - this.scrollViewRows());
    if (this.stickToBottom) this.scroll = maxScroll;
    this.scroll = Math.min(this.scroll, maxScroll);
    this.blit();
  }

  /** Copy the visible virtual window + prompt + status into the view. */
  private blit(): void {
    if (!this.content) return;
    const rows = this.scrollViewRows();
    for (let y = 0; y < rows; y++) {
      const vy = y + this.scroll;
      for (let x = 0; x < this.cols; x++) {
        const cell = this.virtual.get(x, vy);
        if (cell && vy < this.contentRows) {
          this.view.set(x, y, cell.char, cell.fg, cell.bg, cell.attrs, cell.region);
        } else {
          this.view.set(x, y, " ");
        }
      }
    }
    // Prompt line.
    const promptY = this.viewRows - 2;
    this.view.clearRow(promptY);
    const x = this.view.writeText(
      1,
      promptY,
      this.content.ps1,
      COLOR_SLOTS.accent,
      COLOR_SLOTS.bg,
      ATTR_BOLD,
    );
    this.view.writeText(x + 1, promptY, this.content.promptValue);
    // Status line.
    const statusY = this.viewRows - 1;
    this.view.clearRow(statusY);
    this.view.writeText(1, statusY, this.content.statusLeft, COLOR_SLOTS.dim);
    const right = this.content.statusRight;
    this.view.writeText(
      Math.max(1, this.cols - right.length - 1),
      statusY,
      right,
      COLOR_SLOTS.dim,
    );
    this.sceneDirty = true;
    this.requestRender();
  }

  private requestRender(): void {
    this.loop.requestRender();
  }

  private renderFrame(timeMs: number): void {
    if (this.disposed) return;
    if (this.sceneDirty) {
      this.view.markAllDirty();
      const dirty = this.view.takeDirtyRows();
      this.scene.renderRows(this.view, dirty);
      this.pipeline.uploadScene(this.scene.canvas);
      this.sceneDirty = false;
    }
    const caretCol =
      1 + (this.content?.ps1.length ?? 0) + 1 + (this.content?.promptCaret ?? 0);
    this.pipeline.render(this.canvas.width, this.canvas.height, {
      time: timeMs / 1000,
      rows: this.viewRows,
      phosphor: hexToRgb(this.theme.phosphorTint),
      cursorCell: [caretCol, this.viewRows - 2],
      cellSize: [1 / this.cols, 1 / this.viewRows],
      params: this.params,
    });
  }

  /** Pointer position (CSS px) → action lookup. */
  actionAt(cssX: number, cssY: number): Action | undefined {
    const rect = this.canvas.getBoundingClientRect();
    const hit = hitTest(cssX, cssY, {
      width: rect.width,
      height: rect.height,
      cellWidth: this.metrics.cellWidth / this.dpr,
      cellHeight: this.metrics.cellHeight / this.dpr,
      cols: this.cols,
      rows: this.viewRows,
      curvature: this.params.curvature,
    });
    if (!hit) return undefined;
    if (hit.row < this.scrollViewRows()) {
      const cell = this.virtual.get(hit.col, hit.row + this.scroll);
      if (cell && cell.region !== 0) return this.regions.get(cell.region);
    }
    return undefined;
  }

  dispose(): void {
    this.disposed = true;
    this.loop.dispose();
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
  }
}
