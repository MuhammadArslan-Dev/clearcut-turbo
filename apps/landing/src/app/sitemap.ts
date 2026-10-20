import { MetadataRoute } from "next";
import { courses } from "@/lib/data/courses";
import { hreflangAlternates } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/i18n/config";
import { CHECKED_ON, HTET_PAGE_KEYS } from "@/lib/data/htetInfo";

// Revalidate the sitemap once per day — prevents it from being regenerated on
// every request, which would cause lastModified to change constantly.
export const revalidate = 86400;

const BASE_URL = "https://clearcutoff.in";

// Bump this date whenever a significant content or structural change is deployed.
const SITE_LAST_UPDATED = new Date("2026-05-26");

// ─── Exam marketing page slugs (pre-rendered via generateStaticParams) ────────
// The pages live at /exam/<code>-preparation; the old /exam/<code>-2026 URLs
// listed here before 301 to them (next.config.ts), and a sitemap should only
// list the final, indexable URL.
const EXAM_MARKETING_SLUGS = [
  "htet-preparation",
  "reet-preparation",
  "uptet-preparation",
  "hptet-preparation",
];

// Pages whose main content is English on every locale (their /hi and /mr
// URLs render the same English copy), so they get no hreflang alternates.
const ENGLISH_ONLY: readonly Locale[] = ["en"];
// The FAQ comes from the CMS, which has Hindi but no Marathi copy.
const EN_HI: readonly Locale[] = ["en", "hi"];

// ─── Exclude internal A/B test variants to prevent duplicate-content penalty ──
const EXCLUDED_COURSE_SLUGS = new Set([
  "htet-v1",
  "ctet-v1",
  "hptet-v1",
  "uptet-v1",
  "reet-v1",
]);

type SitemapEntry = MetadataRoute.Sitemap[number];

function entry(
  path: string,
  priority: number,
  changeFrequency: SitemapEntry["changeFrequency"],
  lastModified?: Date,
  // Locales the page is really translated into (default: all). Same hreflang
  // set the page itself declares — see hreflangAlternates.
  languages?: readonly Locale[],
): SitemapEntry {
  const url = `${BASE_URL}${path}`;
  const hreflang = hreflangAlternates(path, languages);
  return {
    url,
    lastModified: lastModified ?? SITE_LAST_UPDATED,
    changeFrequency,
    priority,
    ...(hreflang ? { alternates: { languages: hreflang } } : {}),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  // ── 1. Static core pages ───────────────────────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = [
    entry("/",          1.0, "weekly"),
    entry("/teaching",  0.9, "weekly"),
    entry("/faq",       0.7, "weekly", undefined, EN_HI),
    entry("/android-app", 0.7, "monthly"),
    entry("/ios-app",     0.7, "monthly"),
    entry("/contact-us", 0.5, "monthly", undefined, ENGLISH_ONLY),
    entry("/privacy-policy",       0.3, "yearly", new Date("2024-01-01"), ENGLISH_ONLY),
    entry("/terms-and-conditions", 0.3, "yearly", new Date("2024-01-01"), ENGLISH_ONLY),
    entry("/refund-policy",        0.3, "yearly", new Date("2024-01-01"), ENGLISH_ONLY),
  ];

  // ── 2. Teaching / course pages ────────────────────────────────────────────
  const courseEntries: MetadataRoute.Sitemap = courses
    .filter((c) => !EXCLUDED_COURSE_SLUGS.has(c.slug))
    .map((c) => entry(`/teaching/${c.slug}`, 0.8, "monthly"));

  // ── 3. Exam marketing landing pages ───────────────────────────────────────
  const examEntries: MetadataRoute.Sitemap = EXAM_MARKETING_SLUGS.map((slug) =>
    entry(`/exam/${slug}`, 0.7, "monthly"),
  );

  // ── 4. HTET information pages (translated in every locale) ───────────────
  const htetEntries: MetadataRoute.Sitemap = HTET_PAGE_KEYS.map((key) =>
    entry(`/htet/${key}`, 0.7, "monthly", new Date(CHECKED_ON)),
  );

  return [...staticEntries, ...courseEntries, ...examEntries, ...htetEntries];
}
