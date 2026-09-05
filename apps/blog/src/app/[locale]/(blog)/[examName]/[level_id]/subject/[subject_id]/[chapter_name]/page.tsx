import MainContainer from "@/components/main-container";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import React from "react";
import { unFormatSlug } from "@/utils/slugify";
import QuestionsList from "@/components/blog/assessment-question/questions-list";
import DetailsSectionCard from "@/components/blog/assessment-question/details-section-card";
import CustomizableHeader from "@/components/customizable-header";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import JsonLd from "@clearcut/ui/json-ld";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";
import { apiFetch } from "@/lib/api/api2";
import { ALLOWED_EXAMS } from "@/lib/exams";

export async function generateMetadata({
  params,
}: {
  params: {
    locale: string;
    examName: string;
    level_id: string;
    subject_id: string;
    chapter_name: string;
  };
}) {
  const {locale,examName,level_id,subject_id,chapter_name} = await params ?? {};

  const path = `${examName}/${level_id}/subject/${subject_id}/${chapter_name}`;

  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  const examLabel = unFormatSlug(examName ?? "").toUpperCase();
  const levelLabel = unFormatSlug(level_id ?? "");
  const subjectLabel = unFormatSlug(subject_id ?? "");
  const chapterLabel = unFormatSlug(chapter_name ?? "");

  return generateLocaleMetadata({
    locale,
    path,
    title: `${chapterLabel} - ${subjectLabel} ${examLabel} ${levelLabel} Questions`,
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
    chapter_name: string;
  };
}) {
  const { locale, examName, level_id, subject, subject_id, chapter_name } =
    await params;

  // Check
  if (!ALLOWED_EXAMS.includes(examName?.toLowerCase())) {
    redirect("/");
  }
  const query = `slug=${chapter_name}&exam_name=${examName}`;

  // `revalidate: 3600` rather than `no-store`. This is the deepest content
  // route (chapter question bank) and the heaviest read on the blog, and it
  // is the same for every visitor — no cookies, no personalisation. Under
  // `no-store` every crawler request re-ran this query and re-rendered the
  // page. Same window as the sibling year/[year_id] route, which already
  // used 3600.
  const [res, examData] = await Promise.all([
    fetch(
      `${process.env.BACKEND_URL}/blog/get-questions-by-chapter?${query}`,
      {
        next: { revalidate: 3600 },
      },
    ),
    apiFetch(`/blog/exam?short_name=${examName}&first=true`),
  ]);
  const data = await res.json();

  const questions = data?.data?.questions_new;

  // `state` is nullable on the backend (national exams like CTET have none) —
  // only show the row when the exam actually has one, instead of hardcoding
  // "Rajasthan" for every exam.
  const examState = examData?.data?.state;

  const Labels = [
    {
      lable: "Exam",
      value: examName.toUpperCase() ?? "REET",
    },
    {
      lable: "Level",
      value: unFormatSlug(level_id ?? ""),
    },
    ...(examState ? [{ lable: "State", value: examState }] : []),
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const homeUrl = siteUrl;
  const examsUrl = `${homeUrl}/${examName}`;
  const levelUrl = `${examsUrl}/${level_id}`;
  const subjectUrl = `${levelUrl}/subject`;
  const subjectIdUrl = `${subjectUrl}/${subject_id}`;
  const chapterUrl = `${subjectIdUrl}/${chapter_name}`;

  const breadcrumbItems = [
    { name: "Home", url: homeUrl },
    { name: examName, url: examsUrl },
    { name: unFormatSlug(level_id), url: levelUrl },
    { name: "Subject", url: subjectUrl },
    { name: unFormatSlug(subject_id), url: subjectIdUrl },
    { name: unFormatSlug(chapter_name), url: chapterUrl },
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

        <div className="px-3">
          <CustomizableHeader
            showEyebrow={false}
            heading={`${examName.toUpperCase()} Exam - ${unFormatSlug(level_id ?? "")} - ${unFormatSlug(chapter_name ?? "")}`}
            highlightText={examName.toUpperCase()}
            subheading={`${examName.toUpperCase()} exam ${unFormatSlug(level_id ?? "")} preparation with Clear Cutoff`}
            headingColor="text-gray-900"
            highlightColor="text-blue-500"
            subheadingColor="text-gray-600"
            alignment="md:text-center text-left"
            headingClasses="!mb-1"
            headingSize="heading-xlarge !font-semibold"
          />
        </div>

        <div className="w-full bg-white px-3 py-4">
          <div className=" ">
            <DetailsSectionCard
              sourceLabel="Chapter"
              Labels={Labels}
              totalQuestions={questions}
              yearId={unFormatSlug(chapter_name ?? "")}
            />
          </div>
        </div>
        <div className="space-y-2 px-3">
          <div className="flex justify-between items-center gap-2">
            <div className="heading-small !font-semibold col-span-3">
              Chapter-wise questions
            </div>
            <div className="flex items-center gap-2 text-[#00753a] col-span-2 justify-self-end">
              <CourseCheckBadge size={16} fill="#00753a" />
              <p className="body-medium !font-normal">by Clear Cutoff</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {/* <QuestionsListByChapterName data={questions} /> */}
            <QuestionsList data={questions} />
          </div>
        </div>
      </MainContainer>
    </>
  );
}
