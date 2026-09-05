import BlogExamCardsSection from "@/components/blog/blog-exam-cards";
import JsonLd from "@clearcut/ui/json-ld";
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { Metadata } from "next";
import React from "react";

export async function generateMetadata({
  params,
}: {
  params: { locale?: string };
}) {
  const {locale} = await params ?? {};

  // Empty path = homepage / academy root
  const path = "";

  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  return generateLocaleMetadata({
    locale,
    path,
    title: "Teaching Exam Preparation - CTET, HTET & More",
    description:
      "Explore Complete Courses & Test Series for Teaching Exams and get started for FREE.",
  });
}

export default async function Page({
  params,
}: {
  params: { locale: string; examName: string };
}) {
  const { locale } = await params;
  const resCourses = await fetch(
    `${process.env.BACKEND_URL}/blog/exam?status=active`,
    {
      next: { revalidate: 60 },
    },
  );

  const res = await resCourses.json();

  const data = res?.data?.filter((item: any) => {
    const key = item?.short_name?.toLowerCase();
    return ALLOWED_EXAMS.includes(key);
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const homeUrl = siteUrl;
  const breadcrumbItems = [{ name: "Home", url: homeUrl }];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);

  return (
    <div>
      <JsonLd data={breadcrumbLd} />

      <BlogExamCardsSection data={data} />
    </div>
  );
}
