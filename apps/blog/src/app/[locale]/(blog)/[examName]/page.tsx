import NotFound from "@/app/not-found";
import ExamLevelsSection from "@/components/blog/sections/exam-levels-section";
import JsonLd from "@clearcut/ui/json-ld";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import MainContainer from "@/components/main-container";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { Metadata } from "next";
import React, { Suspense } from "react";
import { unFormatSlug } from "@/utils/slugify";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api2";
import { ALLOWED_EXAMS } from "@/lib/exams";
import Link from "next/link";
import { hubMetadata } from "@/lib/seo/hub-metadata";
import { localeOrigin, pageCopy } from "@/components/question-bank/pages/page-copy";

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
   RENDERING STRATEGY — ISR
   -----------------------------------------------------------------
   This route was `ƒ` (server-rendered on every request) purely because its
   one data read defaulted to `cache: "no-store"` (see lib/api/api2.ts, where
   `revalidate` defaults to `false`). Nothing about the page is
   request-specific: it renders exam navigation from a public endpoint, with
   no cookies, headers or search params.

   Measured cost of the old behaviour on a production build with the backend
   on the SAME machine: TTFB 1449ms, DCL 2414ms for /ctet.

   `generateStaticParams` is safe here because the parameter space is closed —
   the page itself rejects anything but the exams in `ALLOWED_EXAMS` and
   redirects, so there is exactly one valid examName per locale per allowed
   exam. Unlisted params still work: `dynamicParams` defaults to true, so any
   other slug is rendered on demand and then hits the same redirect it always
   did.

   3600s matches the window already used by the year/[year_id] route, so the
   freshness contract across blog content routes stays consistent.
========================================================= */

export const revalidate = 3600;

export async function generateStaticParams() {
  return [
    { locale: "en", examName: "ctet" },
    { locale: "hi", examName: "ctet" },
    { locale: "en", examName: "htet" },
    { locale: "hi", examName: "htet" },
  ];
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, examName } = await params;
  // /hi renders the level list in Hindi: its own page (lib/seo/hub-metadata).
  return hubMetadata({ locale, kind: "exam", exam: examName ?? "" });
}
/* =========================================================
   PAGE
========================================================= */

export default async function Page({ params }: Params) {
  const { locale, examName: examSlug } = await params;

  /* ---------- Format Exam Name ---------- */

  const examName = unFormatSlug(examSlug ?? "").toUpperCase();

  /* ---------- Validate Allowed Exams ---------- */

  if (!ALLOWED_EXAMS.includes(examName.toLowerCase())) {
    notFound();
  }

  /* ---------- Fetch Data ---------- */

  
  const data = await apiFetch(
    `/blog/exam?short_name=${examSlug}&enavigation=true&first=true`,
    { revalidate: 3600 },
  );
  const examData = data?.data ?? null;

  // if (!examData) {
  //   return <NotFound />;
  // }

  /* ---------- Breadcrumbs ---------- */

  // On the visitor's language site (/hi links to /hi).
  const t = await pageCopy(locale);
  const siteUrl = localeOrigin(locale);
  const examUrl = `${siteUrl}/${examSlug}`;

  const breadcrumbItems = [
    { name: t("home"), url: siteUrl || "/" },
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
