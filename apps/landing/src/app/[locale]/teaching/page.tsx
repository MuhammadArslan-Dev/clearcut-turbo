import Header from "@/components/layout/headers/Header";
import TeachingPage from "@/components/pages/TeachingPage";
import { Suspense } from "react";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import FloatingButton from "@/components/global/FloatingButton";
import FooterWrap from "@/components/layout/FooterWrap";

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
