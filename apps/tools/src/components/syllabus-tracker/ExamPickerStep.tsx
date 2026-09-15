"use client";

import { useEffect, useMemo, useState } from "react";
import Text from "@clearcut/ui/text";
import Skeleton from "@clearcut/ui/skeleton";
import { Chip } from "@clearcut/ui/chip";
import { fetchSyllabusExams, SyllabusExam } from "@/lib/api/syllabusApi";
import { slugify } from "@/lib/syllabusTrackerUrl";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import StepEyebrow from "./StepEyebrow";
import TipCard from "./TipCard";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FilterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 3h9l3 3v15H6z" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

const CapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10L12 5 2 10l10 5 10-5Z" />
    <path d="M6 12.5V17c0 1.1 2.7 3 6 3s6-1.9 6-3v-4.5" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
  </svg>
);

/** Real exam icon, not a decorative one — picked from the exam's own
 * exam_type (an "Eligiblity" exam vs a "Job" recruitment exam are visibly
 * different things), rather than initials or an arbitrary glyph. Used only
 * as the fallback for ExamLogo below, when the exam has no logo_url or its
 * image fails to load. */
function ExamTypeIcon({ examType }: { examType: string }) {
  return examType.toLowerCase().includes("job") ? <BriefcaseIcon /> : <CapIcon />;
}

/** The exam's real logo (backend-hosted, e.g. an S3 image) when available,
 * falling back to a generic exam-type icon otherwise — either because the
 * backend has no logo for this exam, or the image failed to load. Owns its
 * own circular wrapper (not just the glyph) because a real logo — usually
 * already colourful/branded — sits better on a plain white disc than on the
 * same tinted background the icon fallback uses. */
function ExamLogo({ exam, tone }: { exam: SyllabusExam; tone: { bg: string; text: string } }) {
  const [failed, setFailed] = useState(false);
  const hasLogo = Boolean(exam.logo_url) && !failed;

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${hasLogo ? "border border-[var(--color-border-gray-subtle)] bg-white" : ""}`}
      style={hasLogo ? undefined : { background: tone.bg, color: tone.text }}
    >
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={exam.logo_url!}
          alt=""
          className="h-full w-full rounded-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ExamTypeIcon examType={exam.exam_type} />
      )}
    </div>
  );
}

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M14 5h5v5M19 5l-9 9M8 5H5v14h14v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Purely decorative rotation — every value is an existing design-token pair
// (background + matching text colour), not a new hardcoded colour, so the
// per-card tint has no semantic meaning (it isn't tied to exam_type/state).
const TONES = [
  { bg: "var(--color-primary-subtle)", text: "var(--color-primary-strong)" },
  { bg: "var(--color-success-soft)", text: "var(--color-success-strong)" },
  { bg: "var(--color-warning-bg-soft)", text: "var(--color-warning-strong)" },
  { bg: "var(--color-danger-bg-soft)", text: "var(--color-danger-strong)" },
  { bg: "var(--color-gray-bg-soft)", text: "var(--color-gray-strong)" },
];

// Internal sentinel for "no state filter applied" — kept locale-independent
// so it can never collide with a real (translated-for-display) state name;
// see ALL_STATES's translated label (t.allStates) for what the user sees.
const ALL_STATES = "__all__";

export default function ExamPickerStep({
  onSelect,
  autoSelectSlug,
  onInvalidSlug,
  excludeExamIds,
  locale = "en",
}: {
  onSelect: (exam: SyllabusExam) => void;
  /** From the URL (e.g. "htet") — when present and it matches a loaded exam,
   * that exam is selected automatically instead of showing the grid. */
  autoSelectSlug?: string;
  /** Called once if autoSelectSlug didn't match any loaded exam, so the
   * caller can drop the bad slug from the URL and fall back to the picker. */
  onInvalidSlug?: () => void;
  /** Exam ids to hide from the grid — used by the "Add More Exam" flow so
   * exams the user already tracks don't show up as selectable again. */
  excludeExamIds?: number[];
  locale?: Locale;
}) {
  const t = getSyllabusStrings(locale);
  const whatsappUrl = "https://wa.me/917210708599?text=" + encodeURIComponent(t.whatsappRequestMessage);
  const [exams, setExams] = useState<SyllabusExam[] | null>(null);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState(ALL_STATES);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    fetchSyllabusExams()
      .then((data) => {
        if (!cancelled) setExams(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  useEffect(() => {
    if (!exams || !autoSelectSlug) return;
    const match = exams.find((exam) => slugify(exam.short_name) === autoSelectSlug);
    if (match) onSelect(match);
    else onInvalidSlug?.();
    // Runs once per (exams, autoSelectSlug) pair — onSelect/onInvalidSlug are
    // stable-enough callbacks from the parent and intentionally excluded so
    // this doesn't refire on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exams, autoSelectSlug]);

  const isResolvingSlug = Boolean(autoSelectSlug) && exams !== null;

  const states = useMemo(() => {
    if (!exams) return [];
    return Array.from(new Set(exams.map((e) => e.state))).sort();
  }, [exams]);

  const filtered = useMemo(() => {
    if (!exams) return [];
    const q = search.trim().toLowerCase();
    return exams.filter((e) => {
      if (excludeExamIds?.includes(e.id)) return false;
      const matchesSearch = !q || e.short_name.toLowerCase().includes(q) || e.name.toLowerCase().includes(q);
      const matchesState = stateFilter === ALL_STATES || e.state === stateFilter;
      return matchesSearch && matchesState;
    });
  }, [exams, search, stateFilter, excludeExamIds]);

  return (
    <div className="cc-step-in flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StepEyebrow step={1} locale={locale} />
          <Text as="h1" variant="heading-large" weight="semibold" color="gray-normal">
            {t.chooseExamTitle}
          </Text>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-1">
            {t.chooseExamSubtitle}
          </Text>
        </div>
        <TipCard
          icon={<CapIcon />}
          title={t.examTipTitle}
          description={t.examTipDescription}
        />
      </div>

      {exams && exams.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-gray-muted">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchExamsPlaceholder}
              className="w-full rounded-xl border border-[var(--color-border-gray-subtle)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand">
              <FilterIcon />
            </span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[var(--color-border-gray-subtle)] bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-text-gray-normal outline-none focus:border-brand"
            >
              <option value={ALL_STATES}>{t.allStates}</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border-gray-subtle)] py-14 text-center">
          <Text as="p" variant="body-medium" weight="medium" color="gray-normal">
            {t.examListError}
          </Text>
          <button
            type="button"
            onClick={() => setRetryCount((n) => n + 1)}
            className="text-sm font-medium text-brand hover:underline"
          >
            {t.tryAgain}
          </button>
        </div>
      ) : !exams || isResolvingSlug ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={130} borderRadius={16} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-[var(--color-border-gray-subtle)] py-10 text-center">
          <Text as="p" variant="body-medium" weight="medium" color="gray-normal">
            {t.noExamsMatch}
          </Text>
          <Text as="p" variant="body-small" color="gray-muted">
            {t.noExamsMatchHint}
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((exam, i) => {
            const tone = TONES[i % TONES.length];
            return (
              <button
                key={exam.id}
                type="button"
                onClick={() => onSelect(exam)}
                style={{ animationDelay: `${i * 30}ms` }}
                className="cc-step-in group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-brand hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1 active:translate-y-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <ExamLogo exam={exam} tone={tone} />
                    <div>
                      <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="group-hover:text-brand transition-colors">
                        {exam.short_name}
                      </Text>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Chip size="sm" className="bg-[var(--color-gray-bg-soft)]" labelClassName="text-[var(--color-gray-strong)]">
                          {exam.state}
                        </Chip>
                        <Chip size="sm" className="bg-[var(--color-primary-subtle)]" labelClassName="text-[var(--color-primary-strong)]">
                          {exam.exam_type}
                        </Chip>
                      </div>
                    </div>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-gray-subtle)] text-brand transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                    <ChevronIcon />
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <Text as="p" variant="body-small" color="gray-muted" className="line-clamp-2">
                    {exam.name}
                  </Text>
                  <span className="mt-0.5 shrink-0 text-text-gray-muted">
                    <DocIcon />
                  </span>
                </div>
              </button>
            );
          })}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ animationDelay: `${filtered.length * 30}ms` }}
            className="cc-step-in flex flex-col gap-2 rounded-2xl border border-dashed border-[var(--color-border-gray-subtle)] bg-white p-4 transition-colors hover:border-brand"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-brand">
                <PlusIcon />
              </div>
              <div>
                <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                  {t.cantFindExam}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted">
                  {t.cantFindExamHint}
                </Text>
              </div>
            </div>
            <span className="mt-1 flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-border-gray-subtle)] px-3 py-1.5 text-xs font-semibold text-brand">
              {t.requestExam} <ExternalLinkIcon />
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
