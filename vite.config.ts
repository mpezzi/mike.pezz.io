import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { mdxPlugin } from "./config/mdx-plugin.ts";

export default defineConfig({
  plugins: [mdxPlugin(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
