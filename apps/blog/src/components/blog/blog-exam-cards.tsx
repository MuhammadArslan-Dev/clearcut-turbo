"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import MainContainer from "@/components/main-container";
import CustomizableHeader from "@/components/customizable-header";
import { useSelectedDataStore } from "@/store/blog/useSelectedDataStore";
import { highlightTextUtil } from "@clearcut/utils/highlight-text";
import { formatToSlug } from "@/utils/slugify";
import { ALLOWED_EXAMS } from "@/lib/exams";
import CourseCard from "@/components/ui/exam/CourseCard";

type ExamFilter = "all" | "central" | "state";

type ExamMetadata = {
  exam_date?: string;
  exam_mode?: string;
  duration?: string;
  cutoff?: string;
};

/**
 * `metadata` arrives as a JSON *string* on the exam payload and is occasionally
 * null for a newly-added exam. The previous card called JSON.parse on it
 * unguarded, so one bad row took the whole listing down — parse defensively and
 * let the row render without its detail lines instead.
 */
function parseMetadata(raw: unknown): ExamMetadata {
  if (!raw) return {};
  if (typeof raw === "object") return raw as ExamMetadata;
  try {
    return JSON.parse(raw as string) as ExamMetadata;
  } catch {
    return {};
  }
}

// The backend marks a nationwide exam by putting "India" in `state` rather than
// by a dedicated flag, so that string is the only signal for the Central vs
// State split the design asks for.
const isCentral = (exam: Exam) => exam.state?.toLowerCase().includes("india");
const isActive = (exam: Exam) => exam.status?.toLowerCase().includes("active");

/**
 * `translation` is a JSON string holding per-locale copies of the display
 * fields, e.g. {"en":{"state":"Haryana"},"hi":{"state":"<hi>"}}. The state
 * sub-heading is the one place on this page that shows a translated value, so
 * fall back to the raw column whenever the locale has no entry (or the row has
 * an empty string, which several rows do).
 */
function localisedState(exam: Exam, locale: string): string {
  try {
    const translation = exam.translation ? JSON.parse(exam.translation) : null;
    const translated = translation?.[locale]?.state;
    if (typeof translated === "string" && translated.trim()) return translated;
  } catch {
    /* fall through to the raw column */
  }
  return exam.state;
}

export default function BlogExamCardsSection({ data }: { data: Exam[] }) {
  const t = useTranslations("blogHome");
  const locale = useLocale();
  const setSelectedCourse = useSelectedDataStore((s) => s.setSelectedCourse);

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ExamFilter>("all");

  // The card's Link navigates; this only keeps the client-side store in step.
  const onSelect = (item: Exam) => setSelectedCourse(item);
  // Clean lowercase exam URL, e.g. "/ctet".
  const examHref = (item: Exam) => `/${formatToSlug(item.short_name)}`;

  // Only show exams that have a real exam page to land on. The card routes to
  // `/${formatToSlug(short_name)}`, and that route 404s for anything outside
  // ALLOWED_EXAMS (see [examName]/page.tsx) — without this filter, exams like
  // REET render a card here whose only destination is a dead end.
  const allowed = React.useMemo(
    () =>
      (data ?? []).filter(
        (item) => ALLOWED_EXAMS.includes(formatToSlug(item.short_name)) && isActive(item),
      ),
    [data],
  );

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allowed.filter((item) => {
      if (filter === "central" && !isCentral(item)) return false;
      if (filter === "state" && isCentral(item)) return false;
      if (!needle) return true;
      // Match the short name a visitor would type ("ctet") as well as the full
      // name and the state, so "haryana" finds HTET.
      return [item.short_name, item.name, item.state]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle));
    });
  }, [allowed, filter, query]);

  const centralExams = visible.filter(isCentral);

  // State exams group under their own state name, in the order the API returns
  // them, so a new state needs no change here.
  const stateExams = visible
    .filter((item) => !isCentral(item))
    .reduce<Record<string, Exam[]>>((groups, exam) => {
      const key = localisedState(exam, locale);
      (groups[key] ??= []).push(exam);
      return groups;
    }, {});

  // Both sections below render an identical card; CourseCard is presentational
  // (flat props), so the Exam → props mapping lives here, once.
  const renderCard = (item: Exam) => {
    const metadata = parseMetadata(item.metadata);
    return (
      <CourseCard
        key={item.id}
        logo={item.logo_url}
        courseName={item.short_name}
        examType={item.exam_type}
        examDate={metadata.exam_date}
        examMode={metadata.exam_mode}
        duration={metadata.duration}
        cutoff={metadata.cutoff}
        href={examHref(item)}
        onClick={() => onSelect(item)}
      />
    );
  };

  const filters: { id: ExamFilter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "central", label: t("filterCentral") },
    { id: "state", label: t("filterState") },
  ];

  return (
    // 1100, not the old 900: the white section panels below are the page's
    // main surface and were too narrow for them. The cards inside stay capped
    // at 540px, so this widens the panels without stretching a card.
    <MainContainer padding="py-4 px-3" bgColor="transparent" maxWidth="max-w-[1100px]">
      <section className="space-y-8">
        <CustomizableHeader
          showEyebrow={false}
          heading={t("title")}
          highlightText={t("titleHighlight")}
          subheading={t("subtitle")}
          headingColor="text-gray-900"
          highlightColor="text-blue-500"
          subheadingColor="text-gray-600"
          alignment="md:text-center text-left"
          headingClasses="!mb-1"
          headingSize="heading-2xlarge !font-semibold"
        />

        {/* Search + filter chips */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <div className="relative w-full sm:max-w-[420px]">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filters.map((option) => {
              const selected = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter(option.id)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    selected
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-slate-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl bg-white px-5 py-10 text-center shadow-sm">
            <p className="body-large !font-medium text-gray-900">{t("emptyTitle")}</p>
            <p className="body-medium !font-normal mt-1 text-gray-600">{t("emptyBody")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {centralExams.length > 0 && (
              <div className="w-full rounded-xl bg-white p-5 shadow-sm">
                <h2 className="heading-xlarge !font-semibold">
                  {highlightTextUtil(t("sectionCentral"), t("sectionCentralHighlight"))}
                </h2>
                <div className="mt-5 grid items-start gap-5 grid-cols-[repeat(auto-fit,minmax(280px,540px))]">
                  {centralExams.map(renderCard)}
                </div>
              </div>
            )}

            {Object.keys(stateExams).length > 0 && (
              <div className="w-full rounded-xl bg-white p-5 shadow-sm">
                <h2 className="heading-xlarge !font-semibold">
                  {highlightTextUtil(t("sectionState"), t("sectionStateHighlight"))}
                </h2>
                <div className="mt-4 space-y-6 md:mt-5">
                  {Object.entries(stateExams).map(([state, exams]) => (
                    <div key={state}>
                      <h3 className="heading-large !font-semibold text-gray-900">{state}</h3>
                      <div className="mt-4 grid items-start gap-5 grid-cols-[repeat(auto-fit,minmax(280px,540px))]">
                        {exams.map(renderCard)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </MainContainer>
  );
}
