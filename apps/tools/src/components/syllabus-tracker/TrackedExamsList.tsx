"use client";

import { useMemo } from "react";
import Text from "@clearcut/ui/text";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import { entryKey, getOverallProgress, progressFingerprint, TrackedExamEntry } from "@/lib/syllabusTracker";
import ProgressRing from "./ProgressRing";
import TipCard from "./TipCard";
import { ExamLogo, LightbulbIcon, TONES } from "./trackerIcons";

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/** Returning-user landing screen — shown instead of the wizard whenever the
 * user already tracks one or more exams (see SyllabusTrackerApp's
 * restoreFromLocation). Clicking a tracked exam/paper opens its dashboard
 * directly, with no stepper; "Add More Exam" re-enters the wizard for a
 * different exam, "Add Paper"/"Add Level" re-enters it for another root-tier
 * option of an exam that already has one tracked. */
export default function TrackedExamsList({
  exams,
  onOpen,
  onAddMore,
  onAddPaper,
  saved = null,
  locale = "en",
}: {
  exams: TrackedExamEntry[];
  onOpen: (entry: TrackedExamEntry) => void;
  onAddMore: () => void;
  /** Re-enters the wizard for this exam id, excluding root-tier options
   * already tracked. Only ever called for a group that has >=1 tracked paper/level. */
  onAddPaper: (examId: number) => void;
  /** The logged-in account's saved trackers, or null when logged out / not
   * loaded yet — drives the Saved / Unsaved-changes chip on each entry. */
  saved?: TrackedExamEntry[] | null;
  locale?: Locale;
}) {
  const t = getSyllabusStrings(locale);

  const savedFingerprints = useMemo(
    () => (saved ? new Map(saved.map((e) => [entryKey(e), progressFingerprint(e)])) : null),
    [saved],
  );
  const syncChip = (entry: TrackedExamEntry) => {
    if (!savedFingerprints) return null;
    const isSaved = savedFingerprints.get(entryKey(entry)) === progressFingerprint(entry);
    return (
      <span
        className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
          isSaved
            ? "bg-[var(--color-success-bg-soft)] text-[var(--color-success-strong)]"
            : "bg-[var(--color-gray-bg-soft)] text-text-gray-muted"
        }`}
      >
        {isSaved ? t.savedChip : t.unsavedChip}
      </span>
    );
  };
  // Same "one consistent tone, not a per-card cycle" convention as
  // SubjectIcon/ChapterCard elsewhere in this app (see trackerIcons.tsx).
  const tone = TONES[0];

  // Multiple tracked entries can share one exam.id (one per paper/level) —
  // group them into a single card per exam so Paper 1/Paper 2 (or Level 1/
  // Level 3) read as one exam with several rows, not several exam cards.
  const groups = useMemo(() => {
    const byExamId = new Map<number, TrackedExamEntry[]>();
    for (const entry of exams) {
      const list = byExamId.get(entry.exam.id);
      if (list) list.push(entry);
      else byExamId.set(entry.exam.id, [entry]);
    }
    return Array.from(byExamId.values());
  }, [exams]);

  return (
    <div className="cc-step-in flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Text as="h1" variant="heading-large" weight="semibold" color="gray-normal">
            {t.myTrackedExamsTitle}
          </Text>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-1">
            {t.myTrackedExamsSubtitle}
          </Text>
        </div>
        <TipCard
          icon={<LightbulbIcon />}
          title={t.trackMultipleExamsTipTitle}
          description={t.trackMultipleExamsTipDescription}
          tone="soft"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((entries, i) => {
          const hasPapers = entries.some((e) => e.paper !== null);
          const delay = { animationDelay: `${i * 30}ms` };

          // One ring per card summarizing every tracked paper/level under
          // this exam together, even though each row below has its own
          // separate chapter count.
          const groupOverall = entries.reduce(
            (acc, entry) => {
              const p = getOverallProgress(entry);
              return { completed: acc.completed + p.completed, total: acc.total + p.total };
            },
            { completed: 0, total: 0 },
          );
          const groupPercent = groupOverall.total === 0 ? 0 : Math.round((groupOverall.completed / groupOverall.total) * 100);
          const groupComplete = groupOverall.total > 0 && groupOverall.completed === groupOverall.total;

          if (!hasPapers) {
            const entry = entries[0];
            return (
              <button
                key={entry.exam.id}
                type="button"
                onClick={() => onOpen(entry)}
                style={delay}
                className="cc-step-in group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-brand hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1 active:translate-y-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <ExamLogo logoUrl={entry.exam.logoUrl} examType={entry.exam.examType} tone={tone} />
                    <div>
                      <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="group-hover:text-brand transition-colors">
                        {entry.exam.shortName}
                      </Text>
                      <Text as="p" variant="body-small" color="gray-muted">
                        {entry.exam.name}
                      </Text>
                    </div>
                  </div>
                  <ProgressRing percent={groupPercent} complete={groupComplete} size={40} stroke={4} />
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border-gray-subtle)] pt-3">
                  <div className="min-w-0">
                    <Text as="p" variant="body-small" weight="semibold" color="gray-normal" className="truncate">
                      {entry.level.name}
                    </Text>
                    <Text as="p" variant="body-xsmall" color="gray-muted">
                      {t.chaptersMastered(groupOverall.completed, groupOverall.total)}
                    </Text>
                    {syncChip(entry) && <div className="mt-1">{syncChip(entry)}</div>}
                  </div>
                  <span className="text-text-gray-muted transition-colors group-hover:text-brand">
                    <ChevronIcon />
                  </span>
                </div>
              </button>
            );
          }

          const examId = entries[0].exam.id;
          // "Add Paper" for CTET (root tier literally called "Paper"),
          // "Add Level" for HTET (root tier called "Level") and anything
          // else — driven by whatever the API's own group label was for
          // this exam's root tier, not a hardcoded word.
          const addLabel = entries.find((e) => e.paper?.group)?.paper?.group === "Paper" ? t.addPaper : t.addLevel;
          return (
            <div
              key={examId}
              style={delay}
              className="cc-step-in flex flex-col gap-4 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <ExamLogo logoUrl={entries[0].exam.logoUrl} examType={entries[0].exam.examType} tone={tone} />
                  <div>
                    <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                      {entries[0].exam.shortName}
                    </Text>
                    <Text as="p" variant="body-small" color="gray-muted">
                      {entries[0].exam.name}
                    </Text>
                  </div>
                </div>
                <ProgressRing percent={groupPercent} complete={groupComplete} size={40} stroke={4} />
              </div>

              <div className="flex flex-col divide-y divide-[var(--color-border-gray-subtle)] border-t border-[var(--color-border-gray-subtle)]">
                {entries.map((entry) => {
                  const overall = getOverallProgress(entry);
                  return (
                    <button
                      key={entry.paper?.id ?? "none"}
                      type="button"
                      onClick={() => onOpen(entry)}
                      className="group flex items-center justify-between gap-2 py-3.5 text-left transition-colors"
                    >
                      <div className="min-w-0">
                        <Text as="p" variant="body-small" weight="semibold" color="gray-normal" className="truncate group-hover:text-brand transition-colors">
                          {entry.paper?.name}
                        </Text>
                        <Text as="p" variant="body-xsmall" color="gray-muted" className="mt-0.5">
                          {t.chaptersMastered(overall.completed, overall.total)}
                        </Text>
                        {syncChip(entry) && <div className="mt-1">{syncChip(entry)}</div>}
                      </div>
                      <span className="text-text-gray-muted transition-colors group-hover:text-brand">
                        <ChevronIcon />
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => onAddPaper(examId)}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-primary-subtle)] px-3 py-3 text-left transition-colors hover:bg-[var(--color-primary-subtle)]/70"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                  <PlusIcon />
                </span>
                <Text as="span" variant="body-small" weight="semibold" className="!text-brand">
                  {addLabel}
                </Text>
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddMore}
          style={{ animationDelay: `${groups.length * 30}ms` }}
          className="cc-step-in flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border-gray-subtle)] bg-white p-6 text-center transition-colors hover:border-brand"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-brand">
            <PlusIcon />
          </div>
          <div>
            <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
              {t.addMoreExam}
            </Text>
            <Text as="p" variant="body-small" color="gray-muted">
              {t.addMoreExamHint}
            </Text>
          </div>
        </button>
      </div>
    </div>
  );
}
