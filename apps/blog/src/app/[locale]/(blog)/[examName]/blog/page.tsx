import type { Metadata } from "next";
import BlogPostGrid from "@/components/blog/blog-post-grid";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import MainContainer from "@/components/main-container";
import { getPostsByExam } from "@/lib/api/posts";
import { resolveExam, examLabelOf } from "@/lib/api/exams";
import { unFormatSlug } from "@/utils/slugify";
import { siteConfig } from "@/lib/metadata";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(
  /\/$/,
  "",
);

type Params = {
  params: Promise<{ locale: string; examName: string }>;
};

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { locale, examName } = await params;
  // Use the resolved exam name (e.g. "CTET") for the title rather than the raw
  // URL segment (which would render "Ctet" for /ctet).
  const exam = await resolveExam(examName);
  const examLabel = examLabelOf(exam, unFormatSlug(examName));
  const path = `/${examName}/blog`;
  const enUrl = `${SITE_URL}${path}`;
  const hiUrl = `${SITE_URL}/hi${path}`;
  const canonicalUrl = locale === "hi" ? hiUrl : enUrl;
  const description = `Guides, strategy and preparation articles for ${examLabel}.`;

  return {
    title: `${examLabel} Blog`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: { en: enUrl, hi: hiUrl, "x-default": enUrl },
    },
    openGraph: {
      title: `${examLabel} Blog | ${siteConfig.name}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: siteConfig.ogImage, alt: `${examLabel} Blog` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${examLabel} Blog`,
      description,
      images: [siteConfig.ogImage],
    },
  };
}

export default async function ExamBlogListingPage({ params }: Params) {
  const { locale, examName } = await params;
  // The URL segment may be a short form ("ctet") rather than the exam_id
  // ("teaching_CTET"); resolve it so the query matches. Fall back to the raw
  // segment if unresolved (e.g. it already is the exam_id).
  const exam = await resolveExam(examName);
  const examId = exam?.exam_id ?? examName;
  const posts = await getPostsByExam(examId, { locale });
  const examLabel = examLabelOf(exam, unFormatSlug(examName));

  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const breadcrumbItems = [
    { name: "Home", url: `${localePrefix}/` },
    { name: examLabel, url: `${localePrefix}/${examName}` },
    { name: "Blog" },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: `${examLabel} Blog`,
        item: `${SITE_URL}${localePrefix}/${examName}/blog`,
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Hero */}
      <div className="border-b border-slate-200 bg-white">
        <MainContainer padding="py-12" maxWidth="max-w-[1100px]" bgColor="">
          <div className="px-4">
            <CustomBreadcrumbs
              padding="0px 0px 16px 0px"
              isShow={true}
              items={breadcrumbItems}
            />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Blog & Preparation Guides
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Strategy, syllabus breakdowns and study plans to help you clear{" "}
              {examLabel}.
            </p>
          </div>
        </MainContainer>
      </div>

      {/* Grid (search + featured + load-more handled client-side) */}
      <MainContainer padding="py-10" maxWidth="max-w-[1100px]" bgColor="">
        <div className="px-4">
          <BlogPostGrid posts={posts} examName={examName} locale={locale} />
        </div>
      </MainContainer>
    </div>
  );
}
