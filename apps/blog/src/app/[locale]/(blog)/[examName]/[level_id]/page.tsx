import React from "react";
import { Metadata } from "next";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import TestByYears from "@/components/blog/assessment-question/test-by-years";
import TestBySubjects from "@/components/blog/assessment-question/test-by-subjects";
import { notFound } from "next/navigation";
import { findLevel } from "@/lib/seo/exam-index";
import { tryLoadExamIndex } from "@/lib/seo/load-exam-index";
import { unFormatSlug } from "@/utils/slugify";
import { getTranslations } from "next-intl/server";
import { hubMetadata } from "@/lib/seo/hub-metadata";
import { localeOrigin, pageCopy } from "@/components/question-bank/pages/page-copy";
import MainContainer from "@/components/main-container";
import CustomizableHeader from "@/components/customizable-header";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import JsonLd from "@clearcut/ui/json-ld";
import { apiFetch } from "@/lib/api/api2";
import { ALLOWED_EXAMS } from "@/lib/exams";

/* =========================================================
   TYPES (Next.js 15/16)
========================================================= */

type Props = {
  params: Promise<{
    locale: string;
    examName: string;
    level_id?: string;
  }>;
};

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, examName, level_id } = await params;
  // /hi shows Hindi headings and copy: its own page (lib/seo/hub-metadata).
  return hubMetadata({ locale, kind: "level", exam: examName ?? "", level: level_id ?? "" });
}

// Cached and regenerated in the background like the question-bank pages
// (lib/question-bank/route-cache.ts): no per-request render for crawlers,
// and a failed regeneration keeps the last good page.
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

/* =========================================================
   HELPERS
========================================================= */

/**
 * Reads a public list endpoint through the Data Cache.
 *
 * This used to take a `RequestCache` and was called with two DIFFERENT modes
 * for two reads on the same page — `"force-cache"` for years and
 * `"no-store"` for subjects. The `no-store` one silently opted the whole
 * route out of the full route cache, so every request re-rendered the page
 * and re-fetched BOTH lists. Neither list is request-specific.
 *
 * It now takes a revalidate window instead. `force-cache` was also not the
 * right tool: it caches forever with no revalidation, so the years list could
 * go stale indefinitely. A time window is both fresher than `force-cache` and
 * far cheaper than `no-store`.
 */
// Throws on failure (phase 125): with ISR a page rendered from a failed read
// would be cached without its subject and year links for an hour; a thrown
// render keeps the last good page instead.
async function cachedFetch(url: string, revalidate = 3600) {
  const data = await apiFetch(url, { revalidate });
  if (!data) throw new Error(`level page data unavailable: ${url}`);
  return data;
}

/* =========================================================
   PAGE
========================================================= */

export default async function Page({ params }: Props) {
  const { locale, examName: examSlug, level_id } = await params;

  /* ---------- Validate Exam ---------- */

  if (!ALLOWED_EXAMS.includes(examSlug?.toLowerCase())) {
    notFound();
  }

  /* ---------- Build API URLs ---------- */

  const yearsUrl = `/blog/get-years?exam_id=${examSlug}`;

  // The level's subjects, with their real slugs — the same list the
  // /<level>/subject page shows. (This used to read get-sections with a
  // ?levels= query param no link ever set, so it always came back empty and
  // the level page had no links to its subject pages at all.)
  const subjectsUrl =
    `/blog/get-subject?exam_id=${encodeURIComponent(examSlug)}&slug=${encodeURIComponent(String(level_id ?? ""))}`;

  /* ---------- Fetch Data ---------- */

  // Started together with the exam index check (they don't depend on it).
  // The no-op catch only keeps an early notFound() from leaving an unhandled
  // rejection; awaiting it below still throws.
  const dataPromise = Promise.all([cachedFetch(yearsUrl), cachedFetch(subjectsUrl), pageCopy(locale), getTranslations({ locale, namespace: "HubPage" })]);
  dataPromise.catch(() => {});

  const index = await tryLoadExamIndex(String(examSlug));
  if (index && !findLevel(index, String(level_id))) notFound();

  const examName = unFormatSlug(examSlug).toUpperCase();
  const levelName = unFormatSlug(level_id ?? "");

  const [dataYears, dataSubjects, t, tHub] = await dataPromise;
  // get-subject can list one slug twice (HTET "mathematics"); one link each.
  const seenSubjects = new Set<string>();
  const subjects = (Array.isArray(dataSubjects?.data) ? dataSubjects.data : [])
    // No slug = no page (a link would be /subject/null).
    .filter((s: { slug?: string | null }) => s?.slug && s.slug !== "null" && !seenSubjects.has(s.slug) && seenSubjects.add(s.slug))
    .map((s: { slug: string; name?: string }) => ({ sections: { name: s.name ?? unFormatSlug(s.slug), slug: s.slug } }));

  // if (
  //   (!dataYears?.data || dataYears.data.length === 0) &&
  //   (!dataSubjects?.data || dataSubjects.data.length === 0)
  // ) {
  //   return notFound();
  // }

  /* ---------- Breadcrumbs ---------- */

  // On the visitor's language site (/hi links to /hi).
  const siteUrl = localeOrigin(locale);

  const breadcrumbItems = [
    { name: t("home"), url: siteUrl || "/" },
    { name: examName, url: `${siteUrl}/${examSlug}` },
    {
      name: levelName,
      url: `${siteUrl}/${examSlug}/${level_id}`,
    },
  ];

  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);

  /* ---------- Render ---------- */

  return (
    <div>
      <JsonLd data={breadcrumbLd} />

      <MainContainer
        maxWidth="max-w-[900px]"
        padding="py-4"
        bgColor="bg-[#f8fafc]"
      >
        <div className="px-3">
          <CustomBreadcrumbs
            padding="0px 4px 20px 4px"
            isShow
            items={breadcrumbItems}
          />
        </div>

        <div className="space-y-6">
          <div className="px-3">
            <CustomizableHeader
              showEyebrow={false}
              heading={tHub("levelHeading", { exam: examName, level: levelName })}
              highlightText={examName}
              subheading={tHub("levelSubheading", { exam: examName, level: levelName })}
              headingColor="text-gray-900"
              highlightColor="text-blue-500"
              subheadingColor="text-gray-600"
              alignment="md:text-center text-left"
              headingClasses="!mb-1"
              headingSize="heading-xlarge !font-semibold"
            />
          </div>

          {subjects.length > 0 && (
            <TestBySubjects
              data={subjects}
              examName={examName}
              labels={{ title: tHub("bySubjects"), subtitle: t("subjectWise"), by: t("byClearCutoff"), row: tHub("rowSubtitle") }}
            />
          )}

          {dataYears?.data?.length > 0 && (
            <TestByYears
              data={dataYears.data}
              examName={examName}
              labels={{ title: tHub("byYears"), subtitle: t("yearWise"), by: t("byClearCutoff"), row: tHub("rowSubtitle") }}
            />
          )}
        </div>
      </MainContainer>
    </div>
  );
}
