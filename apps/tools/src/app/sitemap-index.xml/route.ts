import { allSitemapFileUrls } from "@/lib/sitemap";

// Master sitemap index — the single sitemap URL to submit (Search Console,
// Bing) and to list in robots.txt. Physically out/sitemap-index.xml; the
// Worker also serves it at the origin root as
// https://clearcutoff.in/sitemap-tools.xml (apps/tools/worker). Listing the
// per-language, per-section files here (instead of a flat file per language)
// gives per-section indexing coverage in Search Console.
export const dynamic = "force-static";

export function GET() {
  const entries = allSitemapFileUrls()
    .map((loc) => `  <sitemap>\n    <loc>${loc}</loc>\n  </sitemap>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
