import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { mdxPlugin } from "./config/mdx-plugin.ts";

export default defineConfig({
  plugins: [mdxPlugin(), react()],
  resolve: {
    alias: {
      "~": new URL("./app", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./app/test/setup.ts"],
    include: ["app/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["app/shell/**", "app/themes/**", "app/screen/**", "app/effects/**"],
      thresholds: {
        "app/shell/**": { statements: 90, branches: 85, functions: 90, lines: 90 },
        "app/themes/**": { statements: 90, branches: 85, functions: 90, lines: 90 },
      },
    },
  },
});
