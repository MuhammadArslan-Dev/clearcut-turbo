import React from "react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { formatToSlug, unFormatSlug } from "@/utils/slugify";
import MainContainer from "@/components/main-container";
import CustomizableHeader from "@/components/customizable-header";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import JsonLd from "@clearcut/ui/json-ld";
import SubjectsList from "@/components/blog/ui/subjects-list";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";
import { ALLOWED_EXAMS } from "@/lib/exams";
type Props = {
  params: {
    locale: string;
    examName: string;
    level_id?: string;
    subject?: string;
  };
};

export async function generateMetadata({
  params,
}: {
  params: { locale: string; examName: string; level_id: string };
}) {
  const {locale,examName,level_id} = await params ?? {};

  const path = `${examName}/${level_id}/subject`;

  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  const examLabel = unFormatSlug(examName ?? "").toUpperCase();
  const levelLabel = unFormatSlug(level_id ?? "");

  return generateLocaleMetadata({
    locale,
    path,
    title: `${examLabel} Exam ${levelLabel} - Subject Wise Questions`,
    description:
      "Explore Complete Courses & Test Series for Teaching Exams and get started for FREE.",
  });
}

export default async function page({ params }: Props) {
  const { locale, examName: examNameParam, level_id, subject } = await params;

  // Check
  if (!ALLOWED_EXAMS.includes(examNameParam?.toLowerCase())) {
    redirect("/");
  }
  const examName = examNameParam?.toUpperCase() ?? "";

  // ✅ Correct API fetch Subjects
  // `revalidate: 3600` rather than `no-store`: the subject list is public,
  // identical for every visitor and changes on a content-editing cadence, not
  // a per-request one. `no-store` opted this route out of the full route
  // cache entirely, so every crawler hit re-rendered the page and re-queried
  // the backend. 3600s matches the window used by the other blog content
  // routes.
  const resSubjects = await fetch(
    `${process.env.BACKEND_URL}/blog/get-subject?exam_id=${examNameParam}&slug=${level_id ?? ""}`,
    { next: { revalidate: 3600 } },
  );

  const dataSubjects = await resSubjects.json();

  // if (dataSubjects?.data?.length === 0) {
  //   return notFound;
  // }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const homeUrl = siteUrl;
  const examsUrl = `${homeUrl}/${examNameParam}`;
  const levelUrl = `${examsUrl}/${level_id}`;
  const subjectUrl = `${levelUrl}/subject`;

  const breadcrumbItems = [
    { name: "Home", url: homeUrl },
    { name: examName, url: examsUrl },
    { name: unFormatSlug(level_id ?? ""), url: levelUrl },
    { name: "Subject", url: subjectUrl },
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);

  return (
    <div>
      <JsonLd data={breadcrumbLd} />

      <MainContainer
        maxWidth="max-w-[900px]"
        padding="py-4"
        bgColor="bg-[#f8fafc]"
      >
        <CustomBreadcrumbs isShow={true} items={breadcrumbItems} />
        <div className="space-y-12">
          <CustomizableHeader
            showEyebrow={false}
            heading={`${examName} Exam ${unFormatSlug(level_id ?? "")}`}
            highlightText={examName}
            subheading={`${examName} exam ${unFormatSlug(
              level_id ?? "",
            )} preparation with Clear Cutoff`}
            headingColor="text-gray-900"
            highlightColor="text-blue-500"
            subheadingColor="text-gray-600"
            alignment="md:text-center text-left"
            headingClasses="!mb-1"
            headingSize="heading-xlarge !font-semibold"
          />

          <div className="space-y-4">
            <div className="w-full px-3 space-y-1">
              <div className="heading-large !font-semibold">By Subjects</div>
              <div className="grid grid-cols-5 justify-between items-center gap-1">
                <div className="heading-small !font-semibold col-span-3">
                  Subject-wise questions
                </div>
                <div className="flex items-center gap-2 text-[#00753a] col-span-2 justify-self-end">
                  <CourseCheckBadge size={16} fill="#00753a" />
                  <p className="body-medium !font-normal">by Clear Cutoff</p>
                </div>
              </div>
            </div>

            <div className="bg-white">
              {dataSubjects.data?.length > 0 &&
                dataSubjects.data.map((item: any, index : number) => (
                  <SubjectsList
                    key={index}
                    index={index + 1}
                    title={item?.name}
                    pathname={`subject/${formatToSlug(item?.slug)}`}
                  />
                ))}
            </div>
          </div>
        </div>
      </MainContainer>
    </div>
  );
}
