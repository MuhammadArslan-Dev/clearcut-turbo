import { levelLabel } from "@/lib/seo/year-title";
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
import { loadExamInfo, loadSubjectSection } from "@/lib/question-bank/load";
import type { QuestionScope } from "@/lib/question-bank/scope";
import { isHindiScopePage, loadScopePage } from "@/lib/question-bank/scope-page";
import { pagePath } from "@/lib/question-bank/pagination";
import QuestionBankView, { ChapterLinks, localePath } from "../question-bank-view";
import { assertPageExists, metadataPage, pageSeo, resolvePageParam } from "./page-param";
import { localeOrigin, pageCopy, questionBankSeo } from "./page-copy";

export type SubjectParams = {
  locale: string;
  examName: string;
  level_id: string;
  subject_id: string;
  page?: string;
};

/** The page's scope (its level's own section). Page and metadata build it the
 * same way, so the React-cached loadScopePage shares one load. */
async function subjectScope(examName: string, level: string, subject: string): Promise<QuestionScope> {
  const index = await tryLoadExamIndex(examName);
  const section = index ? findSubject(index, level, subject)?.sectionId : undefined;
  return { kind: "subject", exam: examName, subject, section };
}

/** Subject display name: the section's Hindi name on /hi, else the slug label. */
function subjectName(names: { hi: string | null } | undefined, locale: string, fallback: string): string {
  return (locale === "hi" && names?.hi) || fallback;
}

export async function subjectPageMetadata(params: SubjectParams) {
  const { locale, examName, level_id, subject_id } = params;
  const page = metadataPage(params.page);
  const scope = await subjectScope(examName, level_id, subject_id);
  const [canonical, loaded, section, t] = await Promise.all([
    canonicalSubject(examName, level_id, subject_id),
    loadScopePage(scope, page),
    loadSubjectSection(examName, subject_id, scope.kind === "subject" ? scope.section : undefined),
    pageCopy(locale),
  ]);
  const seo = pageSeo(page);
  const path = `${examName}/${canonical.level}/subject/${subject_id}${seo.pathSuffix}`;

  const { title, description } = questionBankSeo(
    t,
    "subject",
    {
      exam: (examName ?? "").toUpperCase(),
      levelSlug: level_id ?? "",
      subjectSlug: subject_id ?? "",
      subject: subjectName(section?.names, locale, unFormatSlug(subject_id ?? "")),
    },
    page,
  );

  return generateLocaleMetadata({
    locale,
    path,
    title,
    description,
    noindex: canonical.empty,
    // /hi is its own page only when this page's questions have Hindi versions.
    hiTranslated: isHindiScopePage(loaded),
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
  const scope = await subjectScope(examNameParam, level_id, subject_id);
  const section = scope.kind === "subject" ? scope.section : undefined;
  const [loaded, examInfo, sectionInfo, t] = await Promise.all([
    loadScopePage(scope, page),
    loadExamInfo(examNameParam),
    loadSubjectSection(examNameParam, subject_id, section),
    pageCopy(locale),
  ]);
  assertPageExists(page, loaded.total, loaded.ok);
  const hindiPage = locale === "hi" && isHindiScopePage(loaded);
  const subjectLabel = subjectName(sectionInfo?.names, locale, unFormatSlug(subject_id ?? ""));

  // `state` is nullable on the backend (national exams like CTET have none).
  const examState = examInfo?.state;
  const Labels = [
    { lable: "Exam", value: examName ?? "REET" },
    { lable: "Level", value: levelLabel(level_id ?? "") },
    ...(examState ? [{ lable: "State", value: examState }] : []),
  ];

  // Breadcrumbs stay on the visitor's language site (/hi links to /hi).
  const homeUrl = localeOrigin(locale);
  const examsUrl = `${homeUrl}/${examNameParam}`;
  const levelUrl = `${examsUrl}/${level_id}`;
  const subjectUrl = `${levelUrl}/subject`;
  const subjectIdUrl = `${subjectUrl}/${subject_id}`;

  const breadcrumbItems = [
    { name: t("home"), url: homeUrl || "/" },
    { name: examName, url: examsUrl },
    { name: levelLabel(level_id ?? ""), url: levelUrl },
    { name: t("subject"), url: subjectUrl },
    { name: subjectLabel, url: subjectIdUrl },
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);
  // In the language the page shows, at its canonical URL (/hi only for a Hindi page).
  const quizLd = getQuizSchema({
    questions: loaded.raw,
    name: `${unFormatSlug(subject_id)} - ${examName} ${levelLabel(level_id ?? "")} Quiz`,
    url: pagePath(`${localeOrigin(hindiPage ? "hi" : "en")}/${examNameParam}/${canonicalLevel}/subject/${subject_id}`, page),
    courseLang: hindiPage ? "hi" : "en",
  });

  // Every chapter of the subject (not just this page's), as before.
  const chapterPaths = index
    ? canonicalChapterPathMap(index, loaded.chapters.map((c) => c.slug))
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
            heading={t("examHeading", { exam: examName, level: levelLabel(level_id ?? ""), name: subjectLabel })}
            highlightText={examName}
            subheading={t("prepSubheading", { exam: examName, level: levelLabel(level_id ?? "") })}
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
            questionCount={loaded.total}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-2 px-3">
            <div className="heading-small">{t("subjectWise")}</div>
            {/* --color-success-strong is #00753a, the green used here before. */}
            <div className="flex items-center gap-2 text-[var(--color-success-strong)]">
              <CourseCheckBadge size={20} fill="currentColor" />
              <p>{t("byClearCutoff")}</p>
            </div>
          </div>
          {/* A subject spans every chapter within it, so it groups by
              chapter (one level up from the chapter page's topics). */}
          <QuestionBankView
            locale={locale}
            scope={scope}
            ok={loaded.ok}
            cards={loaded.cards}
            total={loaded.total}
            chapters={loaded.chapters}
            page={page}
            basePath={localePath(locale, ownPath)}
            chapterPaths={chapterPaths}
          >
            {chapterPaths && (
              <ChapterLinks locale={locale} exam={examNameParam} chapters={loaded.chapters} chapterPaths={chapterPaths} />
            )}
          </QuestionBankView>
        </div>
      </MainContainer>
    </>
  );
}
