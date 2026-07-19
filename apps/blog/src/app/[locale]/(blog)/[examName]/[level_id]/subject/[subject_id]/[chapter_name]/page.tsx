import MainContainer from "@/components/main-container";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import React from "react";
import { unFormatSlug } from "@/utils/slugify";
import QuestionsList from "@/components/blog/assessment-question/questions-list";
import DetailsSectionCard from "@/components/blog/assessment-question/details-section-card";
import CustomizableHeader from "@/components/customizable-header";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import JsonLd from "@clearcut/ui/json-ld";
import { capitalizeFirst } from "@clearcut/utils/text-format";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { siteConfig } from "@/lib/metadata";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";

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
    chapter_name: string;
  };
}) {
  const { locale, examName, level_id, subject, subject_id, chapter_name } =
    await params;

  const allowedExams = ["ctet"];

  // Check
  if (!allowedExams.includes(examName?.toLowerCase())) {
    redirect("/");
  }
  const query = `slug=${chapter_name}&exam_name=${examName}`;

  const res = await fetch(
    `${process.env.BACKEND_URL}/blog/get-questions-by-chapter?${query}`,
    {
      cache: "no-store",
    },
  );
  const data = await res.json();

  const questions = data?.data?.questions_new;

  const Labels = [
    {
      lable: "Exam",
      value: examName.toUpperCase() ?? "REET",
    },
    {
      lable: "Level",
      value: level_id.toUpperCase() ?? "",
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
  const chapterUrl = `${subjectIdUrl}/${chapter_name}`;

  const breadcrumbItems = [
    { name: "Home", url: homeUrl },
    { name: examName, url: examsUrl },
    { name: capitalizeFirst(level_id), url: levelUrl },
    { name: "Subject", url: subjectUrl },
    { name: capitalizeFirst(subject_id), url: subjectIdUrl },
    { name: capitalizeFirst(chapter_name), url: chapterUrl },
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
            <div className="flex items-center gap-2 text-[#00a251] col-span-2 justify-self-end">
              <CourseCheckBadge size={16} fill="#00a251" />
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
