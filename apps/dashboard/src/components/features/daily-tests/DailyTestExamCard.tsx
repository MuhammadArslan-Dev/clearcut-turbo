"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { Card } from "@clearcut/ui/card";
import { CalendarIcon, ClockIcon, ChevronIcon } from "@/components/ui/icons";
import { DailyTestExam } from "@/lib/api/dailyTests";

export interface DailyTestExamCardProps {
  exam: DailyTestExam;
  onOpen: () => void;
  onAttempt: (e: React.MouseEvent) => void;
}

export default function DailyTestExamCard({ exam, onOpen, onAttempt }: DailyTestExamCardProps) {
  const t = useTranslations("DailyTests.examCard");
  return (
    <Card
      bgcolor="white"
      padding="16px"
      borderRadius={12}
      className="!cursor-pointer transition-colors hover:!border-brand"
      onClick={onOpen}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {exam.logo_url ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-100">
              <Image src={exam.logo_url} alt={exam.short_name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100" />
          )}
          <div className="min-w-0 flex-1">
            <p className="body-large !font-semibold truncate">{exam.short_name}</p>
            <p className="body-small truncate text-surface-gray-muted">{exam.name}</p>
          </div>
          <ChevronIcon size={18} variant="right" color="var(--color-surface-gray-muted)" />
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarIcon size={16} color="var(--color-surface-gray-muted)" />
            <div>
              <p className="body-small !font-semibold leading-tight">{exam.daily_tests_count}</p>
              <p className="body-xsmall leading-tight text-surface-gray-muted">{t("dailyTests")}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {exam.attempted_today ? (
              <CheckCircle2 size={16} className="text-[var(--icon-positive-normal)]" />
            ) : (
              <ClockIcon size={16} color="var(--color-surface-gray-muted)" />
            )}
            <div>
              <p className="body-small !font-semibold leading-tight">
                {exam.attempted_today ? t("attempted") : t("notAttempted")}
              </p>
              <p className="body-xsmall leading-tight text-surface-gray-muted">{t("todaysTest")}</p>
            </div>
          </div>

          {exam.expected_cutoff && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={16} className="text-[var(--icon-positive-normal)]" />
              <div>
                <p className="body-small !font-semibold leading-tight">{exam.expected_cutoff}</p>
                <p className="body-xsmall leading-tight text-surface-gray-muted">{t("expectedCutoff")}</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onAttempt}
          className="flex w-full items-center justify-center gap-1 rounded-full border-2 border-brand py-2.5 body-medium !font-semibold text-brand transition-colors hover:bg-brand/9"
        >
          {exam.attempted_today ? t("viewTodaysResult") : t("startTodaysTest")}
          <ChevronIcon size={16} variant="right" color="var(--color-brand)" />
        </button>
      </div>
    </Card>
  );
}
