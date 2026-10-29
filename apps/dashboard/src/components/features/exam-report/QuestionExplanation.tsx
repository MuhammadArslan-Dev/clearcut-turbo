"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Text from "@clearcut/ui/text";
import MathRender from "../mathjax/Math";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import { NumberCountIcon } from "@/components/ui/icons";

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
 */
export default function QuestionExplanation({
  correctOption,
  explanation,
}: {
  /** 1-based number of the correct option (1 = A). */
  correctOption?: number | null;
  explanation?: string | null;
}) {
  const t = useTranslations("modals.performanceReport");
  const correctLetter = correctOption != null ? String.fromCharCode(65 + Number(correctOption) - 1) : "-";

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
      <div className="flex flex-col justify-center items-start gap-4 bg-[#006bd108] p-3 rounded-lg">
        <Text as="p" variant="heading-small" weight="semibold">
          {t("explanation.title")}
        </Text>
        <MathRender content={explanation ?? undefined}>
          {/* "div" not "p": the markdown renderer wraps its own output in a <p>. */}
          <Text as="div" variant="body-large" weight="normal" color="gray-normal">
            <TextMarkDown>{explanation ?? ""}</TextMarkDown>
          </Text>
        </MathRender>
      </div>
    </motion.div>
  );
}
