export type SitemapEntry = { loc: string; lastmod?: string };

// Sitemap protocol limits per file: 50,000 URLs and 50MB uncompressed.
export const MAX_SITEMAP_URLS = 50000;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Absolute site origin without a trailing slash (NEXT_PUBLIC_SITE_URL). */
export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
}

/** Drops duplicate locs (first wins) and throws past the protocol limit
 * rather than silently truncating. */
export function urlsetXml(entries: SitemapEntry[]): string {
  const seen = new Set<string>();
  const unique = entries.filter((e) => !seen.has(e.loc) && seen.add(e.loc));
  if (unique.length > MAX_SITEMAP_URLS) {
    throw new Error(`sitemap has ${unique.length} URLs, over the ${MAX_SITEMAP_URLS} limit`);
  }
  const body = unique
    .map((e) =>
      e.lastmod
        ? `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n    <lastmod>${escapeXml(e.lastmod)}</lastmod>\n  </url>`
        : `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function sitemapIndexXml(locs: string[]): string {
  const body = locs.map((loc) => `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n  </sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

/** A failed or partial build must never be served as a valid (shorter)
 * sitemap — a 503 tells crawlers to come back later instead. */
export function sitemapUnavailable(): Response {
  return new Response("Sitemap temporarily unavailable", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "600", "Cache-Control": "no-store" },
  });
}

/** English URL only, for pages whose /hi copy shows the same (untranslated)
 * main content and canonicalizes to English — see lib/seo/locale-alternates. */
export function englishOnly(origin: string, paths: string[], lastmod?: string): SitemapEntry[] {
  return paths.map((p) => ({ loc: `${origin}${p === "/" ? "" : p}` || `${origin}/`, lastmod }));
}

/** en URL followed by its /hi twin, for each site-relative path. Only for
 * pages with genuinely Hindi main content on /hi. */
export function withLocales(origin: string, paths: string[], lastmod?: string): SitemapEntry[] {
  return paths.flatMap((p) => {
    const path = p === "/" ? "" : p;
    return [
      { loc: `${origin}${path}` || `${origin}/`, lastmod },
      { loc: `${origin}/hi${path}`, lastmod },
    ];
  });
}
