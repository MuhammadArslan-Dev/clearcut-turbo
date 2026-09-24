"use client";

import { memo } from "react";
import clsx from "clsx";
import { Card } from "@clearcut/ui/card";

type AttemptSummaryStripProps = {
  /** <LiveTimeLeft/> */
  time: React.ReactNode;
  /** <AttemptProgress/> */
  progress: React.ReactNode;
  /** <TipCard/> (hidden below `lg`) */
  tip?: React.ReactNode;
  className?: string;
  /** Tighter padding — used by the full exam page. */
  compact?: boolean;
};

/** The white strip under the topbar: Time Left | Question progress | Tip. */
function AttemptSummaryStrip({ time, progress, tip, className, compact = false }: AttemptSummaryStripProps) {
  return (
    // Card defaults to `height: 100%`, which in a column layout would stretch this
    // strip over the whole page — size it to its content instead.
    <Card
      bgcolor="white"
      border="border-none"
      padding={compact ? "10px 16px" : "20px"}
      borderRadius={12}
      className={clsx("!h-auto shrink-0", className)}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        {time}
        <div className="hidden h-12 w-px bg-gray-200 lg:block" />
        {progress}
        {tip && <div className="hidden h-12 w-px bg-gray-200 lg:block" />}
        {tip}
      </div>
    </Card>
  );
}

export default memo(AttemptSummaryStrip);
