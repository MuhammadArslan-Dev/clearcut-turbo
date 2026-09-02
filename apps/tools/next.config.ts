import { NextConfig } from "next";

// Standalone, deliberately minimal: this app is ONLY the photo/signature
// resizer tool (no CMS, no auth, no backend calls — everything runs in the
// browser), so it can be a plain static export deployed to Cloudflare Pages
// independently of apps/landing, which keeps running on its own VPS
// deployment untouched. A Cloudflare Worker in front of clearcutoff.in
// routes /tools/resizer/* to this app's Pages deployment and leaves every
// other path alone — same pattern as the separate Astro repo's /go/* Worker
// (Astro-marketing-clearcut/apps/go-marketing/worker).
const config: NextConfig = {
  output: "export",

  // Public URL is clearcutoff.in/tools/resizer/* — basePath makes Next
  // itself emit the build under that path (dist/tools/resizer/index.html,
  // etc.) and prefix every internal link/asset URL to match, so the
  // fronting Worker can forward requests through unchanged with no path
  // rewriting needed.
  basePath: "/tools/resizer",
  trailingSlash: false,
};

export default config;
