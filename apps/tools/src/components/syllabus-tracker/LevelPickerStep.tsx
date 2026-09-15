"use client";

import { useEffect, useMemo, useState } from "react";
import Text from "@clearcut/ui/text";
import Skeleton from "@clearcut/ui/skeleton";
import { Button } from "@clearcut/ui/button";
import { fetchSyllabusLevels, SyllabusExam, SyllabusLevel } from "@/lib/api/syllabusApi";
import { levelSlug } from "@/lib/syllabusTrackerUrl";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import StepEyebrow from "./StepEyebrow";
import TipCard from "./TipCard";

export interface SelectedLevel {
  id: number | "full-exam";
  name: string;
}

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

const BarChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 20V10M12 20V4M18 20v-7" />
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

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 8v.01" strokeLinecap="round" />
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

/** A single choice/level card — matches the reference design: icon badge,
 * radio indicator, title, an optional short data-derived subtitle (the
 * level's `group`, when the backend supplies one — never a fabricated
 * grade-range or description we have no source of truth for), and two
 * feature bullets describing what selecting it does. */
function LevelCard({
  title,
  group,
  bulletOne,
  bulletTwo,
  selected,
  isFullExam,
  onClick,
  delay,
}: {
  title: string;
  group?: string | null;
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

      <div>
        <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
          {title}
        </Text>
        {group && (
          <Text as="p" variant="body-small" color="gray-muted" className="mt-0.5">
            {group}
          </Text>
        )}
      </div>

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

// Some exams are a single flat list of levels (HTET: Level 1/2/3). Others
// nest multiple choice points under a level — REET's "Paper 1" branches into
// a language-subject choice, which itself branches into an optional-subject
// choice, and chapters are only ever mapped to the deepest (leaf) node, not
// to "Paper 1" itself. This drills down one depth at a time — picking a node
// with children reveals its children instead of finishing the step; picking
// a childless (leaf) node finishes it. `path` is every node picked so far,
// root-first, and is what the URL slug is built from (see levelSlug in
// syllabusTrackerUrl.ts) and what the tracker ultimately fetches the full
// syllabus tree for (the LAST entry, i.e. the leaf).
//
// Selecting a card only stages it (`pendingSelection`) — the user confirms
// with "Continue", matching the reference design's radio-then-continue
// pattern rather than navigating on the first click. A URL-driven auto-walk
// (autoSelectPath) bypasses staging entirely and drills/selects immediately,
// since that's restoring an already-made choice, not a fresh one.
export default function LevelPickerStep({
  exam,
  onSelect,
  onBack,
  autoSelectPath,
  onInvalidSlug,
  rootLevel,
  preloadedLevels,
  excludeRootIds,
  stepNumber = 2,
  stepTotal = 3,
  locale = "en",
}: {
  exam: Pick<SyllabusExam, "id" | "short_name">;
  onSelect: (level: SelectedLevel, path: SyllabusLevel[]) => void;
  onBack: () => void;
  /** Remaining URL slug segments after the exam (e.g. ["paper-1", "english-and-hindi"]) —
   * walked one depth at a time as each matches, auto-drilling/selecting. */
  autoSelectPath?: string[];
  /** Called once if autoSelectPath's next segment didn't match anything at
   * the depth reached so far. */
  onInvalidSlug?: () => void;
  /** When the caller (SyllabusTrackerApp) already drove an explicit Paper
   * step, this is the paper the user picked — seeds `path` so this step
   * starts showing THAT paper's children instead of the exam's own root
   * options, and "Back" from the first screen returns to the Paper step
   * instead of the exam picker. Omitted entirely for exams with no Paper
   * tier, which behave exactly as before. */
  rootLevel?: { id: number; name: string; group?: string | null };
  /** Skips this component's own fetchSyllabusLevels call when the caller
   * already fetched the same exam's levels (e.g. to detect a Paper tier
   * before deciding which step to show). Omitted = self-fetch, unchanged
   * from today's behavior. */
  preloadedLevels?: SyllabusLevel[];
  /** Root-tier option ids to hide — the "Add Level" flow for an exam with no
   * explicit Paper step (e.g. HTET's Level 1/2/3): the caller drives
   * straight into this component with no `rootLevel` seeded, so already-
   * tracked root options need filtering out here instead. Has no effect
   * once `path` has drilled past the root tier. */
  excludeRootIds?: number[];
  /** "STEP X OF Y" eyebrow — defaults to 2 of 3 (today's behavior). An exam
   * with an explicit Paper step before this one is 3 of 4. */
  stepNumber?: number;
  stepTotal?: number;
  locale?: Locale;
}) {
  const t = getSyllabusStrings(locale);
  const [levels, setLevels] = useState<SyllabusLevel[] | null>(preloadedLevels ?? null);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [path, setPath] = useState<SyllabusLevel[]>(
    rootLevel ? [{ ...rootLevel, parent_id: null, group: rootLevel.group ?? null }] : [],
  );
  const [autoWalked, setAutoWalked] = useState(0);
  const [pending, setPending] = useState<SyllabusLevel | "full-exam" | null>(null);
  // Back from the first screen after a seeded rootLevel returns to the
  // caller's Paper step rather than popping past it into nothing.
  const baseDepth = rootLevel ? 1 : 0;

  useEffect(() => {
    if (preloadedLevels) return;
    let cancelled = false;
    setLevels(null);
    setError(false);
    setAutoWalked(0);
    setPending(null);
    fetchSyllabusLevels(exam.id)
      .then((data) => {
        if (!cancelled) setLevels(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.id, retryCount, preloadedLevels]);

  const parentId = path.length ? path[path.length - 1].id : null;
  const childrenAt = (id: number | null) => (levels ?? []).filter((l) => l.parent_id === id);
  // Already-tracked root options (Add Level/Add Paper flow) are only ever
  // hidden at the very top of the tree — once the user has drilled past the
  // root tier, excludeRootIds has nothing left to say about the remaining,
  // unrelated nested options.
  const currentOptions = useMemo(() => {
    const opts = childrenAt(parentId);
    if (path.length === 0 && excludeRootIds?.length) {
      return opts.filter((o) => !excludeRootIds.includes(o.id));
    }
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, parentId, path.length, excludeRootIds]);

  const showFullExamOption = path.length === 0 && currentOptions.length > 1;

  // Immediate drill/select — used only by the URL auto-walk, which is
  // restoring a choice already made, not staging a new one.
  const autoAdvance = (node: SyllabusLevel) => {
    const hasChildren = childrenAt(node.id).length > 0;
    if (hasChildren) {
      setPath((prev) => [...prev, node]);
    } else {
      onSelect({ id: node.id, name: node.name }, [...path, node]);
    }
  };

  // Auto-drive the drill from the URL, one depth at a time, as soon as
  // levels are loaded and each successive segment resolves.
  useEffect(() => {
    if (!levels || !autoSelectPath) return;
    const nextSlug = autoSelectPath[autoWalked];
    if (nextSlug === undefined) return; // nothing left to walk — show the picker at this depth
    if (nextSlug === "full-exam") {
      if (showFullExamOption || childrenAt(null).length === 1) {
        onSelect({ id: "full-exam", name: t.fullExamTitle(exam.short_name) }, []);
      } else {
        onInvalidSlug?.();
      }
      return;
    }
    const match = currentOptions.find((o) => levelSlug(o) === nextSlug);
    if (!match) {
      onInvalidSlug?.();
      return;
    }
    setAutoWalked((n) => n + 1);
    autoAdvance(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, currentOptions, autoSelectPath, autoWalked]);

  const isAutoWalking = Boolean(autoSelectPath) && autoWalked < (autoSelectPath?.length ?? 0);

  const handleBack = () => {
    if (pending !== null) {
      setPending(null);
    } else if (path.length <= baseDepth) {
      onBack();
    } else {
      setPath((prev) => prev.slice(0, -1));
    }
  };

  const handleContinue = () => {
    if (pending === null) return;
    if (pending === "full-exam") {
      onSelect({ id: "full-exam", name: t.fullExamTitle(exam.short_name) }, []);
      return;
    }
    const hasChildren = childrenAt(pending.id).length > 0;
    if (hasChildren) {
      setPath((prev) => [...prev, pending]);
      setPending(null);
    } else {
      onSelect({ id: pending.id, name: pending.name }, [...path, pending]);
    }
  };

  const stepTitle = path.length === 0 ? exam.short_name : path[path.length - 1].name;
  const breadcrumb = [exam.short_name, ...path.map((p) => p.name)];
  const noun = path.length === 0 ? t.levelNoun : t.subjectNoun;

  // The bottom action bar's right-hand button, when there's something to
  // continue to — null while loading/erroring (Back is still available via
  // the same bar) so callers don't have to duplicate this per branch.
  const continueAction =
    !levels || isAutoWalking || error
      ? null
      : currentOptions.length === 0 && path.length === baseDepth
        ? {
            label: t.continueLabel,
            onClick: () =>
              rootLevel
                ? onSelect({ id: rootLevel.id, name: rootLevel.name }, path)
                : onSelect({ id: "full-exam", name: exam.short_name }, []),
            disabled: false,
          }
        : { label: t.continueLabel, onClick: handleContinue, disabled: pending === null };

  return (
    <div className="cc-step-in flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StepEyebrow step={stepNumber} total={stepTotal} locale={locale} />
          {path.length > 0 && (
            <div className="mb-1.5 flex flex-wrap items-center gap-1">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <Text as="span" variant="body-small" color="gray-muted">
                      /
                    </Text>
                  )}
                  <Text as="span" variant="body-small" color={i === breadcrumb.length - 1 ? "gray-normal" : "gray-muted"} weight={i === breadcrumb.length - 1 ? "semibold" : "normal"}>
                    {crumb}
                  </Text>
                </span>
              ))}
            </div>
          )}
          <Text as="h1" variant="heading-large" weight="semibold" color="gray-normal">
            {t.selectNounFor(noun, stepTitle)}
          </Text>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-1">
            {t.chooseNounHint(noun)}
          </Text>
        </div>
        <TipCard icon={<BarChartIcon />} title={t.levelTipTitle} description={t.levelTipDescription} />
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border-gray-subtle)] py-14 text-center">
          <Text as="p" variant="body-medium" weight="medium" color="gray-normal">
            {t.levelListError}
          </Text>
          <button
            type="button"
            onClick={() => setRetryCount((n) => n + 1)}
            className="text-sm font-medium text-brand hover:underline"
          >
            {t.tryAgain}
          </button>
        </div>
      ) : !levels || isAutoWalking ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={190} borderRadius={16} />
          ))}
        </div>
      ) : currentOptions.length === 0 && path.length === baseDepth ? (
        <Text as="p" variant="body-medium" color="gray-muted">
          {t.noSeparateLevels}
        </Text>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentOptions.map((level, i) => {
              const hasChildren = childrenAt(level.id).length > 0;
              const isSelected = pending !== "full-exam" && pending?.id === level.id;
              return (
                <LevelCard
                  key={level.id}
                  title={level.name}
                  group={level.group}
                  bulletOne={hasChildren ? t.chooseNounWithin(noun, level.name) : t.trackCutoffOnly(level.name)}
                  bulletTwo={t.includesRelevantSubjects}
                  selected={isSelected}
                  onClick={() => setPending(level)}
                  delay={i * 30}
                />
              );
            })}
            {showFullExamOption && (
              <LevelCard
                title={t.fullExamTitle(exam.short_name)}
                bulletOne={t.trackCutoffAllLevels}
                bulletTwo={t.includesAllSubjectsAndLevels}
                selected={pending === "full-exam"}
                isFullExam
                onClick={() => setPending("full-exam")}
                delay={currentOptions.length * 30}
              />
            )}
          </div>

          <div className="relative flex items-start gap-3 overflow-hidden rounded-2xl bg-[var(--color-primary-subtle)] p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
              <InfoIcon />
            </span>
            <div>
              <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                {t.canChangeNounLater(noun)}
              </Text>
              <Text as="p" variant="body-small" color="gray-muted">
                {t.canChangeNounLaterHint(noun)}
              </Text>
            </div>
            <span className="pointer-events-none absolute -right-2 -bottom-2 opacity-20">
              <StackIcon color="var(--color-brand)" />
            </span>
          </div>
        </>
      )}

      {/* `sticky`, not `fixed`: this bar lives inside <main> (see
          app/syllabus-tracker/page.tsx), which ends exactly where SiteFooter
          begins — so a sticky-positioned element here can never slide over
          the footer. It rides the bottom of the viewport while there's more
          step content above, then docks in place right above the footer and
          scrolls up with it once the page runs out of room, which `fixed`
          (pinned to the viewport regardless of container) cannot do. */}
      <div className="sticky bottom-0 z-[var(--z-floating-cta)] -mx-3 mt-2 flex items-center justify-between border-t border-[var(--color-border-gray-subtle)] bg-white/95 px-3 py-3 backdrop-blur sm:mx-0 sm:rounded-sm sm:border">
        <button type="button" onClick={handleBack} className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
          <BackIcon /> {t.back}
        </button>
        {continueAction && (
          <Button disabled={continueAction.disabled} onClick={continueAction.onClick} rightIcon={<ForwardIcon />}>
            {continueAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
