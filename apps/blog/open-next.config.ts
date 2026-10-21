import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// The blog runs on the Workers Free plan: 10 ms of CPU per request. Rendering a
// question-bank page (markdown, raw-HTML parsing, sanitizing and KaTeX for up
// to 50 questions) costs 0.3–2 s of CPU, so a page must never be rendered while
// a visitor or crawler waits. Every page is therefore rendered at BUILD time
// (generateStaticParams lists all of them; nothing uses time-based ISR) and the
// Worker only serves stored results. docs/phases/14-blog-worker-limit.md.
//
// Lookup order:
//  1. Workers static assets — every page prerendered by `next build`, shipped
//     with the deploy (the workflow copies .open-next/cache into
//     .open-next/assets/cdn-cgi/_next_cache). Read-only; free and unmetered.
//  2. R2 — a page that was NOT prerendered (a URL added after the last build)
//     is rendered once on request and stored here, so it is not rendered again
//     until the next build. Keys include the build id, so a rebuild starts clean.
// Writes always go to R2 (static assets are read-only).
type Cache = typeof r2IncrementalCache;

const prerenderedThenR2: Cache = {
  name: "prerendered-then-r2",
  async get(key, cacheType) {
    // The static-assets cache throws for "composable" entries ("use cache"),
    // which this app does not use; let R2 handle them anyway.
    if (cacheType !== "composable") {
      const prerendered = await staticAssetsIncrementalCache.get(key, cacheType);
      if (prerendered?.value) return prerendered;
    }
    return r2IncrementalCache.get(key, cacheType);
  },
  set: (key, value, cacheType) => r2IncrementalCache.set(key, value, cacheType),
  delete: (key) => r2IncrementalCache.delete(key),
} as Cache;

export default defineCloudflareConfig({
  incrementalCache: prerenderedThenR2,
  // Serve stored pages straight from the cache, without loading the Next.js
  // server or the page's JavaScript. Without it, cached requests cost
  // 1–16 ms of CPU on the live Worker (2026-10-21), too close to the 10 ms
  // limit. Not compatible with PPR, which this app does not use.
  enableCacheInterception: true,
  // No queue and no tag cache: there is no time-based ISR to queue, and
  // content updates arrive by rebuilding (POST /api/revalidate triggers the
  // deploy workflow), not by revalidating inside the Worker.
});
