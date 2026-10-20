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
import { yearPageSeo } from "@/lib/seo/year-title";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { getQuizSchema } from "@/utils/google/get-quiz-schema";
import { loadExamInfo, loadYears } from "@/lib/question-bank/load";
import { loadScope, toExamYear, type QuestionScope } from "@/lib/question-bank/scope";
import { pagePath, pageSlice } from "@/lib/question-bank/pagination";
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
  const seo = pageSeo(metadataPage(params.page));

  // The years list is exam-wide, so some level/year pairs have no questions:
  // keep those reachable from the year listing but out of the index.
  const loaded = await loadScope(yearScope(params));
  const base = yearPageSeo(examName ?? "", level_id ?? "", year_id ?? "");

  return generateLocaleMetadata({
    locale,
    path: `/${examName}/${level_id}/year/${year_id}${seo.pathSuffix}`,
    title: `${base.title}${seo.titleSuffix}`,
    description: `${base.description}${seo.descriptionSuffix}`,
    noindex: loaded.ok && loaded.cards.length === 0,
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

  const [loaded, examInfo, years, index] = await Promise.all([
    loadScope(scope),
    loadExamInfo(examNameParam),
    loadYears(examNameParam),
    tryLoadExamIndex(examNameParam),
  ]);

  // Unknown level or year 404s; only checked when the lookups succeeded.
  if (index && !findLevel(index, level_id)) notFound();
  if (years && !years.some((y) => y.instance_id?.toUpperCase() === examYear)) notFound();
  assertPageExists(page, loaded.cards.length, loaded.ok);

  // `state` is nullable on the backend (national exams like CTET have none).
  const examState = examInfo?.state;
  const Labels = [
    { lable: "Exam", value: examName ?? "REET" },
    { lable: "Level", value: unFormatSlug(level_id ?? "") ?? "" },
    ...(examState ? [{ lable: "State", value: examState }] : []),
  ];

  const homeUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const breadcrumbItems = [
    { name: "Home", url: homeUrl || "/" },
    { name: unFormatSlug(examNameParam.toLocaleUpperCase()), url: `${homeUrl}/${examNameParam}` },
    { name: capitalizeFirst(unFormatSlug(level_id)), url: `${homeUrl}/${examNameParam}/${level_id}` },
    { name: "Years", url: `${homeUrl}/${examNameParam}/${level_id}/year` },
    { name: unFormatSlug(examYear.toUpperCase()), url: `${homeUrl}${ownPath}` },
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbItems);
  const pageIds = new Set(pageSlice(loaded.cards, page).map((c) => c.id));
  const quizLd = getQuizSchema({
    questions: loaded.raw.filter((q) => pageIds.has(q.id)),
    name: `${examName} Exam ${unFormatSlug(level_id ?? "")} ${unFormatSlug(examYear.toUpperCase())} Quiz`,
    url: pagePath(`${homeUrl}${ownPath}`, page),
    // Questions server-render in English on /hi too (courseLanguage default).
    courseLang: "en",
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
            heading={`${examName} Exam ${unFormatSlug(level_id ?? "")}`}
            highlightText={examName}
            subheading={`${examName} exam ${unFormatSlug(level_id ?? "")} preparation with Clear Cutoff`}
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
              questionCount={loaded.cards.length}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <CustomizableHeader
            showEyebrow={false}
            heading={`Verified Answers and Explanations`}
            headingColor="text-gray-900"
            alignment="md:text-center text-left"
            headingClasses="!mb-0"
            headingSize="heading-xlarge !font-semibold"
            className="px-4"
          />

          <div className="p-4 bg-white space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-2 ">
              <div className="heading-small col-span-1">Year-wise questions</div>
              {/* --color-success-strong is #00753a, the green used here before. */}
              <div className="flex items-center gap-2 text-[var(--color-success-strong)] col-span-1 md:justify-self-end">
                <CourseCheckBadge size={16} fill="currentColor" />
                <p>by Clear Cutoff</p>
              </div>
            </div>
            {/* A year spans every subject, so it groups by subject
                ("section" in the backend). */}
            <QuestionBankView
              locale={locale}
              scope={scope}
              ok={loaded.ok}
              allCards={loaded.cards}
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
