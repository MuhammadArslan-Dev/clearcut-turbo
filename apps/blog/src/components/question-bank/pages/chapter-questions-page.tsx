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
import type { QuestionScope } from "@/lib/question-bank/scope";
import { isHindiScopePage, loadScopePage } from "@/lib/question-bank/scope-page";
import { pagePath } from "@/lib/question-bank/pagination";
import QuestionBankView, { localePath } from "../question-bank-view";
import { assertPageExists, metadataPage, pageSeo, resolvePageParam } from "./page-param";
import { chapterName, localeOrigin, pageCopy, pageSuffixes } from "./page-copy";

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
  const page = metadataPage(params.page);
  // Same React-cached loads as the page itself — no extra backend calls.
  const [canonical, loaded, t] = await Promise.all([
    canonicalChapter(examName, level_id, subject_id, chapter_name),
    loadScopePage({ kind: "chapter", exam: examName, chapter: chapter_name }, page),
    pageCopy(locale),
  ]);
  const seo = pageSeo(page);
  const suffix = pageSuffixes(t, page);
  const path = `${examName}/${canonical.level}/subject/${canonical.subject}/${chapter_name}${seo.pathSuffix}`;

  // Root layout applies the "%s | Clear Cutoff" title template, so use a
  // bare title here to avoid a doubled site name.
  const labels = {
    exam: unFormatSlug(examName ?? "").toUpperCase(),
    level: unFormatSlug(level_id ?? ""),
    subject: unFormatSlug(subject_id ?? ""),
    chapter: chapterName(loaded.raw, locale, unFormatSlug(chapter_name ?? "")),
  };

  return generateLocaleMetadata({
    locale,
    path,
    title: `${t("chapterTitle", labels)}${suffix.title}`,
    description: `${t("chapterDescription", labels)}${suffix.description}`,
    noindex: canonical.empty,
    // /hi is its own page only when this page's questions have Hindi versions.
    hiTranslated: isHindiScopePage(loaded),
  });
}

export default async function ChapterQuestionsPage({ params }: { params: ChapterParams }) {
  const { locale, examName, level_id, subject_id, chapter_name } = params;

  if (!ALLOWED_EXAMS.includes(examName?.toLowerCase())) {
    notFound();
  }

  // The chapter's questions depend only on exam + chapter slug (not on the
  // level/subject checked below), so start them alongside the index lookup.
  const ownPath = `/${examName}/${level_id}/subject/${subject_id}/${chapter_name}`;
  const page = resolvePageParam(params.page, ownPath, locale);
  const scope: QuestionScope = { kind: "chapter", exam: examName, chapter: chapter_name };
  const dataPromise = Promise.all([loadScopePage(scope, page), loadExamInfo(examName), pageCopy(locale)]);
  dataPromise.catch(() => {}); // see below: still awaited (and thrown) on the render path

  // The backend serves a chapter by exam + slug alone, so any level/subject
  // pair in the URL rendered the same page. Only listed paths render; a real
  // chapter on any other path moves to its canonical one (same page number);
  // unknown ones 404. If the index can't be loaded, render as before.
  const index = await tryLoadExamIndex(examName);
  const resolved = index ? resolveChapterRoute(index, level_id, subject_id, chapter_name) : null;
  if (resolved?.kind === "notFound") notFound();
  if (resolved?.kind === "redirect") {
    const to = `/${examName}/${resolved.to.level}/subject/${resolved.to.subject}/${resolved.to.chapter}`;
    permanentRedirect({ href: pagePath(to, page), locale: locale as AppLocale });
  }
  const canonical: ChapterPath =
    resolved?.kind === "ok" ? resolved.canonical : { level: level_id, subject: subject_id };

  const [loaded, examInfo, t] = await dataPromise;
  assertPageExists(page, loaded.total, loaded.ok);
  const hindiPage = locale === "hi" && isHindiScopePage(loaded);
  const chapterLabel = chapterName(loaded.raw, locale, unFormatSlug(chapter_name ?? ""));

  // `state` is nullable on the backend (national exams like CTET have none).
  const examState = examInfo?.state;
  const Labels = [
    { lable: "Exam", value: examName.toUpperCase() ?? "REET" },
    { lable: "Level", value: unFormatSlug(level_id ?? "") },
    ...(examState ? [{ lable: "State", value: examState }] : []),
  ];

  // Breadcrumbs stay on the visitor's language site (/hi links to /hi).
  const homeUrl = localeOrigin(locale);
  const examsUrl = `${homeUrl}/${examName}`;
  const levelUrl = `${examsUrl}/${level_id}`;
  const subjectUrl = `${levelUrl}/subject`;
  const subjectIdUrl = `${subjectUrl}/${subject_id}`;
  const chapterUrl = `${subjectIdUrl}/${chapter_name}`;

  const breadcrumbItems = [
    { name: t("home"), url: homeUrl || "/" },
    { name: examName, url: examsUrl },
    { name: unFormatSlug(level_id), url: levelUrl },
    { name: t("subject"), url: subjectUrl },
    { name: unFormatSlug(subject_id), url: subjectIdUrl },
    { name: chapterLabel, url: chapterUrl },
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);
  // Structured data describes this page's questions, in the language the
  // page shows, at this page's canonical URL (/hi only for a Hindi page).
  const quizLd = getQuizSchema({
    questions: loaded.raw,
    name: `${unFormatSlug(chapter_name)} - ${unFormatSlug(subject_id)} ${examName.toUpperCase()} ${unFormatSlug(level_id ?? "")} Quiz`,
    url: pagePath(`${localeOrigin(hindiPage ? "hi" : "en")}/${examName}/${canonical.level}/subject/${canonical.subject}/${chapter_name}`, page),
    courseLang: hindiPage ? "hi" : "en",
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
            heading={t("examHeading", { exam: examName.toUpperCase(), level: unFormatSlug(level_id ?? ""), name: chapterLabel })}
            highlightText={examName.toUpperCase()}
            subheading={t("prepSubheading", { exam: examName.toUpperCase(), level: unFormatSlug(level_id ?? "") })}
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
            questionCount={loaded.total}
            yearId={unFormatSlug(chapter_name ?? "")}
          />
        </div>
        <div className="space-y-2 px-3">
          <div className="flex justify-between items-center gap-2">
            <div className="heading-small !font-semibold col-span-3">{t("chapterWise")}</div>
            {/* --color-success-strong is #00753a, the green used here before. */}
            <div className="flex items-center gap-2 text-[var(--color-success-strong)] col-span-2 justify-self-end">
              <CourseCheckBadge size={16} fill="currentColor" />
              <p className="body-medium !font-normal">{t("byClearCutoff")}</p>
            </div>
          </div>
          <QuestionBankView
            locale={locale}
            scope={scope}
            ok={loaded.ok}
            cards={loaded.cards}
            total={loaded.total}
            page={page}
            basePath={localePath(locale, ownPath)}
            chapterPaths={{ [chapter_name]: `${canonical.level}/subject/${canonical.subject}/${chapter_name}` }}
          />
        </div>
      </MainContainer>
    </>
  );
}
