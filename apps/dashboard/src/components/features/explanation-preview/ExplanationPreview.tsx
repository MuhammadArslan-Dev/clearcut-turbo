"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card } from "@clearcut/ui/card";
import DailyTestReviewRow, { type ReviewStatus } from "@/components/features/daily-tests/DailyTestReviewRow";
import type { DailyTestResultQuestion } from "@/lib/api/dailyTests";

type LocaleData = {
  question: string | null;
  options: (string | null)[];
  correct_option: number;
  explanation: string | null;
  incorrect_explanation: string | null;
};

export type PreviewSample = { id: string; label: string; byLocale: Record<string, LocaleData> };

/**
 * Phase 100 preview (dev only): real local questions rendered by the Daily
 * Test result's own review card + row (`DailyTestReviewRow`), so the Correct /
 * Incorrect explanation looks exactly as it will in the product. Questions 1-2
 * have an incorrect explanation, question 3 does not. Not linked from any flow.
 */
export default function ExplanationPreview({ samples }: { samples: PreviewSample[] }) {
  const locale = useLocale();
  const t = useTranslations("DailyTests");

  // Q1 answered correctly, Q2 + Q3 answered wrongly (shows the red/green option states).
  const rows = samples.map((s, i) => {
    const d = s.byLocale[locale] ?? s.byLocale.en ?? Object.values(s.byLocale)[0];
    const selected = i === 0 ? d.correct_option : (d.correct_option % 4) + 1;
    const q: DailyTestResultQuestion = {
      question_id: i + 1,
      question: d.question,
      question_image: null,
      options: { "1": d.options[0], "2": d.options[1], "3": d.options[2], "4": d.options[3] },
      selected_option: selected,
      correct_option: d.correct_option,
      is_correct: selected === d.correct_option,
      explanation: d.explanation,
      incorrect_explanation: d.incorrect_explanation,
    };
    const status: ReviewStatus = q.is_correct ? "correct" : "incorrect";
    return { q, status };
  });

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-4 px-0 py-4 md:p-4">
      <Card
        bgcolor="white"
        border="border-gray-200"
        padding="20px"
        borderRadius={12}
        className="max-md:!rounded-none max-md:!border-x-0"
      >
        <div className="mb-4">
          <h2 className="heading-small !font-semibold">{t("result.reviewTitle")}</h2>
          <p className="body-medium text-surface-gray-muted">{t("result.reviewDesc")}</p>
        </div>
        <div className="flex flex-col gap-2">
          {rows.map(({ q, status }, index) => (
            <DailyTestReviewRow key={q.question_id} index={index} total={rows.length} q={q} status={status} />
          ))}
        </div>
      </Card>
    </div>
  );
}
