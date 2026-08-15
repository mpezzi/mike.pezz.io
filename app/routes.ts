import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("blog", "routes/blog-index.tsx"),
  route("blog/:slug", "routes/blog-post.tsx"),
  route("work", "routes/work-index.tsx"),
  route("work/:slug", "routes/work-detail.tsx"),
  route("contact", "routes/contact.tsx"),
  route("settings", "routes/settings.tsx"),
  route("404", "routes/not-found.tsx", { id: "not-found-page" }),
  route("*", "routes/not-found.tsx", { id: "not-found-splat" }),
] satisfies RouteConfig;
