import type { EffectParams } from "~/effects/params";
import brightFrag from "~/effects/shaders/bright-pass.frag.glsl?raw";
import blurFrag from "~/effects/shaders/blur.frag.glsl?raw";
import compositeFrag from "~/effects/shaders/composite.frag.glsl?raw";
import fullscreenVert from "~/effects/shaders/fullscreen.vert.glsl?raw";
import {
  createFbo,
  createProgram,
  createTexture,
  deleteFbo,
  drawFullscreen,
  type Fbo,
} from "./gl-utils";

export interface CompositeState {
  time: number;
  rows: number;
  phosphor: [number, number, number];
  cursorCell: [number, number]; // negative x hides the cursor
  cellSize: [number, number]; // in scene uv units
  params: EffectParams;
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const n = parseInt(value, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Post-processing pipeline:
 *   scene canvas -> sceneTex -> bright pass (1/4 res) -> blur H -> blur V
 *   -> composite (curvature, CA, bloom, scanlines, noise, vignette, tint)
 */
export class CrtPipeline {
  private gl: WebGL2RenderingContext;
  private sceneTex: WebGLTexture;
  private bright: Fbo;
  private blurA: Fbo;
  private blurB: Fbo;
  private brightProgram: WebGLProgram;
  private blurProgram: WebGLProgram;
  private compositeProgram: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private sceneWidth: number;
  private sceneHeight: number;
  private bloomDirty = true;

  constructor(
    gl: WebGL2RenderingContext,
    sceneWidth: number,
    sceneHeight: number,
  ) {
    this.gl = gl;
    this.sceneWidth = sceneWidth;
    this.sceneHeight = sceneHeight;
    this.sceneTex = createTexture(gl, sceneWidth, sceneHeight);
    const qw = Math.max(1, Math.floor(sceneWidth / 4));
    const qh = Math.max(1, Math.floor(sceneHeight / 4));
    this.bright = createFbo(gl, qw, qh);
    this.blurA = createFbo(gl, qw, qh);
    this.blurB = createFbo(gl, qw, qh);
    this.brightProgram = createProgram(gl, fullscreenVert, brightFrag);
    this.blurProgram = createProgram(gl, fullscreenVert, blurFrag);
    this.compositeProgram = createProgram(gl, fullscreenVert, compositeFrag);
    const vao = gl.createVertexArray();
    if (!vao) throw new Error("failed to create VAO");
    this.vao = vao;
  }

  resizeScene(width: number, height: number): void {
    const gl = this.gl;
    gl.deleteTexture(this.sceneTex);
    deleteFbo(gl, this.bright);
    deleteFbo(gl, this.blurA);
    deleteFbo(gl, this.blurB);
    this.sceneWidth = width;
    this.sceneHeight = height;
    this.sceneTex = createTexture(gl, width, height);
    const qw = Math.max(1, Math.floor(width / 4));
    const qh = Math.max(1, Math.floor(height / 4));
    this.bright = createFbo(gl, qw, qh);
    this.blurA = createFbo(gl, qw, qh);
    this.blurB = createFbo(gl, qw, qh);
    this.bloomDirty = true;
  }

  /** Upload the scene canvas into the scene texture (full upload). */
  uploadScene(source: TexImageSource): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
    this.bloomDirty = true;
  }

  private runBloomChain(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);

    // Bright pass at quarter resolution.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bright.framebuffer);
    gl.viewport(0, 0, this.bright.width, this.bright.height);
    gl.useProgram(this.brightProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
    gl.uniform1i(gl.getUniformLocation(this.brightProgram, "uScene"), 0);
    gl.uniform1f(gl.getUniformLocation(this.brightProgram, "uThreshold"), 0.4);
    drawFullscreen(gl);

    // Separable blur, bright -> blurA -> blurB.
    gl.useProgram(this.blurProgram);
    const sourceLoc = gl.getUniformLocation(this.blurProgram, "uSource");
    const dirLoc = gl.getUniformLocation(this.blurProgram, "uDirection");
    gl.uniform1i(sourceLoc, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurA.framebuffer);
    gl.viewport(0, 0, this.blurA.width, this.blurA.height);
    gl.bindTexture(gl.TEXTURE_2D, this.bright.texture);
    gl.uniform2f(dirLoc, 1 / this.blurA.width, 0);
    drawFullscreen(gl);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurB.framebuffer);
    gl.viewport(0, 0, this.blurB.width, this.blurB.height);
    gl.bindTexture(gl.TEXTURE_2D, this.blurA.texture);
    gl.uniform2f(dirLoc, 0, 1 / this.blurB.height);
    drawFullscreen(gl);

    this.bloomDirty = false;
  }

  /** Render the composite pass to the default framebuffer. */
  render(canvasWidth: number, canvasHeight: number, state: CompositeState): void {
    const gl = this.gl;
    if (this.bloomDirty) this.runBloomChain();

    gl.bindVertexArray(this.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    gl.useProgram(this.compositeProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.blurB.texture);

    const u = (name: string) => gl.getUniformLocation(this.compositeProgram, name);
    gl.uniform1i(u("uScene"), 0);
    gl.uniform1i(u("uBloom"), 1);
    gl.uniform2f(u("uResolution"), canvasWidth, canvasHeight);
    gl.uniform1f(u("uTime"), state.time);
    gl.uniform1f(u("uRows"), state.rows);
    gl.uniform3f(u("uPhosphor"), ...state.phosphor);
    gl.uniform2f(u("uCursorCell"), ...state.cursorCell);
    gl.uniform2f(u("uCellSize"), ...state.cellSize);
    const p = state.params;
    gl.uniform1f(u("uCurvature"), p.curvature);
    gl.uniform1f(u("uAberration"), p.aberration);
    gl.uniform1f(u("uGlow"), p.glow);
    gl.uniform1f(u("uScanline"), p.scanline);
    gl.uniform1f(u("uNoise"), p.noise);
    gl.uniform1f(u("uVignette"), p.vignette);
    gl.uniform1f(u("uFlicker"), p.flicker);
    gl.uniform1f(u("uTint"), p.tintAmount);

    drawFullscreen(gl);
  }
}
