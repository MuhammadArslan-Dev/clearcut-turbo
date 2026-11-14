"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import QuestionExplanation from "@/components/features/exam-report/QuestionExplanation";
import OptionCard from "@/components/features/exam-report/OptionCard";
import QuestionText from "@/components/ui/cards/QuestionMaterial/Question/QuestionText";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { ChevronIcon } from "@/components/ui/icons";
import type { DailyTestResultQuestion } from "@/lib/api/dailyTests";

// One question of the Daily Test result review (moved unchanged out of
// daily-test-attempt/.../page.tsx so /explanation-preview renders the exact
// same row). Phase 100: passes `incorrect_explanation` to the explanation panel.
export type ReviewStatus = "correct" | "incorrect" | "skipped";

// Same look and behaviour as the full-length test's Performance Report
// (exam-report/ExamReportSheet.tsx → QuestionItem): tinted header with the
// status chip and a round chevron, question + OptionCard grid, and an
// outlined "Show Correct Answer and Explanation" toggle. Easy/time-spent are
// omitted — daily tests don't record either.
export default function DailyTestReviewRow({
  index,
  total,
  q,
  status,
}: {
  index: number;
  total: number;
  q: DailyTestResultQuestion;
  status: ReviewStatus;
}) {
  const t = useTranslations("modals.performanceReport");
  const tCommon = useTranslations("");
  const [isOpen, setIsOpen] = useState(() => index === 0);
  const [isExplanation, setIsExplanation] = useState(false);

  const options = (["1", "2", "3", "4"] as const)
    .map((key) => ({ text: q.options[key] }))
    .filter((o) => o.text);
  const isAnswered = q.selected_option != null;
  const chipTone = {
    correct: "!bg-[var(--icon-positive-subtle)] !border-[var(--icon-positive-subtle)]",
    incorrect: "!bg-[var(--icon-negative-normal)] !border-[var(--icon-negative-normal)]",
    skipped: "!bg-[var(--icon-gray-muted)] !border-[var(--icon-gray-muted)]",
  }[status];

  return (
    <div className="flex w-full flex-col justify-between gap-2">
      <div
        onClick={() => setIsOpen((v) => !v)}
        className={`flex cursor-pointer items-center justify-between gap-2 bg-brand/9 px-3 py-2 ${
          isOpen ? "border-l-4 border-brand" : ""
        }`}
      >
        <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
          {tCommon("common.questions")} {index + 1}/{total}
        </Text>

        <div className="flex items-center gap-4">
          <StatusChip
            variant="outline"
            tone="success"
            className={`body-small !font-semibold !text-white ${chipTone}`}
            label={t(`legend.${status}`)}
          />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200/60">
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
              <ChevronIcon size={16} variant="down" />
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-3">
              <div className="px-3">
                <QuestionText question={q.question ?? ""} image={q.question_image ?? undefined} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {options.map((opt, i) => (
                  <OptionCard
                    key={i}
                    index={i}
                    value={opt}
                    correctOption={q.correct_option - 1}
                    userOption={q.selected_option != null ? q.selected_option - 1 : null}
                    isQuestionAnswered={isAnswered}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {isExplanation && (
                  <QuestionExplanation
                    correctOption={q.correct_option}
                    explanation={q.explanation}
                    incorrectExplanation={q.incorrect_explanation}
                  />
                )}
              </AnimatePresence>

              <div className="pb-2">
                <Button
                  onClick={() => setIsExplanation((v) => !v)}
                  sx={{ borderRadius: "50px" }}
                  fullWidth
                  variant="outlined"
                  size="md"
                >
                  <div className="flex items-center gap-2">
                    <p>{isExplanation ? t("explanation.hide") : t("explanation.show")}</p>
                    <motion.div
                      animate={{ rotate: isExplanation ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <ChevronIcon size={16} variant="down" color="var(--color-brand)" />
                    </motion.div>
                  </div>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
