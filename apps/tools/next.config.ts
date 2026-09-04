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
};

export default config;
