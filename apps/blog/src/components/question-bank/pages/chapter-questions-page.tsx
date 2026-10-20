import MainContainer from "@/components/main-container";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import { unFormatSlug } from "@/utils/slugify";
import DetailsSectionCard from "@/components/blog/assessment-question/details-section-card";
import CustomizableHeader from "@/components/customizable-header";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import JsonLd from "@clearcut/ui/json-ld";
import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { getQuizSchema } from "@/utils/google/get-quiz-schema";
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import { AppLocale } from "@/types/components/language";
import { resolveChapterRoute, type ChapterPath } from "@/lib/seo/exam-index";
import { tryLoadExamIndex } from "@/lib/seo/load-exam-index";
import { canonicalChapter } from "@/lib/seo/canonical";
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { loadExamInfo } from "@/lib/question-bank/load";
import { loadScope, type QuestionScope } from "@/lib/question-bank/scope";
import { pagePath, pageSlice } from "@/lib/question-bank/pagination";
import QuestionBankView, { localePath } from "../question-bank-view";
import { assertPageExists, metadataPage, pageSeo, resolvePageParam } from "./page-param";

export type ChapterParams = {
  locale: string;
  examName: string;
  level_id: string;
  subject_id: string;
  chapter_name: string;
  page?: string;
};

export async function chapterPageMetadata(params: ChapterParams) {
  const { locale, examName, level_id, subject_id, chapter_name } = params;
  const canonical = await canonicalChapter(examName, level_id, subject_id, chapter_name);
  const seo = pageSeo(metadataPage(params.page));
  const path = `${examName}/${canonical.level}/subject/${canonical.subject}/${chapter_name}${seo.pathSuffix}`;

  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  const examLabel = unFormatSlug(examName ?? "").toUpperCase();
  const levelLabel = unFormatSlug(level_id ?? "");
  const subjectLabel = unFormatSlug(subject_id ?? "");
  const chapterLabel = unFormatSlug(chapter_name ?? "");

  return generateLocaleMetadata({
    locale,
    path,
    title: `${chapterLabel} - ${subjectLabel} ${examLabel} ${levelLabel} Questions${seo.titleSuffix}`,
    description: `${chapterLabel} practice questions from ${subjectLabel} for ${examLabel} Exam ${levelLabel}, free on Clear Cutoff.${seo.descriptionSuffix}`,
    noindex: canonical.empty,
  });
}

export default async function ChapterQuestionsPage({ params }: { params: ChapterParams }) {
  const { locale, examName, level_id, subject_id, chapter_name } = params;

  if (!ALLOWED_EXAMS.includes(examName?.toLowerCase())) {
    notFound();
  }

  // The backend serves a chapter by exam + slug alone, so any level/subject
  // pair in the URL rendered the same page. Only listed paths render; a real
  // chapter on any other path moves to its canonical one (same page number);
  // unknown ones 404. If the index can't be loaded, render as before.
  const index = await tryLoadExamIndex(examName);
  const resolved = index ? resolveChapterRoute(index, level_id, subject_id, chapter_name) : null;
  const ownPath = `/${examName}/${level_id}/subject/${subject_id}/${chapter_name}`;
  const page = resolvePageParam(params.page, ownPath, locale);
  if (resolved?.kind === "notFound") notFound();
  if (resolved?.kind === "redirect") {
    const to = `/${examName}/${resolved.to.level}/subject/${resolved.to.subject}/${resolved.to.chapter}`;
    permanentRedirect({ href: pagePath(to, page), locale: locale as AppLocale });
  }
  const canonical: ChapterPath =
    resolved?.kind === "ok" ? resolved.canonical : { level: level_id, subject: subject_id };

  const scope: QuestionScope = { kind: "chapter", exam: examName, chapter: chapter_name };
  const [loaded, examInfo] = await Promise.all([loadScope(scope), loadExamInfo(examName)]);
  assertPageExists(page, loaded.cards.length, loaded.ok);

  // `state` is nullable on the backend (national exams like CTET have none).
  const examState = examInfo?.state;
  const Labels = [
    { lable: "Exam", value: examName.toUpperCase() ?? "REET" },
    { lable: "Level", value: unFormatSlug(level_id ?? "") },
    ...(examState ? [{ lable: "State", value: examState }] : []),
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const homeUrl = siteUrl;
  const examsUrl = `${homeUrl}/${examName}`;
  const levelUrl = `${examsUrl}/${level_id}`;
  const subjectUrl = `${levelUrl}/subject`;
  const subjectIdUrl = `${subjectUrl}/${subject_id}`;
  const chapterUrl = `${subjectIdUrl}/${chapter_name}`;

  const breadcrumbItems = [
    { name: "Home", url: homeUrl || "/" },
    { name: examName, url: examsUrl },
    { name: unFormatSlug(level_id), url: levelUrl },
    { name: "Subject", url: subjectUrl },
    { name: unFormatSlug(subject_id), url: subjectIdUrl },
    { name: unFormatSlug(chapter_name), url: chapterUrl },
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);
  // Structured data describes this page's questions, at this page's URL.
  const pageIds = new Set(pageSlice(loaded.cards, page).map((c) => c.id));
  const quizLd = getQuizSchema({
    questions: loaded.raw.filter((q) => pageIds.has(q.id)),
    name: `${unFormatSlug(chapter_name)} - ${unFormatSlug(subject_id)} ${examName.toUpperCase()} ${unFormatSlug(level_id ?? "")} Quiz`,
    url: pagePath(`${examsUrl}/${canonical.level}/subject/${canonical.subject}/${chapter_name}`, page),
    // Questions server-render in English on /hi too (courseLanguage default).
    courseLang: "en",
  });

  return (
    <>
      {breadcrumbLd && <JsonLd data={breadcrumbLd} />}
      {quizLd && <JsonLd data={quizLd} id="quiz-ld" />}

      <MainContainer maxWidth="max-w-[900px]" padding="py-4" className="space-y-5" bgColor="bg-transparent">
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
          <DetailsSectionCard
            sourceLabel="Chapter"
            Labels={Labels}
            questionCount={loaded.cards.length}
            yearId={unFormatSlug(chapter_name ?? "")}
          />
        </div>
        <div className="space-y-2 px-3">
          <div className="flex justify-between items-center gap-2">
            <div className="heading-small !font-semibold col-span-3">Chapter-wise questions</div>
            {/* --color-success-strong is #00753a, the green used here before. */}
            <div className="flex items-center gap-2 text-[var(--color-success-strong)] col-span-2 justify-self-end">
              <CourseCheckBadge size={16} fill="currentColor" />
              <p className="body-medium !font-normal">by Clear Cutoff</p>
            </div>
          </div>
          <QuestionBankView
            locale={locale}
            scope={scope}
            ok={loaded.ok}
            allCards={loaded.cards}
            page={page}
            basePath={localePath(locale, ownPath)}
            chapterPaths={{ [chapter_name]: `${canonical.level}/subject/${canonical.subject}/${chapter_name}` }}
          />
        </div>
      </MainContainer>
    </>
  );
}
