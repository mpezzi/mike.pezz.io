import type { Config } from "@react-router/dev/config";
import { getAllSlugs } from "./app/content/slugs";

export default {
  ssr: false,
  async prerender() {
    const { blog, work } = await getAllSlugs();
    return [
      "/",
      "/blog",
      "/work",
      "/contact",
      "/settings",
      "/404",
      ...blog.map((s) => `/blog/${s}`),
      ...work.map((s) => `/work/${s}`),
    ];
  },
} satisfies Config;
