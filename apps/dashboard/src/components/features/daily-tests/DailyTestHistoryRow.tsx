"use client";

import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Play, RefreshCw, BarChart3 } from "lucide-react";
import { Card } from "@clearcut/ui/card";
import { Button } from "@clearcut/ui/button";
import { LockIcon } from "@/components/ui/icons";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { DailyTestHistoryItem } from "@/lib/api/dailyTests";

export interface DailyTestHistoryRowProps {
  test: DailyTestHistoryItem;
  title: string;
  /** The "Today's Test" row gets a light highlight. */
  isToday?: boolean;
  onAttempt: () => void;
  /** Attempted rows: open this test's Attempt History. */
  onViewHistory?: () => void;
  /** Attempted rows: start another attempt of the same test. */
  onAttemptAgain?: () => void;
}

// Three real states a row can be in (`locked` on the backend already implies
// `!attempted`): locked (unpaid + not today), attempted (has a completed
// attempt), or available (can be started/resumed right now).
type RowStatus = "locked" | "attempted" | "available";

// en-US so the row reads "Sep 2026" and "10:24 AM", like the design.
const DATE_LOCALES: Record<string, string> = { en: "en-US", hi: "hi-IN", mr: "mr-IN" };

export default function DailyTestHistoryRow({
  test,
  title,
  isToday,
  onAttempt,
  onViewHistory,
  onAttemptAgain,
}: DailyTestHistoryRowProps) {
  const t = useTranslations("DailyTests");
  const locale = useLocale();
  const dateLocale = DATE_LOCALES[locale] ?? "en-US";

  const status: RowStatus = test.locked ? "locked" : test.attempted ? "attempted" : "available";

  const [y, m, d] = test.test_date.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const monthYear = new Intl.DateTimeFormat(dateLocale, { month: "short", year: "numeric" }).format(dateObj);

  const attempts = test.attempts_count ?? (test.attempted ? 1 : 0);
  const best = test.best_score;
  const bestPercent = best && best.total_questions > 0 ? Math.round((best.score / best.total_questions) * 100) : null;
  const lastAttempt = test.last_attempt_at
    ? new Intl.DateTimeFormat(dateLocale, { hour: "2-digit", minute: "2-digit" }).format(new Date(test.last_attempt_at))
    : "-";

  return (
    <Card
      bgcolor={isToday ? "var(--color-primary-soft)" : "white"}
      bordercolor={isToday ? "var(--color-brand)" : undefined}
      padding="16px"
      borderRadius={12}
      className="!h-auto"
    >
      {/*
        The single-line layout (date | title | stats | actions) needs real
        room: it only switches on at `2xl` (1536px) rather than `lg`
        (1024px), because `lg` is also where the page puts the 300px Test
        Info sidebar next to this card — at 1024–1400px the two together
        left too little width for the 3 nowrap stat columns, and they
        visually overlapped instead of shrinking. Below `2xl` this stays
        the same stacked layout used on mobile/tablet, which never breaks.
      */}
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:gap-6">
        {/* Date + title + status */}
        <div className="flex items-center gap-4 2xl:w-[270px] 2xl:shrink-0">
          <div className="w-24 shrink-0 border-r border-gray-200 pr-4 text-center">
            <p className="heading-large !font-semibold leading-tight">{dateObj.getDate()}</p>
            <p className="body-small whitespace-nowrap leading-tight text-surface-gray-muted">{monthYear}</p>
          </div>
          <div className="min-w-0">
            <p className="body-large !font-semibold truncate">{title}</p>
            <div className="mt-1">
              {status === "locked" && (
                <StatusChip
                  label={t("row.locked")}
                  variant="soft"
                  tone="neutral"
                  iconLeft={<LockIcon size={11} />}
                  onClick={onAttempt}
                />
              )}
              {status === "attempted" && (
                <StatusChip label={t("row.attempted")} variant="soft" tone="success" iconLeft={<CheckCircle2 size={12} />} />
              )}
              {status === "available" && (
                <StatusChip
                  label={test.in_progress ? t("row.inProgress") : t("row.notAttempted")}
                  variant="soft"
                  tone="neutral"
                />
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 2xl:flex-1 2xl:divide-x 2xl:divide-gray-200 2xl:border-l 2xl:border-gray-200 2xl:pl-6">
          <Stat label={t("row.attempts")} value={t("row.attemptsCount", { count: attempts })} />
          <Stat
            label={t("row.bestScore")}
            value={best ? `${best.score} / ${best.total_questions}` : "-"}
            sub={bestPercent != null ? `(${bestPercent}%)` : undefined}
            className="2xl:pl-3"
          />
          <Stat label={t("row.lastAttempt")} value={lastAttempt} className="2xl:pl-3" />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 2xl:w-[180px] 2xl:shrink-0 2xl:border-l 2xl:border-gray-200 2xl:pl-6">
          {status === "locked" && (
            <>
              <Button variant="soft" color="gray" size="md" rounded="10px" fullWidth onClick={onAttempt} leftIcon={<LockIcon size={14} />}>
                {t("row.locked")}
              </Button>
              <p className="body-xsmall text-center text-surface-gray-muted">{t("row.upgradeToAttempt")}</p>
            </>
          )}
          {status === "attempted" && (
            <>
              <Button
                variant="solid"
                color="primary"
                size="md"
                rounded="10px"
                fullWidth
                leftIcon={<RefreshCw size={16} />}
                onClick={onAttemptAgain ?? onAttempt}
              >
                {t("row.attemptAgain")}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="md"
                rounded="10px"
                fullWidth
                leftIcon={<BarChart3 size={16} />}
                onClick={onViewHistory ?? onAttempt}
              >
                {t("row.viewHistory")}
              </Button>
            </>
          )}
          {status === "available" && (
            <Button
              variant="solid"
              color="primary"
              size="md"
              rounded="10px"
              fullWidth
              leftIcon={<Play size={16} />}
              onClick={onAttempt}
            >
              {test.in_progress ? t("row.resume") : t("row.start")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className={className}>
      <p className="body-small whitespace-nowrap leading-tight text-surface-gray-muted">{label}</p>
      <p className="body-medium whitespace-nowrap !font-semibold leading-tight">{value}</p>
      {sub && <p className="body-xsmall leading-tight text-surface-gray-muted">{sub}</p>}
    </div>
  );
}
