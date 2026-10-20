import DetailsSectionCard from "@/components/blog/assessment-question/details-section-card";
import JsonLd from "@clearcut/ui/json-ld";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import MainContainer from "@/components/main-container";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import CustomizableHeader from "@/components/customizable-header";
import { unFormatSlug } from "@/utils/slugify";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { getQuizSchema } from "@/utils/google/get-quiz-schema";
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import { AppLocale } from "@/types/components/language";
import { canonicalChapterPathMap, findSubject, resolveSubjectRoute } from "@/lib/seo/exam-index";
import { tryLoadExamIndex } from "@/lib/seo/load-exam-index";
import { canonicalSubject } from "@/lib/seo/canonical";
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { loadExamInfo } from "@/lib/question-bank/load";
import { loadScope, type QuestionScope } from "@/lib/question-bank/scope";
import { pagePath, pageSlice } from "@/lib/question-bank/pagination";
import QuestionBankView, { ChapterLinks, localePath } from "../question-bank-view";
import { assertPageExists, metadataPage, pageSeo, resolvePageParam } from "./page-param";

export type SubjectParams = {
  locale: string;
  examName: string;
  level_id: string;
  subject_id: string;
  page?: string;
};

export async function subjectPageMetadata(params: SubjectParams) {
  const { locale, examName, level_id, subject_id } = params;
  const canonical = await canonicalSubject(examName, level_id, subject_id);
  const seo = pageSeo(metadataPage(params.page));
  const path = `${examName}/${canonical.level}/subject/${subject_id}${seo.pathSuffix}`;

  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  const examLabel = unFormatSlug(examName ?? "").toUpperCase();
  const levelLabel = unFormatSlug(level_id ?? "");
  const subjectLabel = unFormatSlug(subject_id ?? "");

  return generateLocaleMetadata({
    locale,
    path,
    title: `${subjectLabel} - ${examLabel} ${levelLabel} Questions${seo.titleSuffix}`,
    description: `${subjectLabel} practice questions for ${examLabel} Exam ${levelLabel}, free on Clear Cutoff.${seo.descriptionSuffix}`,
    noindex: canonical.empty,
  });
}

export default async function SubjectQuestionsPage({ params }: { params: SubjectParams }) {
  const { locale, examName: examNameParam, level_id, subject_id } = params;

  if (!ALLOWED_EXAMS.includes(examNameParam?.toLowerCase())) {
    notFound();
  }

  // Only listed level/subject pairs render, each showing its level's own
  // section (CTET "english" is CTET_L1_ENG on paper 1, CTET_L2_ENG on paper 2).
  const index = await tryLoadExamIndex(examNameParam);
  const resolved = index ? resolveSubjectRoute(index, level_id, subject_id) : null;
  const ownPath = `/${examNameParam}/${level_id}/subject/${subject_id}`;
  const page = resolvePageParam(params.page, ownPath, locale);
  if (resolved?.kind === "notFound") notFound();
  if (resolved?.kind === "redirect") {
    permanentRedirect({
      href: pagePath(`/${examNameParam}/${resolved.to.level}/subject/${resolved.to.subject}`, page),
      locale: locale as AppLocale,
    });
  }
  const canonicalLevel = resolved?.kind === "ok" ? resolved.canonical.level : level_id;

  const examName = examNameParam?.toUpperCase() ?? "";
  const section = index ? findSubject(index, level_id, subject_id)?.sectionId : undefined;
  const scope: QuestionScope = { kind: "subject", exam: examNameParam, subject: subject_id, section };
  const [loaded, examInfo] = await Promise.all([loadScope(scope), loadExamInfo(examNameParam)]);
  assertPageExists(page, loaded.cards.length, loaded.ok);

  // `state` is nullable on the backend (national exams like CTET have none).
  const examState = examInfo?.state;
  const Labels = [
    { lable: "Exam", value: examName ?? "REET" },
    { lable: "Level", value: unFormatSlug(level_id ?? "") },
    ...(examState ? [{ lable: "State", value: examState }] : []),
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const homeUrl = siteUrl;
  const examsUrl = `${homeUrl}/${examNameParam}`;
  const levelUrl = `${examsUrl}/${level_id}`;
  const subjectUrl = `${levelUrl}/subject`;
  const subjectIdUrl = `${subjectUrl}/${subject_id}`;

  const breadcrumbItems = [
    { name: "Home", url: homeUrl || "/" },
    { name: examName, url: examsUrl },
    { name: unFormatSlug(level_id), url: levelUrl },
    { name: "Subject", url: subjectUrl },
    { name: unFormatSlug(subject_id), url: subjectIdUrl },
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);
  const pageIds = new Set(pageSlice(loaded.cards, page).map((c) => c.id));
  const quizLd = getQuizSchema({
    questions: loaded.raw.filter((q) => pageIds.has(q.id)),
    name: `${unFormatSlug(subject_id)} - ${examName} ${unFormatSlug(level_id ?? "")} Quiz`,
    url: pagePath(`${examsUrl}/${canonicalLevel}/subject/${subject_id}`, page),
    // Questions server-render in English on /hi too (courseLanguage default).
    courseLang: "en",
  });

  const chapterPaths = index
    ? canonicalChapterPathMap(index, loaded.cards.map((c) => c.chapterSlug ?? ""))
    : undefined;

  return (
    <>
      {breadcrumbLd && <JsonLd data={breadcrumbLd} />}
      {quizLd && <JsonLd data={quizLd} id="quiz-ld" />}

      <MainContainer maxWidth="max-w-[900px]" padding="py-4" className="space-y-5" bgColor="bg-transparent">
        <CustomBreadcrumbs isShow={true} items={breadcrumbItems} />

        {/* The page's <h1> — same header the chapter page uses. */}
        <div className="px-3">
          <CustomizableHeader
            showEyebrow={false}
            heading={`${examName} Exam - ${unFormatSlug(level_id ?? "")} - ${unFormatSlug(subject_id ?? "")}`}
            highlightText={examName}
            subheading={`${examName} exam ${unFormatSlug(level_id ?? "")} preparation with Clear Cutoff`}
            headingColor="text-gray-900"
            highlightColor="text-blue-500"
            subheadingColor="text-gray-600"
            alignment="md:text-center text-left"
            headingClasses="!mb-1"
            headingSize="heading-xlarge !font-semibold"
          />
        </div>

        <div className="w-full bg-white p-4">
          <DetailsSectionCard
            yearId={unFormatSlug(subject_id)}
            Labels={Labels}
            sourceLabel="Subject"
            questionCount={loaded.cards.length}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-2 px-3">
            <div className="heading-small">Subject-wise questions</div>
            {/* --color-success-strong is #00753a, the green used here before. */}
            <div className="flex items-center gap-2 text-[var(--color-success-strong)]">
              <CourseCheckBadge size={20} fill="currentColor" />
              <p>by Clear Cutoff</p>
            </div>
          </div>
          {/* A subject spans every chapter within it, so it groups by
              chapter (one level up from the chapter page's topics). */}
          <QuestionBankView
            locale={locale}
            scope={scope}
            ok={loaded.ok}
            allCards={loaded.cards}
            page={page}
            basePath={localePath(locale, ownPath)}
            chapterPaths={chapterPaths}
          >
            {chapterPaths && (
              <ChapterLinks locale={locale} exam={examNameParam} allCards={loaded.cards} chapterPaths={chapterPaths} />
            )}
          </QuestionBankView>
        </div>
      </MainContainer>
    </>
  );
}
