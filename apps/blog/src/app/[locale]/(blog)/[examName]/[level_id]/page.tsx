import React from "react";
import { Metadata } from "next";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import TestByYears from "@/components/blog/assessment-question/test-by-years";
import TestBySubjects from "@/components/blog/assessment-question/test-by-subjects";
import { notFound } from "next/navigation";
import { findLevel } from "@/lib/seo/exam-index";
import { tryLoadExamIndex } from "@/lib/seo/load-exam-index";
import { unFormatSlug } from "@/utils/slugify";
import { levelShort, seoDescription, seoTitle } from "@/lib/seo/seo-text";
import { levelLabel as levelName } from "@/lib/seo/year-title";
import MainContainer from "@/components/main-container";
import CustomizableHeader from "@/components/customizable-header";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import JsonLd from "@clearcut/ui/json-ld";
import { apiFetch } from "@/lib/api/api2";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { localeAlternates } from "@/lib/seo/locale-alternates";

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

export async function generateMetadata({
  params,
}: {
  params: { locale: string; examName: string; level_id: string };
}): Promise<Metadata> {
  const { locale, examName, level_id } = await params;

  // /hi shows the same English content — canonical English, no hreflang.
  const { canonical: canonicalUrl } = localeAlternates({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
    path: `/${examName}/${level_id}`,
    locale,
    hiTranslated: false,
  });

  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  const examLabel = unFormatSlug(examName ?? "").toUpperCase();
  const level = levelName(level_id ?? "");

  return {
    title: seoTitle([
      `${examLabel} ${level} Question Papers, PYQ & MCQ`,
      `${examLabel} ${levelShort(level_id ?? "")} Question Papers, PYQ & MCQ`,
    ]),
    description: seoDescription(
      `${examLabel} ${level} previous year question papers (PYQ) and subject-wise MCQ practice with answers and explanations, free on Clear Cutoff.`,
    ),

    alternates: {
      canonical: canonicalUrl,
    },
  };
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
async function safeFetch(url: string, revalidate = 3600) {
  try {
    const data = await apiFetch(url, { revalidate });

    return data;
  } catch (err) {
    console.error("Fetch failed:", err);
    return null;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function Page({ params }: Props) {
  const { examName: examSlug, level_id } = await params;

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

  // Started together with the exam index check (they don't depend on it);
  // safeFetch never rejects, so an early notFound() leaves nothing dangling.
  const dataPromise = Promise.all([safeFetch(yearsUrl), safeFetch(subjectsUrl)]);

  const index = await tryLoadExamIndex(String(examSlug));
  if (index && !findLevel(index, String(level_id))) notFound();

  const examName = unFormatSlug(examSlug).toUpperCase();
  const levelName = unFormatSlug(level_id ?? "");

  const [dataYears, dataSubjects] = await dataPromise;
  // get-subject can list one slug twice (HTET "mathematics"); one link each.
  const seenSubjects = new Set<string>();
  const subjects = (Array.isArray(dataSubjects?.data) ? dataSubjects.data : [])
    .filter((s: { slug?: string }) => s?.slug && !seenSubjects.has(s.slug) && seenSubjects.add(s.slug))
    .map((s: { slug: string; name?: string }) => ({ sections: { name: s.name ?? unFormatSlug(s.slug), slug: s.slug } }));

  // if (
  //   (!dataYears?.data || dataYears.data.length === 0) &&
  //   (!dataSubjects?.data || dataSubjects.data.length === 0)
  // ) {
  //   return notFound();
  // }

  /* ---------- Breadcrumbs ---------- */

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const breadcrumbItems = [
    { name: "Home", url: siteUrl || "/" },
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
              heading={`${examName} Exam ${levelName}`}
              highlightText={examName}
              subheading={`${examName} exam ${levelName} preparation with Clear Cutoff`}
              headingColor="text-gray-900"
              highlightColor="text-blue-500"
              subheadingColor="text-gray-600"
              alignment="md:text-center text-left"
              headingClasses="!mb-1"
              headingSize="heading-xlarge !font-semibold"
            />
          </div>

          {subjects.length > 0 && <TestBySubjects data={subjects} examName={examName} />}

          {dataYears?.data?.length > 0 && (
            <TestByYears data={dataYears.data} examName={examName} />
          )}
        </div>
      </MainContainer>
    </div>
  );
}
