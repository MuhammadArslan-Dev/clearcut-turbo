"use client";

import Text from "@clearcut/ui/text";
import type { TrackedChapter } from "@/lib/syllabusTracker";
import { CheckIcon, chapterIconAndTone } from "./trackerIcons";

/** One chapter tile in the dashboard's "Cards" grid view. The whole card is
 * the control — clicking it toggles `chapter.completed` directly (no
 * separate selection checkbox), shown as a blue border plus a checkmark
 * badge in the corner. The badge shows the chapter's position number itself
 * rather than a decorative icon. */
export default function ChapterCard({
  chapter,
  index,
  onToggle,
}: {
  chapter: TrackedChapter;
  index: number;
  onToggle: () => void;
}) {
  const { tone } = chapterIconAndTone(chapter.name, index);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={chapter.completed}
      className={`relative flex items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition-all duration-150 hover:-translate-y-0.5 ${
        chapter.completed ? "border-brand shadow-[0_4px_16px_rgba(0,131,255,0.12)]" : "border-[var(--color-border-gray-subtle)] hover:border-brand/40"
      }`}
    >
      {chapter.completed && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
          <CheckIcon size={13} />
        </span>
      )}

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold"
        style={{ background: tone.bg, color: tone.text }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="flex-1">
        {chapter.name}
      </Text>
    </button>
  );
}
