"use client";

import { useMemo } from "react";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import { entryKey, getOverallProgress, progressFingerprint, TrackedExamEntry } from "@/lib/syllabusTracker";
import { ExamLogo, TONES } from "./trackerIcons";

/** "Saved on your account" — trackers from the logged-in account that this
 * browser doesn't have yet, or has a DIFFERENT version of. Nothing here is
 * ever applied automatically: each row's Load is an explicit user action
 * (the parent confirms first when it would replace local progress). Rows
 * that are identical to the local copy are omitted — nothing to load. */
export default function SavedTrackersSection({
  saved,
  local,
  status,
  onLoad,
  onRetry,
  locale = "en",
}: {
  /** null = not logged in / not fetched yet. */
  saved: TrackedExamEntry[] | null;
  local: TrackedExamEntry[];
  status: "idle" | "loading" | "error";
  onLoad: (entry: TrackedExamEntry) => void;
  onRetry: () => void;
  locale?: Locale;
}) {
  const t = getSyllabusStrings(locale);

  const rows = useMemo(() => {
    const localByKey = new Map(local.map((e) => [entryKey(e), e]));
    return (saved ?? []).flatMap((entry) => {
      const mine = localByKey.get(entryKey(entry));
      if (mine && progressFingerprint(mine) === progressFingerprint(entry)) return [];
      return [{ entry, differs: Boolean(mine) }];
    });
  }, [saved, local]);

  if (status === "error") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-[var(--color-border-gray-subtle)] px-4 py-3">
        <Text as="p" variant="body-small" color="gray-muted">
          {t.savedListError}
        </Text>
        <button type="button" onClick={onRetry} className="text-sm font-medium text-brand hover:underline">
          {t.tryAgain}
        </button>
      </div>
    );
  }

  if (saved === null && status === "loading") {
    return (
      <Text as="p" variant="body-small" color="gray-muted" className="mb-6">
        {t.savedLoadingList}
      </Text>
    );
  }

  if (rows.length === 0) return null;

  return (
    <section className="mb-8 flex flex-col gap-3" aria-labelledby="cc-saved-trackers-title">
      <div>
        <Text id="cc-saved-trackers-title" as="h2" variant="heading-small" weight="semibold" color="gray-normal">
          {t.savedTrackersTitle}
        </Text>
        <Text as="p" variant="body-small" color="gray-muted" className="mt-0.5">
          {t.savedTrackersSubtitle}
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map(({ entry, differs }) => {
          const overall = getOverallProgress(entry);
          return (
            <div
              key={entryKey(entry)}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <ExamLogo logoUrl={entry.exam.logoUrl} examType={entry.exam.examType} tone={TONES[0]} />
                <div className="min-w-0">
                  <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="truncate">
                    {entry.exam.shortName}
                  </Text>
                  <Text as="p" variant="body-small" color="gray-muted" className="truncate">
                    {entry.paper ? `${entry.paper.name} — ${entry.level.name}` : entry.level.name}
                  </Text>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border-gray-subtle)] pt-3">
                <div className="min-w-0">
                  <Text as="p" variant="body-xsmall" color="gray-muted">
                    {t.chaptersMastered(overall.completed, overall.total)}
                  </Text>
                  {differs && (
                    <Text as="p" variant="body-xsmall" weight="medium" color="gray-muted" className="mt-0.5">
                      {t.savedDiffers}
                    </Text>
                  )}
                </div>
                <Button variant="outlined" color="primary" size="sm" onClick={() => onLoad(entry)}>
                  {t.savedLoadLabel}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
