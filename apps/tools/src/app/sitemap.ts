import type { MetadataRoute } from "next";
import { RESIZER_EXAMS } from "@/lib/resizerExams";
import { AGE_ELIGIBILITY_EXAMS } from "@/lib/ageEligibility";

// This app is a separate static export/deployment from apps/landing (see
// "apps/tools deployment" in the root CLAUDE.md) and was never wired into
// landing's own sitemap.xml, so none of these ~450 pages had a sitemap entry
// at all — Google could only find them by crawling links, which barely
// exist site-wide either. Emitting our own sitemap.xml here (served at
// /tools/sitemap.xml through the Worker's now-broad /tools/* route) and
// listing it in apps/landing's robots.ts closes that gap without landing
// needing to import this app's exam data.
//
// output: "export" in next.config.ts makes this run at build time only —
// lastModified is fixed at build time, not per-request.
export const dynamic = "force-static";

const BASE = "https://clearcutoff.in";
const BUILD_DATE = new Date();

const RESIZER_STATIC_SLUGS = ["image-compressor", "signature-compressor", "75-face-coverage", "add-name-date"];

function entry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]): MetadataRoute.Sitemap[number] {
  return { url: `${BASE}${path}`, lastModified: BUILD_DATE, changeFrequency, priority };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    entry("/tools", 0.8, "monthly"),
    entry("/tools/resizer", 0.8, "weekly"),
    entry("/hi/tools/resizer", 0.7, "weekly"),
    entry("/tools/age-eligibility-calculator", 0.9, "weekly"),
    entry("/hi/tools/age-eligibility-calculator", 0.8, "weekly"),
    entry("/tools/age-eligibility-calculator/all", 0.8, "weekly"),
    entry("/hi/tools/age-eligibility-calculator/all", 0.7, "weekly"),
  ];

  for (const slug of RESIZER_STATIC_SLUGS) {
    entries.push(entry(`/tools/resizer/${slug}`, 0.6, "monthly"));
    entries.push(entry(`/hi/tools/resizer/${slug}`, 0.5, "monthly"));
  }

  for (const exam of RESIZER_EXAMS) {
    entries.push(entry(`/tools/resizer/${exam.slug}`, 0.7, "weekly"));
    entries.push(entry(`/hi/tools/resizer/${exam.slug}`, 0.6, "weekly"));
  }

  for (const exam of AGE_ELIGIBILITY_EXAMS) {
    entries.push(entry(`/tools/age-eligibility-calculator/${exam.slug}`, 0.8, "weekly"));
    entries.push(entry(`/hi/tools/age-eligibility-calculator/${exam.slug}`, 0.7, "weekly"));
  }

  return entries;
}
