import MainBreadcrumbs from "@/components/breadcrumbs/main-breadcrumbs";
import React from "react";
import { Metadata } from "next";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import TestByYears from "@/components/blog/assessment-question/test-by-years";
import { notFound } from "next/navigation";
import { findLevel } from "@/lib/seo/exam-index";
import { tryLoadExamIndex } from "@/lib/seo/load-exam-index";
import { formatToSlug, unFormatSlug } from "@/utils/slugify";
import { findLeafNodes } from "@/utils/getLeafNodes";
import TestBySubjects from "@/components/blog/assessment-question/test-by-subjects";
import NotFound from "@/app/not-found";
import MainContainer from "@/components/main-container";
import CustomizableHeader from "@/components/customizable-header";
import StarBadge from "@/components/ui/badge/star-badge";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import JsonLd from "@clearcut/ui/json-ld";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import SubjectsList from "@/components/blog/ui/subjects-list";
import { hubMetadata } from "@/lib/seo/hub-metadata";
import { getTranslations } from "next-intl/server";
import { localeOrigin, pageCopy } from "@/components/question-bank/pages/page-copy";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { backendServerHeaders } from "@/lib/api/backend-headers";
type Props = {
  params: {
    locale: string;
    examName: string;
    level_id?: string;
    year?: string;
  };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; examName: string; level_id: string }>;
}) {
  const { locale, examName, level_id } = await params;
  // /hi shows Hindi headings and copy: its own page (lib/seo/hub-metadata).
  return hubMetadata({ locale, kind: "years", exam: examName ?? "", level: level_id ?? "" });
}

// Cached and regenerated in the background (lib/question-bank/route-cache.ts):
// no per-request render, and a failed regeneration keeps the last good page.
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

export default async function page({ params }: Props) {
  const { locale, examName: examNameParam, level_id, year } = await params;

  const examName = examNameParam?.toUpperCase() ?? "";

  // Check
  if (!ALLOWED_EXAMS.includes(examNameParam?.toLowerCase())) {
    notFound();
  }

  // Build query string safely
  const queryYears = `exam_id=${examNameParam}`;

  // The years request does not depend on the exam index: start it together with
  // the index check instead of after it (same pattern as the level page). If the
  // index says the level is unknown we notFound() below and this request is simply
  // not used; the no-op catch only stops an unused failure from being reported as
  // unhandled. The awaited result and any error are exactly what they were.
  const yearsRequest = fetch(
    `${process.env.BACKEND_URL}/blog/get-years?${queryYears}`,
    { headers: backendServerHeaders(), next: { revalidate: 3600 } },
  );
  yearsRequest.catch(() => {});

  const index = await tryLoadExamIndex(String(examNameParam));
  if (index && !findLevel(index, String(level_id))) notFound();

  // ✅ Correct API fetch Years
  const resYears = await yearsRequest;

  // A failed read must not be cached as a page without years (ISR).
  if (!resYears.ok) throw new Error(`get-years -> HTTP ${resYears.status}`);
  const dataYears = await resYears.json();
  if (!Array.isArray(dataYears?.data)) throw new Error("get-years -> unexpected response shape");
  const [t, tHub] = await Promise.all([pageCopy(locale), getTranslations({ locale, namespace: "HubPage" })]);
  if (dataYears?.data?.length === 0) {
    return notFound();
  }

  // On the visitor's language site (/hi links to /hi).
  const homeUrl = localeOrigin(locale);
  const examsUrl = `${homeUrl}/${examNameParam}`;

  const breadcrumbItems = [
    { name: t("home"), url: homeUrl || "/" },
    { name: examName, url: examsUrl },
    {
      name: unFormatSlug(level_id ?? ""),
      url: `${homeUrl}/${examNameParam}/${level_id}`,
    },
    { name: t("years"), url: `${homeUrl}/${examNameParam}/${level_id}/year` },
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);

  return (
    <div>
      <JsonLd data={breadcrumbLd} />

      <MainContainer
        maxWidth="max-w-[900px]"
        padding="py-4"
        bgColor="bg-transparent"
      >
        <CustomBreadcrumbs isShow={true} items={breadcrumbItems} />
        <div className="space-y-12">
          <CustomizableHeader
            showEyebrow={false}
            heading={tHub("levelHeading", { exam: examName, level: unFormatSlug(level_id ?? "") })}
            highlightText={examName}
            subheading={tHub("levelSubheading", { exam: examName, level: unFormatSlug(level_id ?? "") })}
            headingColor="text-gray-900"
            highlightColor="text-blue-500"
            subheadingColor="text-gray-600"
            alignment="md:text-center text-left"
            headingClasses="!mb-1"
            headingSize="heading-xlarge !font-semibold"
          />

          <div className="space-y-4">
            <div className="w-full px-3 space-y-1">
              <div className="heading-large !font-semibold">{tHub("byYears")}</div>
              <div className="grid grid-cols-5 justify-between items-center gap-1">
                <div className="heading-small !font-semibold col-span-3">
                  {t("yearWise")}
                </div>
                <div className="flex items-center gap-2 text-[#00753a] col-span-2 justify-self-end">
                  <CourseCheckBadge size={16} fill="#00753a" />
                  <p className="body-medium !font-normal">{t("byClearCutoff")}</p>
                </div>
              </div>
            </div>
            <div className="bg-white">
              {dataYears?.data?.length > 0 &&
                dataYears?.data.map((item: any, index: any) => {
                  const url = `year/${formatToSlug(item?.instance_id.replace("_", " "))}`;
                  return (
                    <SubjectsList
                      key={index}
                      index={index + 1}
                      title={item?.instance_id.replace("_", " ")}
                      subtitle={tHub("rowSubtitle")}
                      pathname={url}
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </MainContainer>

      {/* <SimilarQuestionsSection /> */}
      {/* <OthersExamsSection /> */}
    </div>
  );
}
