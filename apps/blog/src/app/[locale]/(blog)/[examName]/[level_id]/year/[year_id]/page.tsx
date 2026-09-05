import React from "react";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import QuestionsList from "@/components/blog/assessment-question/questions-list";
import { unFormatSlug } from "@/utils/slugify";
import MainContainer from "@/components/main-container";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import CustomizableHeader from "@/components/customizable-header";
import { capitalizeFirst } from "@clearcut/utils/text-format";
import DetailsSectionCard from "@/components/blog/assessment-question/details-section-card";
import JsonLd from "@clearcut/ui/json-ld";
import { Metadata } from "next";
import { siteConfig } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/api2";
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";
import QuestionListByYear from "@/components/pages/QuestionListByYear";

export async function generateMetadata({
  params,
}: {
  params: {
    locale: string;
    examName: string;
    level_id: string;
    year_id: string;
  };
}) {
  const { locale, examName, level_id, year_id } = (await params) ?? {};

  const path = `/${examName}/${level_id}/year/${year_id}`;

  return generateLocaleMetadata({
    locale,
    path,
    title: `${siteConfig.name} - ${examName} - ${level_id}`,
    description:
      "Explore Complete Courses & Test Series for Teaching Exams and get started for FREE.",
  });
}

export default async function page({
  params,
}: {
  params: {
    locale: string;
    examName: string;
    level_id: string;
    year: string;
    year_id: string;
  };
}) {
  const {
    locale,
    examName: examNameParam,
    level_id,
    year,
    year_id,
  } = await params;
  const examName = examNameParam?.toUpperCase() ?? "";

  const allowedExams = ["ctet"];

  // Check
  if (!allowedExams.includes(examNameParam?.toLowerCase())) {
    redirect("/");
  }

  const examYear = year_id.replace(/-/g, "_").toUpperCase();

  // Fetch the question list on the server so it ships inside the initial HTML.
  // `apiFetch` resolves to null on failure, so a backend hiccup degrades to the
  // client fetch rather than 500-ing the page.
  const [initialQuestions, examData] = await Promise.all([
    apiFetch(`/blog/get-questions?year=${examYear}`, { revalidate: 3600 }),
    apiFetch(`/blog/exam?short_name=${examNameParam}&first=true`, {
      revalidate: 3600,
    }),
  ]);
  const examState = examData?.data?.state;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const homeUrl = siteUrl;

  const breadcrumbItems = [
    { name: "Home", url: homeUrl },
    {
      name: unFormatSlug(examNameParam.toLocaleUpperCase()),
      url: `${homeUrl}/${examNameParam}`,
    },
    {
      name: capitalizeFirst(unFormatSlug(level_id)),
      url: `${homeUrl}/${examNameParam}/${level_id}`,
    },
    {
      name: "Years",
      url: `${homeUrl}/${examNameParam}/${level_id}/year`,
    },
    {
      name: unFormatSlug(examYear.toUpperCase()),
      url: `${homeUrl}/${examNameParam}/${level_id}/year/${year_id}`,
    },
  ];

  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);

  function opacityToHex(opacity: number) {
    const value = Math.round(opacity * 255);
    return value.toString(16).padStart(2, "0").toUpperCase();
  }

  return (
    <div>
      <JsonLd data={breadcrumbLd} />

      <MainContainer
        maxWidth="max-w-[900px]"
        padding="py-4"
        className="space-y-5"
        bgColor="bg-transparent"
      >
        <div className="px-4">
          <CustomBreadcrumbs
            padding="0px 4px 20px 4px"
            isShow={true}
            items={breadcrumbItems}
          />
        </div>
        <QuestionListByYear
          examName={examName}
          level_id={level_id}
          examYear={examYear}
          initialQuestions={initialQuestions}
          examState={examState}
          // year_id={examYear}
        />
      </MainContainer>
      {/* <SimilarQuestionsSection /> */}
      {/* <OthersExamsSection /> */}
    </div>
  );
}
