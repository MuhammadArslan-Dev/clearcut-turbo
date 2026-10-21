import { blogServerKey } from "./blog-server-key";

// Headers for the blog server's own reads of the backend's /api/blog/*
// routes. The key (blog-server-key.ts) identifies them to the backend, which
// then rate limits them in their own bucket instead of the per-IP 60/min
// shared by all requests from the blog's few egress IPs (backend
// RouteServiceProvider). Server-only: blog-server-key.ts can't be bundled for
// the browser, and the header is only added on the server.

export const BLOG_SERVER_KEY_HEADER = "X-Blog-Server-Key";

export function backendServerHeaders(): Record<string, string> {
  if (typeof window !== "undefined") return {};
  const key = blogServerKey();
  return key ? { [BLOG_SERVER_KEY_HEADER]: key } : {};
}
