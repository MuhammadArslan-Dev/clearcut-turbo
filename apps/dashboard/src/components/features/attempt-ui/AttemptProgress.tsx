"use client";

import { memo } from "react";
import Text from "@clearcut/ui/text";
import ProgressBar from "@/components/ui/ProgressBar";

type AttemptProgressProps = {
  /** Tighter spacing — used by the full exam page. */
  compact?: boolean;
  position: number;
  total: number;
  /** 0–100, shown as "N% Complete" and drives the bar. */
  percent: number;
  /** Translated replacements for the two default English strings. */
  positionLabel?: string;
  percentLabel?: string;
};

/** "Question 1 of 150 · 0% Complete" with a thin brand progress bar. */
function AttemptProgress({ position, total, percent, compact = false, positionLabel, percentLabel }: AttemptProgressProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className={`${compact ? "mb-1" : "mb-2"} flex items-center justify-between gap-2`}>
        <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
          {positionLabel ?? `Question ${position} of ${total}`}
        </Text>
        <Text as="p" variant="body-small" color="gray-muted" className="whitespace-nowrap">
          {percentLabel ?? `${percent}% Complete`}
        </Text>
      </div>
      <ProgressBar completed={percent} total={100} showLabel={false} color="var(--color-brand)" height={6} />
    </div>
  );
}

export default memo(AttemptProgress);
