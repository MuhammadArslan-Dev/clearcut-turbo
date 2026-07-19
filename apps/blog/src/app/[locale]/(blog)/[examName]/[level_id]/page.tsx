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
import { siteConfig } from "@/lib/metadata";
import { apiFetch } from "@/lib/api/api2";

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

  return {
    title: `${siteConfig.name} - ${examName} - ${level_id}`,
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

async function safeFetch(url: string, cache: RequestCache = "force-cache") {
  try {
      const data = await apiFetch(url, {
      cache,
    });


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

  const allowedExams = ["ctet"];

  if (!allowedExams.includes(examSlug?.toLowerCase())) {
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
    safeFetch(yearsUrl, "force-cache"),
    safeFetch(subjectsUrl, "no-store"),
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
