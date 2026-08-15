import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// jsdom's canvas getContext is "not implemented" and logs loudly; the app
// only probes it for WebGL capability, so a quiet null is the right answer.
if (typeof HTMLCanvasElement !== "undefined") {
  const nullContext: typeof HTMLCanvasElement.prototype.getContext = () => null;
  HTMLCanvasElement.prototype.getContext = nullContext;
}

// jsdom lacks matchMedia; the app queries color-scheme and reduced-motion.
if (typeof window !== "undefined" && !window.matchMedia) {
  const stub = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
  window.matchMedia = stub;
}
