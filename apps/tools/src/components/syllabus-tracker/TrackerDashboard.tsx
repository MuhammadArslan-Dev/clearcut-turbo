"use client";

import { useMemo, useState } from "react";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import { getOverallProgress, TrackedExamEntry } from "@/lib/syllabusTracker";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import ProgressRing from "./ProgressRing";
import SubjectIcon from "./SubjectIcon";
import SubjectSidebar from "./SubjectSidebar";
import ChapterCard from "./ChapterCard";
import { CheckIcon, CapIcon } from "./trackerIcons";

type ViewMode = "cards" | "list";

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function TrackerDashboard({
  state,
  onToggleChapter,
  onReset,
  onTrackDifferentExam,
  locale = "en",
}: {
  state: TrackedExamEntry;
  onToggleChapter: (subject: string, chapterId: number) => void;
  onReset: () => void;
  onTrackDifferentExam: () => void;
  locale?: Locale;
}) {
  const t = getSyllabusStrings(locale);
  const overall = useMemo(() => getOverallProgress(state), [state]);
  const isComplete = overall.total > 0 && overall.completed === overall.total;

  const subjectNames = useMemo(() => Object.keys(state.subjects), [state.subjects]);
  const [activeSubject, setActiveSubject] = useState(subjectNames[0]);
  const [view, setView] = useState<ViewMode>("cards");
  const [search, setSearch] = useState("");

  const subjectSummaries = subjectNames.map((name) => {
    const chapters = state.subjects[name];
    return { name, total: chapters.length, completed: chapters.filter((c) => c.completed).length };
  });

  // A subject only ever displays its "completed already in X" credit while
  // it's CURRENTLY fully complete — crossCompletions itself is never
  // cleared once set (see propagateSubjectCompletion's own comment), so
  // gating the badge here means unchecking a chapter naturally hides a
  // stale credit instead of needing a separate cleanup pass.
  const crossCompletedFrom: Record<string, string> = {};
  for (const s of subjectSummaries) {
    const sourceExam = state.crossCompletions?.[s.name];
    if (sourceExam && s.total > 0 && s.completed === s.total) {
      crossCompletedFrom[s.name] = sourceExam;
    }
  }

  const currentSubject = subjectNames.includes(activeSubject) ? activeSubject : subjectNames[0];
  const chapters = state.subjects[currentSubject] ?? [];
  const subjectCompleted = chapters.filter((c) => c.completed).length;
  const subjectPercent = chapters.length === 0 ? 0 : Math.round((subjectCompleted / chapters.length) * 100);
  const currentSubjectCrossCompletedFrom = crossCompletedFrom[currentSubject];

  const filtered = useMemo(
    () => chapters.filter((c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase())),
    [chapters, search],
  );

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onTrackDifferentExam}
        className="flex w-fit items-center gap-1 text-sm font-medium text-brand hover:underline"
      >
        <BackIcon /> {t.trackDifferentExam}
      </button>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text as="h1" variant="heading-medium" weight="semibold" color="gray-normal">
            {state.exam?.shortName}
            {state.paper ? ` — ${state.paper.name}` : ""} — {state.level?.name}
          </Text>
          <Text as="p" variant="body-small" color="gray-muted">
            {isComplete ? t.allChaptersMastered : t.chaptersMastered(overall.completed, overall.total)}
          </Text>
          <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-[var(--color-gray-bg-soft)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-[var(--color-success)]" : "bg-brand"}`}
              style={{ width: `${overall.percent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ProgressRing percent={overall.percent} complete={isComplete} size={48} stroke={4} />
          <Button variant="outlined" color="gray" size="sm" onClick={onReset}>
            {t.resetLabel}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
        <SubjectSidebar
          subjects={subjectSummaries}
          active={currentSubject}
          onSelect={setActiveSubject}
          crossCompletedFrom={crossCompletedFrom}
          locale={locale}
        />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-[var(--color-primary-subtle)]/40 p-4">
            <SubjectIcon name={currentSubject ?? ""} index={subjectNames.indexOf(currentSubject)} size={40} background="white" iconScale={1.4} />
            <div className="flex-1">
              <Text as="h2" variant="body-large" weight="semibold" color="gray-normal">
                {currentSubject}
              </Text>
              <Text as="p" variant="body-small" color="gray-muted">
                {t.chaptersMastered(subjectCompleted, chapters.length)}
              </Text>
              {currentSubjectCrossCompletedFrom && (
                <Text as="p" variant="body-xsmall" weight="medium" className="mt-0.5 !text-[var(--color-success-strong)]">
                  {t.completedElsewhere(currentSubjectCrossCompletedFrom)}
                </Text>
              )}
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
                <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${subjectPercent}%` }} />
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand">{subjectPercent}%</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-gray-muted">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchChaptersPlaceholder}
                className="w-full rounded-xl border border-[var(--color-border-gray-subtle)] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center rounded-full border border-[var(--color-border-gray-subtle)] p-0.5">
              <button
                type="button"
                onClick={() => setView("cards")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "cards" ? "bg-brand text-white" : "text-text-gray-muted hover:bg-[var(--color-gray-bg-soft)]"
                }`}
              >
                <GridIcon /> {t.viewCards}
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "list" ? "bg-brand text-white" : "text-text-gray-muted hover:bg-[var(--color-gray-bg-soft)]"
                }`}
              >
                <ListIcon /> {t.viewList}
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-[var(--color-border-gray-subtle)] py-10 text-center">
              <Text as="p" variant="body-medium" weight="medium" color="gray-normal">
                {t.noChaptersMatch(search.trim())}
              </Text>
            </div>
          ) : view === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((chapter) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  index={chapters.findIndex((c) => c.id === chapter.id)}
                  onToggle={() => onToggleChapter(currentSubject, chapter.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--color-border-gray-subtle)] rounded-xl border border-[var(--color-border-gray-subtle)] bg-white">
              {filtered.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => onToggleChapter(currentSubject, chapter.id)}
                  aria-pressed={chapter.completed}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-gray-bg-soft)]"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      chapter.completed ? "border-brand bg-brand text-white" : "border-[var(--color-border-gray-subtle)] text-transparent"
                    }`}
                  >
                    <CheckIcon size={11} />
                  </span>
                  <Text as="span" variant="body-small" color="gray-normal" className="flex-1">
                    {chapter.name}
                  </Text>
                </button>
              ))}
            </div>
          )}

          {overall.completed === 0 && (
            <div className="flex items-center justify-center gap-2 pt-2 text-center">
              <span className="text-text-gray-muted">
                <CapIcon />
              </span>
              <Text as="p" variant="body-small" color="gray-muted">
                {t.selectChaptersHint}
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
