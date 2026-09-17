"use client";

import { Card } from "@clearcut/ui/card";
import { Button } from "@clearcut/ui/button";
import { CalendarIcon, ClockIcon, ChartSuccessBarIcon, ChevronIcon, LockIcon } from "@/components/ui/icons";
import { FileText, CheckCircle2 } from "lucide-react";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import IconStat from "./IconStat";
import { SECONDS_PER_QUESTION } from "./constants";
import { DailyTestHistoryItem } from "@/lib/api/dailyTests";

export interface DailyTestHistoryRowProps {
  test: DailyTestHistoryItem;
  title: string;
  /** The "Today's Test" row gets a light highlight in both mockups
   * (free and premium), independent of whether it's been attempted yet. */
  isToday?: boolean;
  onAttempt: () => void;
}

// Three real states a row can be in (never more than one at once —
// `locked` on the backend already implies `!attempted`): locked (unpaid +
// not today), attempted (score exists), or available (can be started/
// resumed right now).
type RowStatus = "locked" | "attempted" | "available";

export default function DailyTestHistoryRow({ test, title, isToday, onAttempt }: DailyTestHistoryRowProps) {
  const durationMinutes = Math.round((test.total_questions * SECONDS_PER_QUESTION) / 60);
  const scoreLabel = test.attempted && test.score !== null ? `${test.score}/${test.total_questions}` : "-";

  const status: RowStatus = test.locked ? "locked" : test.attempted ? "attempted" : "available";

  return (
    <Card
      bgcolor={isToday ? "var(--color-primary-soft)" : "white"}
      bordercolor={isToday ? "var(--color-brand)" : undefined}
      padding="16px"
      borderRadius={12}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
            <CalendarIcon size={18} color="var(--color-brand)" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="body-medium !font-semibold">{title}</p>
              {status === "locked" && (
                <StatusChip label="Locked" variant="soft" tone="neutral" iconLeft={<LockIcon size={11} />} />
              )}
              {status === "attempted" && (
                <StatusChip label="Attempted" variant="soft" tone="info" iconLeft={<CheckCircle2 size={12} />} />
              )}
              {status === "available" && (
                <StatusChip
                  label="Available"
                  variant="soft"
                  tone="success"
                  iconLeft={<span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success-strong)]" />}
                />
              )}
            </div>
            <p className="body-small text-surface-gray-muted">{test.test_date}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 md:gap-x-8">
          <IconStat icon={<FileText size={16} className="text-[var(--color-surface-gray-muted)]" />} value={test.total_questions} label="Questions" />
          {/* bg-black/10 (not bg-gray-200) so the divider still shows up
              against the "Today's Test" row's light-blue highlight — a fixed
              light gray nearly disappears there. */}
          <div className="hidden h-8 w-px bg-black/10 md:block" />
          <IconStat icon={<ClockIcon size={16} color="var(--color-surface-gray-muted)" />} value={`${durationMinutes} min`} label="Duration" />
          {/* bg-black/10 (not bg-gray-200) so the divider still shows up
              against the "Today's Test" row's light-blue highlight — a fixed
              light gray nearly disappears there. */}
          <div className="hidden h-8 w-px bg-black/10 md:block" />
          <IconStat icon={<ChartSuccessBarIcon />} value={scoreLabel} label="Your Score" />
        </div>

        <div className="flex flex-col items-stretch gap-1 md:items-end">
          {status === "locked" && (
            <Button variant="soft" color="gray" size="md" rounded="50px" disabled leftIcon={<LockIcon size={14} />}>
              Locked
            </Button>
          )}
          {status === "attempted" && (
            <Button
              variant="outlined"
              color="primary"
              size="md"
              rounded="50px"
              rightIcon={<ChevronIcon size={14} variant="right" color="var(--color-brand)" />}
              onClick={onAttempt}
            >
              View Result
            </Button>
          )}
          {status === "available" && (
            <Button
              variant="solid"
              color="primary"
              size="md"
              rounded="50px"
              rightIcon={<ChevronIcon size={14} variant="right" color="white" />}
              onClick={onAttempt}
            >
              {test.in_progress ? "Resume Test" : "Start Test"}
            </Button>
          )}
          {status === "locked" && <p className="body-xsmall text-surface-gray-muted">Upgrade to attempt</p>}
        </div>
      </div>
    </Card>
  );
}
