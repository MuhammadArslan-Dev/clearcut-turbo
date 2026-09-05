import MainBreadcrumbs from "@/components/breadcrumbs/main-breadcrumbs";
import React from "react";
import { Metadata } from "next";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import TestByYears from "@/components/blog/assessment-question/test-by-years";
import { notFound, redirect } from "next/navigation";
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
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";
import { ALLOWED_EXAMS } from "@/lib/exams";
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
  params: { locale: string; examName: string; level_id: string };
}) {
  const {locale,examName,level_id} = await params ?? {};

  const path = `${examName}/${level_id}/year`;

  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  const examLabel = unFormatSlug(examName ?? "").toUpperCase();
  const levelLabel = unFormatSlug(level_id ?? "");

  return generateLocaleMetadata({
    locale,
    path,
    title: `${examLabel} Exam ${levelLabel} - Year Wise Papers`,
    description:
      "Explore Complete Courses & Test Series for Teaching Exams and get started for FREE.",
  });
}


export default async function page({ params }: Props) {
  const { locale, examName: examNameParam, level_id, year } = await params;

  const examName = examNameParam?.toUpperCase() ?? "";

  // Check
  if (!ALLOWED_EXAMS.includes(examNameParam?.toLowerCase())) {
    redirect("/");
  }
  // Build query string safely
  const queryYears = `exam_id=${examNameParam}`;

  // ✅ Correct API fetch Years
  const resYears = await fetch(
    `${process.env.BACKEND_URL}/blog/get-years?${queryYears}`,
    { cache: "force-cache" },
  );

  const dataYears = await resYears.json();
  if (dataYears?.data?.length === 0) {
    return notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const homeUrl = siteUrl;
  const examsUrl = `${homeUrl}/${examNameParam}`;

  const breadcrumbItems = [
    { name: "Home", url: homeUrl },
    { name: examName, url: examsUrl },
    {
      name: unFormatSlug(level_id ?? ""),
      url: `${homeUrl}/${examNameParam}/${level_id}`,
    },
    { name: "Years", url: `${homeUrl}/${examNameParam}/${level_id}/year` },
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
              <div className="heading-large !font-semibold">By Years</div>
              <div className="grid grid-cols-5 justify-between items-center gap-1">
                <div className="heading-small !font-semibold col-span-3">
                  Year-wise questions
                </div>
                <div className="flex items-center gap-2 text-[#00753a] col-span-2 justify-self-end">
                  <CourseCheckBadge size={16} fill="#00753a" />
                  <p className="body-medium !font-normal">by Clear Cutoff</p>
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
