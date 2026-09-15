"use client";

import { useEffect, useMemo, useState } from "react";
import Text from "@clearcut/ui/text";
import Skeleton from "@clearcut/ui/skeleton";
import { Button } from "@clearcut/ui/button";
import { SyllabusExam, SyllabusLevel } from "@/lib/api/syllabusApi";
import { levelSlug } from "@/lib/syllabusTrackerUrl";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import StepEyebrow from "./StepEyebrow";
import TipCard from "./TipCard";

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LayersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 2 8l10 5 10-5-10-5Z" />
    <path d="M2 13l10 5 10-5" />
  </svg>
);

const CapIcon = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10L12 5 2 10l10 5 10-5Z" />
    <path d="M6 12.5V17c0 1.1 2.7 3 6 3s6-1.9 6-3v-4.5" />
  </svg>
);

const StackIcon = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="4" rx="1" />
    <rect x="4" y="10" width="16" height="4" rx="1" />
    <rect x="4" y="16" width="16" height="4" rx="1" />
  </svg>
);

const DocIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h9l3 3v15H6z" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);

const BookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.5c-1.5-1-4-1.5-6-1v13c2 0 4.5.5 6 1.5M12 6.5c1.5-1 4-1.5 6-1v13c-2 0-4.5.5-6 1.5M12 6.5v14" />
  </svg>
);

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
      style={{ borderColor: selected ? "var(--color-brand)" : "var(--color-border-gray-subtle)" }}
    >
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
    </span>
  );
}

/** Same card visual as LevelPickerStep's LevelCard — kept as its own small
 * copy here rather than shared, since PaperPickerStep only ever needs the
 * two bullets, never the `group` subtitle (a paper's own name already says
 * everything a subtitle would). */
function PaperCard({
  title,
  bulletOne,
  bulletTwo,
  selected,
  isFullExam,
  onClick,
  delay,
}: {
  title: string;
  bulletOne: string;
  bulletTwo: string;
  selected: boolean;
  isFullExam?: boolean;
  onClick: () => void;
  delay: number;
}) {
  const accent = isFullExam ? "var(--color-success)" : "var(--color-brand)";
  const iconBg = isFullExam ? "var(--color-success-soft)" : "var(--color-primary-subtle)";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms`, borderColor: selected ? "var(--color-brand)" : "var(--color-border-gray-subtle)" }}
      className={`cc-step-in flex flex-col gap-4 rounded-2xl border-2 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
        selected ? "shadow-[0_4px_16px_rgba(0,131,255,0.12)]" : "hover:border-brand/40"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: iconBg }}>
          {isFullExam ? <StackIcon color={accent} /> : <CapIcon color={accent} />}
        </div>
        <RadioDot selected={selected} />
      </div>

      <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
        {title}
      </Text>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-text-gray-muted">
          <DocIcon />
          <Text as="span" variant="body-small" color="gray-muted">
            {bulletOne}
          </Text>
        </div>
        <div className="flex items-center gap-2 text-text-gray-muted">
          <BookIcon />
          <Text as="span" variant="body-small" color="gray-muted">
            {bulletTwo}
          </Text>
        </div>
      </div>
    </button>
  );
}

/** Explicit "which paper" step, shown only for exams whose level tree has a
 * root-level `group: "Paper"` tier (confirmed live against CTET's real data
 * — Paper 1/Paper 2, each with its own subjects). SyllabusTrackerApp already
 * fetched `levels` (to decide whether to show this step at all), so this
 * component takes them as a prop rather than fetching its own copy. */
export default function PaperPickerStep({
  exam,
  levels,
  onSelect,
  onBack,
  autoSelectSlug,
  onInvalidSlug,
  excludePaperIds,
  locale = "en",
}: {
  exam: Pick<SyllabusExam, "id" | "short_name">;
  levels: SyllabusLevel[];
  onSelect: (paper: SyllabusLevel | "full-exam") => void;
  onBack: () => void;
  /** From the URL (e.g. "paper-2") or an Add Paper deep link — when present
   * and it matches a loaded, non-excluded paper, that paper is selected
   * automatically instead of showing the grid. */
  autoSelectSlug?: string;
  /** Called once if autoSelectSlug didn't match any available paper. */
  onInvalidSlug?: () => void;
  /** Papers to hide — the ones this exam already tracks (Add Paper flow). */
  excludePaperIds?: number[];
  locale?: Locale;
}) {
  const t = getSyllabusStrings(locale);
  const [pending, setPending] = useState<SyllabusLevel | "full-exam" | null>(null);

  const papers = useMemo(
    () => levels.filter((l) => l.parent_id === null && l.group === "Paper" && !excludePaperIds?.includes(l.id)),
    [levels, excludePaperIds],
  );

  const showFullExamOption = papers.length > 1;

  useEffect(() => {
    if (!autoSelectSlug) return;
    if (autoSelectSlug === "full-exam") {
      if (showFullExamOption) onSelect("full-exam");
      else onInvalidSlug?.();
      return;
    }
    const match = papers.find((p) => levelSlug(p) === autoSelectSlug);
    if (match) onSelect(match);
    else onInvalidSlug?.();
    // Runs once per (papers, autoSelectSlug) pair — onSelect/onInvalidSlug are
    // stable-enough callbacks from the parent and intentionally excluded so
    // this doesn't refire on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papers, autoSelectSlug]);

  const isAutoWalking = Boolean(autoSelectSlug);

  const handleContinue = () => {
    if (pending === null) return;
    onSelect(pending);
  };

  return (
    <div className="cc-step-in flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StepEyebrow step={2} total={4} locale={locale} />
          <Text as="h1" variant="heading-large" weight="semibold" color="gray-normal">
            {t.selectNounFor(t.paperNoun, exam.short_name)}
          </Text>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-1">
            {t.choosePaperHint}
          </Text>
        </div>
        <TipCard icon={<LayersIcon />} title={t.paperTipTitle} description={t.paperTipDescription} />
      </div>

      {isAutoWalking ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={190} borderRadius={16} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {papers.map((paper, i) => (
            <PaperCard
              key={paper.id}
              title={paper.name}
              bulletOne={t.chooseNounWithin(t.subjectNoun, paper.name)}
              bulletTwo={t.includesRelevantSubjects}
              selected={pending !== "full-exam" && pending?.id === paper.id}
              onClick={() => setPending(paper)}
              delay={i * 30}
            />
          ))}
          {showFullExamOption && (
            <PaperCard
              title={t.fullExamTitle(exam.short_name)}
              bulletOne={t.trackCutoffAllLevels}
              bulletTwo={t.includesAllSubjectsAndLevels}
              selected={pending === "full-exam"}
              isFullExam
              onClick={() => setPending("full-exam")}
              delay={papers.length * 30}
            />
          )}
        </div>
      )}

      {/* See LevelPickerStep's identical comment on why `sticky` (not `fixed`). */}
      <div className="sticky bottom-0 z-[var(--z-floating-cta)] -mx-3 mt-2 flex items-center justify-between border-t border-[var(--color-border-gray-subtle)] bg-white/95 px-3 py-3 backdrop-blur sm:mx-0 sm:rounded-sm sm:border">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
          <BackIcon /> {t.back}
        </button>
        {!isAutoWalking && (
          <Button disabled={pending === null} onClick={handleContinue} rightIcon={<ForwardIcon />}>
            {t.continueLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
