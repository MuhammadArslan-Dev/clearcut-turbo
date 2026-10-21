import { buildExamChaptersSitemapXml } from "@/lib/sitemap/exam-sitemaps";
import { sitemapUnavailable, xmlResponse } from "@/lib/sitemap/xml";
import { IS_PRERENDER_BUILD } from "@/lib/build/prerender";

// Kept at its original URL (already listed in the sitemap index). It used to
// list every /question/<slug>-<id> URL; those now 301 to their chapter page,
// so it lists the canonical chapter pages instead.
//
// Prerendered at build time (Workers Free plan: building it on request ran
// over the 10 ms CPU limit and answered 503). A backend failure during the
// build fails the build instead of being stored (lib/build/prerender.ts).
export const dynamic = "force-static";

export async function GET() {
  try {
    return xmlResponse(await buildExamChaptersSitemapXml("ctet"));
  } catch (error) {
    if (IS_PRERENDER_BUILD) throw error;
    console.error("ctet-questions sitemap generation failed:", error);
    return sitemapUnavailable();
  }
}
