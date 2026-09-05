import Header from "@/components/layout/headers/Header";
import TeachingPage from "@/components/pages/TeachingPage";
import { Suspense } from "react";
import { generateSeoMetadata, SITE_URL } from "@/lib/seo/metadata";
import FloatingButton from "@/components/global/FloatingButton";
import FooterWrap from "@/components/layout/FooterWrap";
import JsonLd from "@clearcut/ui/json-ld";
import { STATIC_EXAMS } from "@/lib/data/staticExams";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Teaching", item: `${SITE_URL}/teaching` },
  ],
};

// Google's Course rich result requires an ItemList of at least 3 courses on
// a "summary page" (docs: developers.google.com/search/docs/appearance/
// structured-data/course) — a bare Course block on each individual
// /teaching/[slug] page (already present there) does not qualify on its own.
// short_name -> live page slug is a manual map because it doesn't match
// getExamBySlug's own matching (e.g. short_name "UP PGT" has a space, the
// route is "/teaching/uppgt"), and "ugc" has no course page yet (404).
const COURSE_PAGE_SLUG: Record<string, string> = {
  HTET: "htet",
  REET: "reet",
  CTET: "ctet",
  UPTET: "uptet",
  HPTET: "hptet",
  "UP PGT": "uppgt",
  "UP TGT": "uptgt",
};

function getCourseListSchema() {
  const items = STATIC_EXAMS.filter((e) => e.status === "Active" && COURSE_PAGE_SLUG[e.short_name]).map(
    (exam, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        url: `https://clearcutoff.in/teaching/${COURSE_PAGE_SLUG[exam.short_name]}`,
        name: exam.name,
        description: exam.name,
        provider: {
          "@type": "Organization",
          name: "Clear Cutoff",
          sameAs: "https://clearcutoff.in",
        },
      },
    }),
  );

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items,
  };
}

export function generateMetadata() {
  return generateSeoMetadata({
    title: "All Teaching Exam Courses | Clear Cutoff",
    description:
      "Explore all teaching exam courses on Clear Cutoff — HTET, CTET, UPTET, REET, HPTET and more. Course content, test series, PYQs, and video lectures for every state TET exam.",
    url: "/teaching",
    keywords: [
      "CTET course",
      "HTET course",
      "UPTET course",
      "REET course",
      "HPTET course",
      "teaching exam courses",
      "TET preparation",
      "Clear Cutoff courses",
    ],
  });
}

export default async function Teaching({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = locale === "hi" ? "hi" : "en";
  return (
    <>
      <JsonLd data={getCourseListSchema()} />
      <JsonLd data={breadcrumbSchema} />
      <div className="min-h-screen flex flex-col">
        <Header />

        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              Loading course...
            </div>
          }
        >
          <TeachingPage locale={resolvedLocale} />
        </Suspense>
      </div>
      <FloatingButton />
      <FooterWrap />
    </>
  );
}
