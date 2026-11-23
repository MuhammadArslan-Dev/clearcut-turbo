import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { findLevel, levelHasChapters } from "@/lib/seo/exam-index";
import { tryLoadExamIndex } from "@/lib/seo/load-exam-index";
import { unFormatSlug } from "@/utils/slugify";
import MainContainer from "@/components/main-container";
import CustomizableHeader from "@/components/customizable-header";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import JsonLd from "@clearcut/ui/json-ld";
import SubjectsList from "@/components/blog/ui/subjects-list";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { hubMetadata } from "@/lib/seo/hub-metadata";
import { getTranslations } from "next-intl/server";
import { localeOrigin, pageCopy } from "@/components/question-bank/pages/page-copy";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { backendServerHeaders } from "@/lib/api/backend-headers";
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
  params: Promise<{ locale: string; examName: string; level_id: string }>;
}) {
  const { locale, examName, level_id } = await params;
  const index = await tryLoadExamIndex(examName);
  const noindex = Boolean(index && !levelHasChapters(index, level_id));
  // /hi shows Hindi headings and copy: its own page (lib/seo/hub-metadata).
  return hubMetadata({ locale, kind: "subjects", exam: examName ?? "", level: level_id ?? "", noindex });
}

// Cached and regenerated in the background (lib/question-bank/route-cache.ts):
// no per-request render, and a failed regeneration keeps the last good page.
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

export default async function page({ params }: Props) {
  const { locale, examName: examNameParam, level_id, subject } = await params;

  // Check
  if (!ALLOWED_EXAMS.includes(examNameParam?.toLowerCase())) {
    notFound();
  }

  // ✅ Correct API fetch Subjects
  // `revalidate: 3600` rather than `no-store`: the subject list is public,
  // identical for every visitor and changes on a content-editing cadence, not
  // a per-request one. `no-store` opted this route out of the full route
  // cache entirely, so every crawler hit re-rendered the page and re-queried
  // the backend. 3600s matches the window used by the other blog content
  // routes.
  // Started together with the exam index check below (it doesn't depend on
  // it). The no-op catch only keeps an early notFound() from leaving an
  // unhandled rejection; awaiting it later still throws as before.
  const subjectsPromise = fetch(
    `${process.env.BACKEND_URL}/blog/get-subject?exam_id=${examNameParam}&slug=${level_id ?? ""}`,
    { headers: backendServerHeaders(), next: { revalidate: 3600 } },
  ).then((res) => {
    // A failed read must not be cached as a page without subjects (ISR).
    if (!res.ok) throw new Error(`get-subject -> HTTP ${res.status}`);
    return res.json();
  });
  subjectsPromise.catch(() => {});

  const index = await tryLoadExamIndex(String(examNameParam));
  if (index && !findLevel(index, String(level_id))) notFound();
  const examName = examNameParam?.toUpperCase() ?? "";

  const dataSubjects = await subjectsPromise;
  if (!Array.isArray(dataSubjects?.data)) throw new Error("get-subject -> unexpected response shape");
  // No slug = no page (a link would be /subject/null).
  const subjects = dataSubjects.data.filter(
    (item: { slug?: string | null }) => item?.slug && item.slug !== "null",
  );
  const [t, tHub] = await Promise.all([pageCopy(locale), getTranslations({ locale, namespace: "HubPage" })]);

  // if (dataSubjects?.data?.length === 0) {
  //   return notFound;
  // }
  // On the visitor's language site (/hi links to /hi).
  const homeUrl = localeOrigin(locale);
  const examsUrl = `${homeUrl}/${examNameParam}`;
  const levelUrl = `${examsUrl}/${level_id}`;
  const subjectUrl = `${levelUrl}/subject`;

  const breadcrumbItems = [
    { name: t("home"), url: homeUrl || "/" },
    { name: examName, url: examsUrl },
    { name: unFormatSlug(level_id ?? ""), url: levelUrl },
    { name: t("subject"), url: subjectUrl },
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
            heading={tHub("levelHeading", { exam: examName, level: unFormatSlug(level_id ?? "") })}
            highlightText={examName}
            subheading={tHub("levelSubheading", { exam: examName, level: unFormatSlug(level_id ?? "") })}
            headingColor="text-gray-900"
            highlightColor="text-blue-500"
            subheadingColor="text-gray-600"
            alignment="md:text-center text-left"
            headingClasses="!mb-1"
            headingSize="heading-xlarge !font-semibold"
          />

          <div className="space-y-4">
            <div className="w-full px-3 space-y-1">
              <div className="heading-large !font-semibold">{tHub("bySubjects")}</div>
              <div className="grid grid-cols-5 justify-between items-center gap-1">
                <div className="heading-small !font-semibold col-span-3">
                  {t("subjectWise")}
                </div>
                <div className="flex items-center gap-2 text-[#00753a] col-span-2 justify-self-end">
                  <CourseCheckBadge size={16} fill="#00753a" />
                  <p className="body-medium !font-normal">{t("byClearCutoff")}</p>
                </div>
              </div>
            </div>

            <div className="bg-white">
              {subjects.length > 0 &&
                subjects.map((item: { name?: string; slug: string }, index: number) => (
                  <SubjectsList
                    key={index}
                    index={index + 1}
                    title={item?.name}
                    subtitle={tHub("rowSubtitle")}
                    // The backend slug is already the URL slug; formatToSlug
                    // dropped its hyphens ("child-development-pedagogy" ->
                    // "childdevelopmentpedagogy"), so every link took a 301.
                    pathname={`subject/${item?.slug}`}
                  />
                ))}
            </div>
          </div>
        </div>
      </MainContainer>
    </div>
  );
}
