"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import MathRender from "../mathjax/Math";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import { ChevronIcon, NumberCountIcon } from "@/components/ui/icons";

/**
 * The ONE explanation panel: "Explanation" heading + the correct-answer letter,
 * then the explanation text in the soft blue box. Lifted verbatim out of the
 * Performance Report (ExamReportSheet -> QuestionItem) so the report, the Daily
 * Test result and the Practice Test result all render explanations identically.
 *
 * The text goes through the shared `TextMarkDown` (rehype-raw + sanitize + the
 * markdown-content spacing fix) inside `MathRender` (KaTeX). A bare
 * `<ReactMarkdown>` is a second, inconsistent renderer - it shows raw `<br>`,
 * collapses spacing and mangles lists - so never render an explanation with it.
 *
 * Mount it inside an `AnimatePresence` for the exit animation, or on its own
 * (it still fades/slides in).
 *
 * Phase 100: `incorrectExplanation` (backend `incorrect_explanation`) is
 * optional. When it is empty the panel is exactly the old one (one blue
 * "Explanation" box). When present: a light-green "Correct Explanation" box
 * (same green as the correct OptionCard), then a "Show Incorrect Explanation"
 * button that reveals a light-red "Incorrect Explanation" box (same red as a
 * wrong OptionCard). The incorrect part starts hidden every time the panel opens.
 */
export default function QuestionExplanation({
  correctOption,
  explanation,
  incorrectExplanation,
}: {
  /** 1-based number of the correct option (1 = A). */
  correctOption?: number | null;
  explanation?: string | null;
  /** Why the other options are wrong. NULL / blank = section not rendered. */
  incorrectExplanation?: string | null;
}) {
  const t = useTranslations("modals.performanceReport");
  const correctLetter = correctOption != null ? String.fromCharCode(65 + Number(correctOption) - 1) : "-";
  const hasIncorrect = Boolean(incorrectExplanation?.trim());
  const [showIncorrect, setShowIncorrect] = useState(false);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-4 py-3"
    >
      <div className="flex justify-between items-center ">
        <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
          {t("explanation.heading")}
        </Text>

        <div className="flex gap-1 items-center">
          <Text as="p" variant="body-small" weight="normal" color="gray-subtle">
            {t("explanation.correctAnswer")}
          </Text>
          <NumberCountIcon
            value={correctLetter as React.ComponentProps<typeof NumberCountIcon>["value"]}
            radius={6}
            size={24}
            background="#006bd115"
            color="#0083ff"
          />
        </div>
      </div>
      <div
        className={`flex flex-col justify-center items-start gap-4 p-3 rounded-lg ${
          hasIncorrect ? "bg-green-100" : "bg-[#006bd108]"
        }`}
      >
        <Text as="p" variant="heading-small" weight="semibold">
          {hasIncorrect ? t("explanation.correctTitle") : t("explanation.title")}
        </Text>
        <MathRender content={explanation ?? undefined}>
          {/* "div" not "p": the markdown renderer wraps its own output in a <p>. */}
          <Text as="div" variant="body-large" weight="normal" color="gray-normal">
            <TextMarkDown>{explanation ?? ""}</TextMarkDown>
          </Text>
        </MathRender>
      </div>
      {hasIncorrect && (
        <>
          <Button
            onClick={() => setShowIncorrect((v) => !v)}
            sx={{ borderRadius: "50px" }}
            fullWidth
            variant="outlined"
            color="danger"
            size="md"
            aria-expanded={showIncorrect}
          >
            <div className="flex items-center gap-2">
              <p>{showIncorrect ? t("explanation.hideIncorrect") : t("explanation.showIncorrect")}</p>
              <motion.div animate={{ rotate: showIncorrect ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
                <ChevronIcon size={16} variant="down" color="var(--color-danger)" />
              </motion.div>
            </div>
          </Button>
          <AnimatePresence initial={false}>
            {showIncorrect && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col justify-center items-start gap-4 bg-red-100 p-3 rounded-lg">
                  <Text as="p" variant="heading-small" weight="semibold">
                    {t("explanation.incorrectTitle")}
                  </Text>
                  <MathRender content={incorrectExplanation ?? undefined}>
                    <Text as="div" variant="body-large" weight="normal" color="gray-normal">
                      <TextMarkDown>{incorrectExplanation ?? ""}</TextMarkDown>
                    </Text>
                  </MathRender>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
