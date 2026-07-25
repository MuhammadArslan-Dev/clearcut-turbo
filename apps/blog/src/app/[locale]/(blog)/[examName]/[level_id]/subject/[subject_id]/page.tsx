import DetailsSectionCard from "@/components/blog/assessment-question/details-section-card";
import QuestionListBySubject from "@/components/blog/assessment-question/question-list-by-subject";
import JsonLd from "@clearcut/ui/json-ld";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import MainContainer from "@/components/main-container";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import { unFormatSlug } from "@/utils/slugify";
import React, { Suspense } from "react";
import { capitalizeFirst } from "@clearcut/utils/text-format";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { siteConfig } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/api2";
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";

export async function generateMetadata({
  params,
}: {
  params: {
    locale: string;
    examName: string;
    level_id: string;
    subject_id: string;
  };
}) {
  const { locale, examName, level_id, subject_id } = (await params) ?? {};

  const path = `${examName}/${level_id}/subject/${subject_id}`;

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
    subject: string;
    subject_id: string;
  };
}) {
  const {
    locale,
    examName: examNameParam,
    level_id,
    subject,
    subject_id,
  } = await params;

  const allowedExams = ["ctet"];

  // Check
  if (!allowedExams.includes(examNameParam?.toLowerCase())) {
    redirect("/");
  }
  const examName = examNameParam?.toUpperCase() ?? "";

  const query = `section_id=${examNameParam}&slug=${subject_id}`;

  const data = await apiFetch(`/blog/get-questions-by-section?${query}`);

  // Now group them back by chapter
  const groupedByChapter =
    data?.data?.data?.map((item: any) => ({
      type: data?.data?.type,
      slug: item.chapter?.slug,
      chapterId: item.chapter?.id,
      chapterName: item.chapter?.name,
      questions: item.chapter?.questions_new || [],
    })) || [];

  const Labels = [
    {
      lable: "Exam",
      value: examName ?? "REET",
    },
    {
      lable: "Level",
      value: level_id ?? "",
    },
    {
      lable: "State",
      value: "Rajasthan",
    },
  ];


  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const homeUrl = siteUrl;
  const examsUrl = `${homeUrl}/${examName}`;
  const levelUrl = `${examsUrl}/${level_id}`;
  const subjectUrl = `${levelUrl}/subject`;
  const subjectIdUrl = `${subjectUrl}/${subject_id}`;

  const breadcrumbItems = [
    { name: "Home", url: homeUrl },
    { name: examName, url: examsUrl },
    { name: capitalizeFirst(level_id), url: levelUrl },
    { name: "Subject", url: subjectUrl },
    { name: capitalizeFirst(subject_id), url: subjectIdUrl },
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <JsonLd data={breadcrumbLd} />

      <MainContainer
        maxWidth="max-w-[900px]"
        padding="py-4"
        className="space-y-5"
        bgColor="bg-transparent"
      >
        <CustomBreadcrumbs isShow={true} items={breadcrumbItems} />

        <Suspense fallback={<div>Loading...</div>}>
          <div className="w-full bg-white p-4">
            <DetailsSectionCard
              yearId={unFormatSlug(subject_id).toUpperCase()}
              Labels={Labels}
              sourceLabel="Subject"
              totalQuestions={data?.data ?? 0}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2 px-3">
              <div className="heading-small">Subject-wise questions</div>
              <div className="flex items-center gap-2 text-[#00753a]">
                <CourseCheckBadge size={20} fill="#00753a" />
                <p>by Clear Cutoff</p>
              </div>
            </div>
            <QuestionListBySubject data={groupedByChapter} />
          </div>
        </Suspense>
      </MainContainer>
    </>
  );
}
