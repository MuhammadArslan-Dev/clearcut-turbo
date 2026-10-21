import { getBreadcrumbSchema } from "@/utils/google/get-breadcrumb-schema";
import { unFormatSlug } from "@/utils/slugify";
import MainContainer from "@/components/main-container";
import CourseCheckBadge from "@/components/ui/badge/course-check-badge";
import CustomBreadcrumbs from "@/components/breadcrumbs/custom-breadcrumbs";
import CustomizableHeader from "@/components/customizable-header";
import { capitalizeFirst } from "@clearcut/utils/text-format";
import DetailsSectionCard from "@/components/blog/assessment-question/details-section-card";
import JsonLd from "@clearcut/ui/json-ld";
import { notFound } from "next/navigation";
import { canonicalChapterPathMap, findLevel } from "@/lib/seo/exam-index";
import { tryLoadExamIndex } from "@/lib/seo/load-exam-index";
import { generateLocaleMetadata } from "@/lib/seo/generateLocaleMetadata";
import { yearPageLabels, levelLabel } from "@/lib/seo/year-title";
import { localeOrigin, pageCopy, questionBankSeo } from "./page-copy";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { getQuizSchema } from "@/utils/google/get-quiz-schema";
import { loadExamInfo, loadYears } from "@/lib/question-bank/load";
import { toExamYear, type QuestionScope } from "@/lib/question-bank/scope";
import { isHindiScopePage, loadScopePage } from "@/lib/question-bank/scope-page";
import { pagePath } from "@/lib/question-bank/pagination";
import QuestionBankView, { localePath } from "../question-bank-view";
import { assertPageExists, metadataPage, pageSeo, resolvePageParam } from "./page-param";

export type YearParams = {
  locale: string;
  examName: string;
  level_id: string;
  year_id: string;
  page?: string;
};

const yearScope = (p: YearParams): QuestionScope => ({ kind: "year", exam: p.examName, level: p.level_id, year: p.year_id });

export async function yearPageMetadata(params: YearParams) {
  const { locale, examName, level_id, year_id } = params;
  const page = metadataPage(params.page);
  const seo = pageSeo(page);

  // The years list is exam-wide, so some level/year pairs have no questions:
  // keep those reachable from the year listing but out of the index.
  const [loaded, t] = await Promise.all([loadScopePage(yearScope(params), page), pageCopy(locale)]);
  const labels = yearPageLabels(examName ?? "", level_id ?? "", year_id ?? "");
  const { title, description } = questionBankSeo(
    t,
    "year",
    { exam: labels.exam, levelSlug: level_id ?? "", year: labels.year },
    page,
  );

  return generateLocaleMetadata({
    locale,
    path: `/${examName}/${level_id}/year/${year_id}${seo.pathSuffix}`,
    title,
    description,
    noindex: loaded.ok && loaded.total === 0,
    // A year mixes bilingual subjects with the English/Hindi language
    // sections, so this is decided per page.
    hiTranslated: isHindiScopePage(loaded),
  });
}

export default async function YearQuestionsPage({ params }: { params: YearParams }) {
  const { locale, examName: examNameParam, level_id, year_id } = params;
  const examName = examNameParam?.toUpperCase() ?? "";

  if (!ALLOWED_EXAMS.includes(examNameParam?.toLowerCase())) {
    notFound();
  }

  const ownPath = `/${examNameParam}/${level_id}/year/${year_id}`;
  const page = resolvePageParam(params.page, ownPath, locale);
  const examYear = toExamYear(year_id);
  const scope = yearScope(params);

  const [loaded, examInfo, years, index, t] = await Promise.all([
    loadScopePage(scope, page),
    loadExamInfo(examNameParam),
    loadYears(examNameParam),
    tryLoadExamIndex(examNameParam),
    pageCopy(locale),
  ]);

  // Unknown level or year 404s; only checked when the lookups succeeded.
  if (index && !findLevel(index, level_id)) notFound();
  if (years && !years.some((y) => y.instance_id?.toUpperCase() === examYear)) notFound();
  assertPageExists(page, loaded.total, loaded.ok);
  const hindiPage = locale === "hi" && isHindiScopePage(loaded);

  // `state` is nullable on the backend (national exams like CTET have none).
  const examState = examInfo?.state;
  const Labels = [
    { lable: "Exam", value: examName ?? "REET" },
    { lable: "Level", value: levelLabel(level_id ?? "") ?? "" },
    ...(examState ? [{ lable: "State", value: examState }] : []),
  ];

  // Breadcrumbs stay on the visitor's language site (/hi links to /hi).
  const homeUrl = localeOrigin(locale);
  const breadcrumbItems = [
    { name: t("home"), url: homeUrl || "/" },
    { name: unFormatSlug(examNameParam.toLocaleUpperCase()), url: `${homeUrl}/${examNameParam}` },
    { name: capitalizeFirst(levelLabel(level_id ?? "")), url: `${homeUrl}/${examNameParam}/${level_id}` },
    { name: t("years"), url: `${homeUrl}/${examNameParam}/${level_id}/year` },
    { name: unFormatSlug(examYear.toUpperCase()), url: `${homeUrl}${ownPath}` },
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);
  // In the language the page shows, at its canonical URL (/hi only for a Hindi page).
  const quizLd = getQuizSchema({
    questions: loaded.raw,
    name: `${examName} Exam ${levelLabel(level_id ?? "")} ${unFormatSlug(examYear.toUpperCase())} Quiz`,
    url: pagePath(`${localeOrigin(hindiPage ? "hi" : "en")}${ownPath}`, page),
    courseLang: hindiPage ? "hi" : "en",
  });

  const chapterPaths = index
    ? canonicalChapterPathMap(index, loaded.cards.map((c) => c.chapterSlug ?? ""))
    : undefined;

  return (
    <div>
      {breadcrumbLd && <JsonLd data={breadcrumbLd} />}
      {quizLd && <JsonLd data={quizLd} id="quiz-ld" />}

      <MainContainer maxWidth="max-w-[900px]" padding="py-4" className="space-y-5" bgColor="bg-transparent">
        <div className="px-4">
          <CustomBreadcrumbs padding="0px 4px 20px 4px" isShow={true} items={breadcrumbItems} />
        </div>

        <div className="flex flex-col gap-5">
          <CustomizableHeader
            showEyebrow={false}
            heading={t("yearHeading", { exam: examName, level: levelLabel(level_id ?? "") })}
            highlightText={examName}
            subheading={t("prepSubheading", { exam: examName, level: levelLabel(level_id ?? "") })}
            headingColor="text-gray-900"
            highlightColor="text-blue-500"
            subheadingColor="text-gray-600"
            alignment="md:text-center text-left"
            headingClasses="!mb-1"
            headingSize="heading-xlarge !font-semibold"
            className="px-4"
          />
          <div className="w-full bg-white p-4">
            <DetailsSectionCard
              yearId={unFormatSlug(examYear).toUpperCase()}
              Labels={Labels}
              questionCount={loaded.total}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <CustomizableHeader
            showEyebrow={false}
            as="h2"
            heading={t("verified")}
            headingColor="text-gray-900"
            alignment="md:text-center text-left"
            headingClasses="!mb-0"
            headingSize="heading-xlarge !font-semibold"
            className="px-4"
          />

          <div className="p-4 bg-white space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-2 ">
              <div className="heading-small col-span-1">{t("yearWise")}</div>
              {/* --color-success-strong is #00753a, the green used here before. */}
              <div className="flex items-center gap-2 text-[var(--color-success-strong)] col-span-1 md:justify-self-end">
                <CourseCheckBadge size={16} fill="currentColor" />
                <p>{t("byClearCutoff")}</p>
              </div>
            </div>
            {/* A year spans every subject, so it groups by subject
                ("section" in the backend). */}
            <QuestionBankView
              locale={locale}
              scope={scope}
              ok={loaded.ok}
              cards={loaded.cards}
              total={loaded.total}
              page={page}
              basePath={localePath(locale, ownPath)}
              chapterPaths={chapterPaths}
            />
          </div>
        </div>
      </MainContainer>
    </div>
  );
}
