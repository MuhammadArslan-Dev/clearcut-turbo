import React from "react";
import { Metadata } from "next";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import TestByYears from "@/components/blog/assessment-question/test-by-years";
import TestBySubjects from "@/components/blog/assessment-question/test-by-subjects";
import { notFound, redirect } from "next/navigation";
import { unFormatSlug } from "@/utils/slugify";
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
  searchParams: Promise<{
    levels?: string | string[];
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

  const base = process.env.NEXT_PUBLIC_SITE_URL || "";

  const enUrl = `${base}/${examName}/${level_id}`;
  const hiUrl = `${base}/hi/${examName}/${level_id}`;

  const canonicalUrl = locale === "hi" ? hiUrl : enUrl;

  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  const examLabel = unFormatSlug(examName ?? "").toUpperCase();
  const levelLabel = unFormatSlug(level_id ?? "");

  return {
    title: `${examLabel} Exam ${levelLabel}`,
    description:
      "Explore Complete Courses & Test Series for Teaching Exams and get started for FREE.",

    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: enUrl,
        hi: hiUrl,
        "x-default": enUrl,
      },
    },
  };
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeToArray(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

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

export default async function Page({ params, searchParams }: Props) {
  const { examName: examSlug, level_id } = await params;
  const sp = await searchParams;

  const levels = normalizeToArray(sp.levels);

  /* ---------- Validate Exam ---------- */

  if (!ALLOWED_EXAMS.includes(examSlug?.toLowerCase())) {
    redirect("/");
  }

  const examName = unFormatSlug(examSlug).toUpperCase();
  const levelName = unFormatSlug(level_id ?? "");

  /* ---------- Build API URLs ---------- */

  const baseUrl = 'https://apptest.clearcutoff.in/api';

  if (!baseUrl) {
    console.error("BACKEND_URL missing");
    return notFound();
  }

  const yearsUrl = `/blog/get-years?exam_id=${examSlug}`;

  const levelsString = encodeURIComponent(
    JSON.stringify(levels.map(unFormatSlug)),
  );

  const subjectsUrl =
    `/blog/get-sections?` +
    `exam_id=${examSlug}` +
    `&name=${levelName}` +
    `&levels=${levelsString}`;

  /* ---------- Fetch Data ---------- */

  const [dataYears, dataSubjects] = await Promise.all([
    safeFetch(yearsUrl),
    safeFetch(subjectsUrl),
  ]);

  // if (
  //   (!dataYears?.data || dataYears.data.length === 0) &&
  //   (!dataSubjects?.data || dataSubjects.data.length === 0)
  // ) {
  //   return notFound();
  // }

  /* ---------- Breadcrumbs ---------- */

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const breadcrumbItems = [
    { name: "Home", url: siteUrl },
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

          {dataSubjects?.data?.length > 0 && (
            <TestBySubjects data={dataSubjects.data} examName={examName} />
          )}

          {dataYears?.data?.length > 0 && (
            <TestByYears data={dataYears.data} examName={examName} />
          )}
        </div>
      </MainContainer>
    </div>
  );
}
