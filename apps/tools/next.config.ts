import { NextConfig } from "next";

// Standalone, deliberately minimal: no CMS, no dashboard handoff — everything
// runs in the browser (the Syllabus Tracker's public syllabus reads and its
// optional login-to-save are the only runtime backend calls, see CLAUDE.md's
// "Tools: Save for Future") — so this can be a plain static export
// deployed to Cloudflare Pages independently of apps/landing, which keeps
// running on its own VPS deployment untouched. A Cloudflare Worker in front
// of clearcutoff.in routes /tools/* to this app's Pages deployment and
// leaves every other path alone — same pattern as the separate Astro repo's
// /go/* Worker (Astro-marketing-clearcut/apps/go-marketing/worker).
//
// Two tools live here now (the photo/signature resizer at /tools/resizer,
// the age eligibility calculator at /tools/age-eligibility-calculator),
// each as its own top-level route folder under src/app/ — basePath only
// covers the shared "/tools" prefix; each tool's own folder name supplies
// the rest of its public path.
const config: NextConfig = {
  output: "export",

  // basePath makes Next itself emit the build under this path and prefix
  // every internal link/asset URL to match, so the fronting Worker can
  // forward requests through unchanged with no path rewriting needed.
  basePath: "/tools",
  trailingSlash: false,

  // Production only: serve the hashed JS/CSS (/_next/static/*) straight from
  // the Pages deployment instead of through the clearcutoff.in/tools/* Worker.
  // Every request that passes the Worker route counts against the Workers
  // free plan's 100,000/day limit, and one page view loads 10-20 chunks, so
  // this was most of the Worker's traffic (118.9k in one day, 2026-11-02).
  // Pages static requests are free and unlimited. assetPrefix replaces
  // basePath for these assets only: pages, public/ files (favicon, og images)
  // and links still go through "/tools" and the Worker as before. out/ keeps
  // _next/static at its root, so https://<pages>/_next/static/... resolves.
  // Override with TOOLS_ASSET_PREFIX (set it empty to turn this off).
  ...(process.env.NODE_ENV === "production" && {
    assetPrefix: process.env.TOOLS_ASSET_PREFIX ?? "https://clearcut-tools.pages.dev",
  }),

  // Dev-only: `next build` errors if `output: "export"` and `rewrites` are
  // both present, so this never reaches the production static export — it
  // only runs under `next dev`, which always has a real server regardless
  // of `output` and ignores that restriction. Without it, a hard refresh on
  // a Syllabus Tracker deep link (/syllabus-tracker/htet/level-1-prt, or the
  // Hindi/Marathi equivalents) 404s locally, because that path is never a
  // real Next route (see the comment atop src/app/syllabus-tracker/page.tsx)
  // — only public/_redirects supplies the equivalent fallback, and
  // Cloudflare Pages is the only thing that reads that file.
  ...(process.env.NODE_ENV !== "production" && {
    async rewrites() {
      return [
        { source: "/syllabus-tracker/:path*", destination: "/syllabus-tracker" },
        { source: "/hi/syllabus-tracker/:path*", destination: "/hi/syllabus-tracker" },
        { source: "/mr/syllabus-tracker/:path*", destination: "/mr/syllabus-tracker" },
      ];
    },
    // The rewrites above cover this app's OWN basePath-prefixed shape
    // (/tools/hi/syllabus-tracker/..., matching what `next dev` serves
    // directly). The real PRODUCTION public URL is locale-OUTERMOST instead
    // (/hi/tools/syllabus-tracker/..., see syllabusTrackerUrl.ts's
    // rootPath) — in prod the Cloudflare Worker strips that "/hi/tools"
    // prefix and proxies to Pages before Next ever sees the request, so
    // pasting that exact URL locally has nothing to match without this.
    // Can't be a `rewrites` rule: Next hard-rejects a `basePath: false`
    // rewrite whose destination isn't an absolute http(s) URL (it won't
    // internally dispatch a path outside basePath to one inside it), and an
    // absolute destination would mean hardcoding this dev server's own
    // host:port. A redirect has no such restriction — it just tells the
    // BROWSER to re-request the basePath-prefixed equivalent, which "next
    // dev" then serves normally. readSlugFromLocation() accepts either URL
    // shape when restoring state, so this still lands on the exact same
    // selection either way.
    async redirects() {
      return [
        {
          source: "/hi/tools/syllabus-tracker/:path*",
          destination: "/tools/hi/syllabus-tracker/:path*",
          basePath: false,
          permanent: false,
        },
        {
          source: "/mr/tools/syllabus-tracker/:path*",
          destination: "/tools/mr/syllabus-tracker/:path*",
          basePath: false,
          permanent: false,
        },
      ];
    },
  }),
};

export default config;
