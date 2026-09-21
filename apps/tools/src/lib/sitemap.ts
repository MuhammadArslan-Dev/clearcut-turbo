import type { MetadataRoute } from "next";
import { getResizerCategories, getResizerExams } from "./resizerExams";
import { getAgeEligibilityExams } from "./ageEligibility";
import { SEO_LOCALES, SeoLocale, alternatesFor, toolsUrl } from "./seo";

/**
 * Sitemap architecture (see apps/tools/SEO.md):
 *
 *   https://clearcutoff.in/sitemap-tools.xml      <- ONE index; the only URL to submit
 *     ├─ /tools/sitemap/<section>.xml              English
 *     ├─ /hi/tools/sitemap/<section>.xml           Hindi
 *     └─ /mr/tools/sitemap/<section>.xml           Marathi
 *
 * Split by page TYPE (section) as well as by language so Google Search
 * Console reports indexing coverage per section — e.g. "are the 114 resizer
 * exam pages indexed?" is one row instead of being lost in a 640-URL file.
 * The index sits at the origin root (served by the Worker, see
 * apps/tools/worker) because a sitemap only covers URLs at or below its own
 * directory: from the root, all three language trees are legitimately in scope.
 *
 * Every entry is a canonical, indexable URL built by the same helpers as the
 * page's <link rel="canonical"> and carries the full reciprocal hreflang set
 * (xhtml:link, incl. x-default). No <priority>/<changefreq> (Google ignores
 * both) and no <lastmod> (a build date on every URL is not "consistently and
 * verifiably accurate", so Google would discard it) — add lastModified only
 * when a real per-page content date exists.
 */
export const SITEMAP_SECTIONS = ["core", "resizer-exams", "resizer-categories", "age-calculators"] as const;
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

export function isSitemapSection(id: string): id is SitemapSection {
  return (SITEMAP_SECTIONS as readonly string[]).includes(id);
}

// The tool pages that exist as their own route (not generated from backend data).
const RESIZER_STATIC_SLUGS = ["image-compressor", "signature-compressor", "75-face-coverage", "add-name-date"];

async function pathsFor(section: SitemapSection): Promise<string[]> {
  switch (section) {
    case "core":
      return [
        "/resizer",
        ...RESIZER_STATIC_SLUGS.map((slug) => `/resizer/${slug}`),
        "/age-eligibility-calculator",
        "/age-eligibility-calculator/all",
        "/syllabus-tracker",
      ];
    case "resizer-exams":
      return (await getResizerExams()).map((exam) => `/resizer/${exam.slug}`);
    case "resizer-categories":
      return (await getResizerCategories()).map((category) => `/resizer/${category.slug}`);
    case "age-calculators":
      return (await getAgeEligibilityExams()).map((exam) => `/age-eligibility-calculator/${exam.slug}`);
  }
}

/** Entries of one sitemap file: one section in one language. */
export async function buildSitemap(locale: SeoLocale, section: SitemapSection): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = (await pathsFor(section)).map((path) => ({
    url: toolsUrl(locale, path),
    alternates: { languages: alternatesFor(locale, path).languages },
  }));

  // The tools index (/tools) is a single English page rendered by the Worker
  // itself; it has no hi/mr counterpart, so it has no alternates.
  if (section === "core" && locale === "en") entries.unshift({ url: toolsUrl("en") });

  return entries;
}

/** Public URL of one sitemap file (what the index lists). */
export function sitemapFileUrl(locale: SeoLocale, section: SitemapSection): string {
  return `${toolsUrl(locale)}/sitemap/${section}.xml`;
}

/** Every sitemap file of the app, in a stable order: language first, then section. */
export function allSitemapFileUrls(): string[] {
  return SEO_LOCALES.flatMap((locale) => SITEMAP_SECTIONS.map((section) => sitemapFileUrl(locale, section)));
}
