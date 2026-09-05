import AssessmentQuestionBlock from "@/components/blog/assessment-question/assessment-question-block";
import React from "react";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import MainContainer from "@/components/main-container";
import JsonLd from "@clearcut/ui/json-ld";
import { getFaqSchema } from "@/utils/google/get-faqs-schema";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { Metadata } from "next";
import { siteConfig } from "@/lib/metadata";
import { apiFetch } from "@/lib/api/api2";
import { permanentRedirect } from "@/i18n/navigation";
import { formatToSlug } from "@/utils/slugify";
import { limitWords } from "@clearcut/utils/text-limit";
import { AppLocale } from "@/types/components/language";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; questionId: string };
}): Promise<Metadata> {
  const { locale, questionId } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const enUrl = `${baseUrl}/question/${questionId}`;
  const hiUrl = `${baseUrl}/hi/question/${questionId}`;

  const canonicalUrl = locale === "hi" ? hiUrl : enUrl;

  return {
    title: `${siteConfig.name} - ${questionId}`,
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

export default async function page({
  params,
}: {
  params: { locale: string; questionId: string };
}) {
  const { locale, questionId: questionIdParam } = await params;
  const str = questionIdParam ?? "";
  const questionId = str.split("-").pop();
  const query = `id=${questionId}&limit_q=2`;

  const data = await apiFetch(`/blog/get-questions?${query}`);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const homeUrl = siteUrl;

  const breadcrumbItems = [
    { name: "Home", url: homeUrl },
    { name: "Question", url: `${homeUrl}/question/${questionId}` },
  ];

  const selectedQuestion = data?.data?.find(
    (item: any) => item.id === parseInt(questionId || ""),
  );

  // Enforce the canonical slug-id URL so every question resolves to exactly
  // one address — without this, bare-id links (or any wrong slug) render
  // successfully instead of redirecting, producing duplicate-content URLs.
  const slugTranslation = selectedQuestion?.translations?.[0];
  if (selectedQuestion && slugTranslation) {
    const plainQuestion = (slugTranslation.question || "").replace(/<[^>]*>/g, "");
    const slug = slugTranslation.ai_slug
      ? slugTranslation.ai_slug
      : formatToSlug(limitWords(plainQuestion, 4));
    const canonicalParam = `${slug}-${questionId}`;

    if (questionIdParam !== canonicalParam) {
      permanentRedirect({ href: `/question/${canonicalParam}`, locale: locale as AppLocale });
    }
  }

  const faqItems = [
    {
      question: selectedQuestion?.question_text,
      answer: selectedQuestion?.explanation,
      questionAuthor: "ClearCutoff",
      answerAuthor: "ClearCutoff",
      dateCreated: selectedQuestion?.created_at,
      dateModified: selectedQuestion?.updated_at,
    },
  ];

  // const faqlist = getFaqsSchema(faqItems);
  const faqlistSchema = getFaqSchema(faqItems);
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);

  return (
    <div>
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={faqlistSchema} id="faq-ld" />

      <MainContainer
        padding="py-4"
        bgColor="transparent"
        maxWidth="max-w-[900px]"
      >
        <CustomBreadcrumbs
          padding="0px 4px 20px 4px"
          isShow={true}
          items={breadcrumbItems}
        />

        <AssessmentQuestionBlock data={data?.data} />
      </MainContainer>
    </div>
  );
}
