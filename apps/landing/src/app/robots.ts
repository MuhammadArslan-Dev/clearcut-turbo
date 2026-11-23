import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/teaching/*/questions",  // onboarding flow — not indexable content
          "/account-delete",        // utility page
          "/api/",                  // API routes
          // No "/_next/" (phase 125): it blocked /_next/static CSS/JS, so
          // Google rendered every landing page without its styles/scripts.
        ],
      },
      {
        // Block AI training crawlers that don't respect content usage terms
        // from the paid exam-prep content, but explicitly carve out
        // /tools/* — the free, no-login calculator/resizer tools deployed
        // separately under apps/tools — since those pages exist specifically
        // to be found and cited by AI answer engines (ChatGPT, Perplexity,
        // Google AI Overviews). robots.txt is one file for the whole
        // clearcutoff.in origin, so this app's rules govern /tools/* too
        // even though it's a different deployment.
        // NOTE: userAgent was previously an empty array, which emitted a bare
        // `Disallow: /` group with no User-Agent — parsers/Googlebot could read
        // that as disallowing the entire site (de-indexing everything). It is
        // now scoped to named AI crawlers so the rest of the site stays fully
        // indexable by everyone else.
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "CCBot",
          "Google-Extended",
          "anthropic-ai",
          "ClaudeBot",
          "PerplexityBot",
          "Bytespider",
        ],
        allow: ["/tools/", "/hi/tools/", "/mr/tools/"],
        disallow: "/",
      },
    ],
    sitemap: [
      "https://clearcutoff.in/sitemap.xml",
      // No /go/sitemap.xml (phase 125): the Astro /go app has no sitemap (that
      // URL is an HTML redirect page), and its /go/exam/* ad landing pages are
      // noindex duplicates of /exam/* — nothing there to submit.
      // apps/tools: ONE index (served by the Cloudflare Worker at the origin root) that lists the
      // per-language, per-section sitemaps under /tools, /hi/tools and /mr/tools — see apps/tools/SEO.md.
      "https://clearcutoff.in/sitemap-tools.xml",
    ],
    host: "https://clearcutoff.in",
  };
}
