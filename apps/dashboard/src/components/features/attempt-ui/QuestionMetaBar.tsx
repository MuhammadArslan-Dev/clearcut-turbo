"use client";

import { memo } from "react";
import { Bookmark, Flag } from "lucide-react";

type QuestionMetaBarProps = {
  /** Subject / exam chip on the left. */
  chip?: React.ReactNode;
  /** Hide the chip below `sm` (the full exam page — the section is already in the tabs). */
  hideChipOnMobile?: boolean;
  isMarked: boolean;
  onToggleMark: () => void;
  markLabel?: string;
  /** Shows a red "Report Question" action next to Mark for Review. */
  onReport?: () => void;
  reportLabel?: string;
  /** Extra controls after "Mark for Review" (clock + marks, Report Question…). */
  trailing?: React.ReactNode;
};

/** Row above the question: [chip] … [Mark for Review] [trailing]. */
function QuestionMetaBar({
  chip,
  hideChipOnMobile = false,
  isMarked,
  onToggleMark,
  markLabel = "Mark for Review",
  onReport,
  reportLabel = "Report Question",
  trailing,
}: QuestionMetaBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${
        hideChipOnMobile ? "justify-start sm:justify-between" : "justify-between"
      }`}
    >
      {chip ? (
        <span
          className={`body-small rounded-lg bg-brand/9 px-3 py-1.5 !font-medium text-brand ${
            hideChipOnMobile ? "hidden sm:inline" : ""
          }`}
        >
          {chip}
        </span>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleMark}
          className={`flex cursor-pointer items-center gap-2 body-medium ${
            isMarked ? "!font-semibold text-[var(--icon-notice-normal)]" : "text-surface-gray-normal"
          }`}
        >
          <Bookmark size={18} fill={isMarked ? "currentColor" : "none"} />
          <span>{markLabel}</span>
        </button>
        {onReport && (
          <button
            type="button"
            onClick={onReport}
            className="flex cursor-pointer items-center gap-2 body-medium text-[var(--color-danger)]"
          >
            <Flag size={18} />
            <span className="hidden sm:inline">{reportLabel}</span>
          </button>
        )}
        {trailing}
      </div>
    </div>
  );
}

export default memo(QuestionMetaBar);
