import { MetadataRoute } from "next";
import { courses } from "@/lib/data/courses";

// Revalidate the sitemap once per day — prevents it from being regenerated on
// every request, which would cause lastModified to change constantly.
export const revalidate = 86400;

const BASE_URL = "https://clearcutoff.in";

// Bump this date whenever a significant content or structural change is deployed.
const SITE_LAST_UPDATED = new Date("2026-05-26");

// ─── Exam marketing page slugs (pre-rendered via generateStaticParams) ────────
const EXAM_MARKETING_SLUGS = [
  "htet-2026",
  "reet-2026",
  "uptet-2026",
  "hptet-2026",
];

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
): SitemapEntry {
  const url = `${BASE_URL}${path}`;
  return {
    url,
    lastModified: lastModified ?? SITE_LAST_UPDATED,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        "en": url,
        "hi": `${BASE_URL}/hi${path}`,
        "x-default": url,       // canonical = English
      },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  // ── 1. Static core pages ───────────────────────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = [
    entry("/",          1.0, "weekly"),
    entry("/teaching",  0.9, "weekly"),
    entry("/faq",       0.7, "weekly"),
    entry("/contact-us", 0.5, "monthly"),
    entry("/privacy-policy",       0.3, "yearly", new Date("2024-01-01")),
    entry("/terms-and-conditions", 0.3, "yearly", new Date("2024-01-01")),
    entry("/refund-policy",        0.3, "yearly", new Date("2024-01-01")),
  ];

  // ── 2. Teaching / course pages ────────────────────────────────────────────
  const courseEntries: MetadataRoute.Sitemap = courses
    .filter((c) => !EXCLUDED_COURSE_SLUGS.has(c.slug))
    .map((c) => entry(`/teaching/${c.slug}`, 0.8, "monthly"));

  // ── 3. Exam marketing landing pages ───────────────────────────────────────
  const examEntries: MetadataRoute.Sitemap = EXAM_MARKETING_SLUGS.map((slug) =>
    entry(`/exam/${slug}`, 0.7, "monthly"),
  );

  return [...staticEntries, ...courseEntries, ...examEntries];
}
