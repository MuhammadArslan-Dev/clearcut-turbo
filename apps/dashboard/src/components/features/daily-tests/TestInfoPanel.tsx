"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Clock, FileText, Lightbulb } from "lucide-react";
import { Card } from "@clearcut/ui/card";
import InfoRow from "./InfoRow";

type TestInfoPanelProps = {
  exam?: string;
  /** Omit to hide the Subject row (the Daily Tests list page doesn't show it). */
  subject?: string;
  questions?: number | null;
  durationMinutes?: number | null;
};

/** "Test Info" card (Exam · Subject · Questions · Duration) plus the Tip card. */
function TestInfoPanel({ exam = "-", subject, questions = null, durationMinutes = null }: TestInfoPanelProps) {
  const t = useTranslations("DailyTests");

  return (
    <div className="flex flex-col gap-4">
      <Card bgcolor="white" border="border-gray-200" padding="16px" borderRadius={12} className="!h-auto">
        <div className="mb-3 flex items-center gap-2">
          <FileText size={20} className="text-brand" />
          <p className="body-large !font-semibold">{t("info.title")}</p>
        </div>
        <div className="flex flex-col gap-3">
          <InfoRow icon={<FileText size={16} />} label={t("info.exam")} value={exam} />
          {subject !== undefined && <InfoRow icon={<BookOpen size={16} />} label={t("info.subject")} value={subject} />}
          <InfoRow icon={<FileText size={16} />} label={t("info.questions")} value={questions != null ? String(questions) : "-"} />
          <InfoRow
            icon={<Clock size={16} />}
            label={t("info.duration")}
            value={durationMinutes != null ? t("info.durationValue", { count: durationMinutes }) : "-"}
          />
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-xl bg-[var(--color-primary-bg-soft)] p-4">
        <Lightbulb size={22} className="mt-0.5 shrink-0 text-brand" />
        <div>
          <p className="body-medium !font-semibold text-brand">{t("info.tip")}</p>
          <p className="body-medium text-surface-gray-muted">{t("info.tipBody")}</p>
        </div>
      </div>
    </div>
  );
}

export default memo(TestInfoPanel);
