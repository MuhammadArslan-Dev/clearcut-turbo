import NotFound from "@/app/not-found";
import ExamLevelsSection from "@/components/blog/sections/exam-levels-section";
import JsonLd from "@clearcut/ui/json-ld";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import MainContainer from "@/components/main-container";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { Metadata } from "next";
import React, { Suspense } from "react";
import { unFormatSlug } from "@/utils/slugify";
import { siteConfig } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/api2";
import Link from "next/link";

/* =========================================================
   TYPES
========================================================= */

type Params = {
  params: Promise<{
    locale: string;
    examName: string;
  }>;
};

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: {
  params: { locale: string; examName: string };
}): Promise<Metadata> {
  const { locale, examName } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const enUrl = `${baseUrl}/${examName}`;
  const hiUrl = `${baseUrl}/hi/${examName}`;

  const canonicalUrl = locale === "hi" ? hiUrl : enUrl;

  return {
    title: `${siteConfig.name} - ${examName}`,
    description:
      "Explore Complete Courses & Test Series for Teaching Exams and get started for FREE.",

    openGraph: {
      title: siteConfig.name,
      description:
        "Explore Complete Courses & Test Series for Teaching Exams and get started for FREE.",
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: "https://cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com/images/favicon.png",
          width: 1200,
          height: 630,
          alt: "ClearCutoff Exam Prep",
        },
      ],
      type: "website",
    },

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
   PAGE
========================================================= */

export default async function Page({ params }: Params) {
  const { locale, examName: examSlug } = await params;

  /* ---------- Format Exam Name ---------- */

  const examName = unFormatSlug(examSlug ?? "").toUpperCase();

  /* ---------- Validate Allowed Exams ---------- */

  const allowedExams = ["ctet"];

  if (!allowedExams.includes(examName.toLowerCase())) {
    redirect("/");
  }

  /* ---------- Fetch Data ---------- */

  
  const data = await apiFetch(
    `/blog/exam?short_name=${examSlug}&enavigation=true&first=true`,
  );
  const examData = data?.data ?? null;

  // if (!examData) {
  //   return <NotFound />;
  // }

  /* ---------- Breadcrumbs ---------- */

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const examUrl = `${siteUrl}/${examSlug}`;

  const breadcrumbItems = [
    { name: "Home", url: siteUrl },
    { name: examName, url: examUrl },
  ];

  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);

  /* ---------- Blog link (locale-aware, matches `as-needed` prefixing) ---------- */

  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const blogHref = `${localePrefix}/${examSlug}/blog`;

  /* ---------- Render ---------- */

  return (
    <div>
      <JsonLd data={breadcrumbLd} />

      <MainContainer
        padding="py-4"
        maxWidth="max-w-[800px]"
        bgColor="bg-[#f8fafc]"
      >
        <div className="flex items-start justify-between gap-3 px-3">
          <CustomBreadcrumbs
            padding="0px 4px 20px 4px"
            isShow={true}
            items={breadcrumbItems}
          />

          <Link
            href={blogHref}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M9 7h7M9 11h7" />
            </svg>
            {examName} Blog
          </Link>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ExamLevelsSection data={examData?.navigation} examName={examName} />
        </Suspense>
      </MainContainer>
    </div>
  );
}
