import { NextConfig } from "next";

// Standalone, deliberately minimal: no CMS, no auth, no backend calls —
// everything runs in the browser — so this can be a plain static export
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
  }),
};

export default config;
