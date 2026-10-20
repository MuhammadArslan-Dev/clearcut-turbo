import { buildExamChaptersSitemapXml } from "@/lib/sitemap/exam-sitemaps";
import { sitemapUnavailable, xmlResponse } from "@/lib/sitemap/xml";

// Kept at its original URL (already listed in the sitemap index). It used to
// list every /question/<slug>-<id> URL; those now 301 to their chapter page,
// so it lists the canonical chapter pages instead.
//
// No `revalidate` export on purpose: with one, this was pre-rendered during
// `next build` (the slowest build step), and a backend failure at that moment
// would have been baked in. Rendered on request; the backend reads underneath
// are still cached (see load-exam-index.ts).
export async function GET() {
  try {
    return xmlResponse(await buildExamChaptersSitemapXml("ctet"));
  } catch (error) {
    console.error("ctet-questions sitemap generation failed:", error);
    return sitemapUnavailable();
  }
}
