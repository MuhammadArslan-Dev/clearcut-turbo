import type { MetadataRoute } from "next";
import { getResizerCategories, getResizerExams } from "./resizerExams";
import { getAgeEligibilityExams } from "./ageEligibility";
import { SeoLocale, alternatesFor, toolsUrl } from "./seo";

// The tool pages that exist as their own route (not generated from backend data).
const RESIZER_STATIC_SLUGS = ["image-compressor", "signature-compressor", "75-face-coverage", "add-name-date"];

/**
 * Sitemap entries for ONE locale. Every entry is a canonical, indexable URL
 * (same helper as the page's <link rel="canonical">) carrying the full
 * reciprocal hreflang set via xhtml:link.
 *
 * Deliberately no <priority>/<changefreq> (Google ignores both) and no
 * <lastmod>: the pages are static exports rebuilt as a whole, so a
 * build-time date on every URL would not be "consistently and verifiably
 * accurate" — Google uses lastmod only when it is, and otherwise discards it.
 *
 * Three files instead of one because a sitemap only covers URLs at or below
 * its own directory: /tools/sitemap.xml lists /tools/**, and the Hindi and
 * Marathi trees (/hi/tools/**, /mr/tools/**) get their own sitemaps at the
 * matching path. All three are referenced from robots.txt (apps/landing).
 */
export async function buildSitemap(locale: SeoLocale): Promise<MetadataRoute.Sitemap> {
  const [exams, categories, ageExams] = await Promise.all([
    getResizerExams(),
    getResizerCategories(),
    getAgeEligibilityExams(),
  ]);

  const paths = [
    "/resizer",
    ...RESIZER_STATIC_SLUGS.map((slug) => `/resizer/${slug}`),
    ...exams.map((exam) => `/resizer/${exam.slug}`),
    ...categories.map((category) => `/resizer/${category.slug}`),
    "/age-eligibility-calculator",
    "/age-eligibility-calculator/all",
    ...ageExams.map((exam) => `/age-eligibility-calculator/${exam.slug}`),
    "/syllabus-tracker",
  ];

  const entries: MetadataRoute.Sitemap = paths.map((path) => ({
    url: toolsUrl(locale, path),
    alternates: { languages: alternatesFor(locale, path).languages },
  }));

  // The tools index (/tools) is a single English page served by the Worker
  // itself; it has no hi/mr counterpart, so no alternates.
  if (locale === "en") entries.unshift({ url: toolsUrl("en") });

  return entries;
}
