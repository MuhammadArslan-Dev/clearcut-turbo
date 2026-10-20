"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Card } from "@clearcut/ui/card";
import { Button } from "@clearcut/ui/button";
import { cn } from "@clearcut/ui/utils";
import { Lightbulb } from "lucide-react";
import ReportMistake from "@/components/blog/assessment-question/report-mistake/report-mistake";
import ShareQuestion from "@/components/blog/assessment-question/share-question/share-question";
import { EXPLANATION_ATTR } from "@/lib/question-bank/dom-attrs";

const OPTION_LABELS = ["", "A", "B", "C", "D"];

/** Option text is plain text (not markdown), so it is passed as data. */
export interface InteractionOption {
  n: number;
  text: string | null;
  image: string | null;
}

/**
 * The interactive part of a question card: picking an option and revealing
 * the result. Everything else — including the answer + explanation panel,
 * which this only opens/closes — is rendered on the server (see
 * question-card.tsx); this gets plain data only: option text/image, the
 * correct option and a short plain-text snippet for Share/Report.
 *
 * Markup and colours are unchanged from the previous all-client card
 * (exact reveal colours from apps/dashboard's exam report, lettered 36×36
 * option badges, `lg:grid-cols-2`).
 */
export default function QuestionInteraction({
  questionId,
  position,
  correct,
  options,
  lazyImages,
  questionText,
  exam,
  sharePath,
}: {
  questionId: number;
  position: number;
  correct: number;
  options: InteractionOption[];
  /** Off-screen cards' option images load lazily. */
  lazyImages: boolean;
  /** Plain-text question, for the Share/Report dialogs. */
  questionText: string;
  exam?: string;
  /** "<level>/subject/<subject>/<chapter>[/page/N]" for the share link. */
  sharePath?: string;
}) {
  const t = useTranslations("QuestionCard");
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  // Single disclosure state driving the correct/wrong feedback and the merged
  // "answer + explanation" panel. Set true only by the "Show Explanation &
  // Result" button, which appears once an option is picked. The panel's
  // native <details> `open` is kept in sync both ways.
  const [revealed, setRevealed] = React.useState(false);
  const gridRef = React.useRef<HTMLDivElement>(null);

  const panel = React.useCallback(
    () => gridRef.current?.parentElement?.querySelector<HTMLDetailsElement>(`:scope > details[${EXPLANATION_ATTR}]`) ?? null,
    [],
  );

  // Show/open the server-rendered panel when revealed (hidden until then).
  React.useEffect(() => {
    const details = panel();
    if (!details) return;
    details.classList.toggle("hidden", !revealed);
    if (details.open !== revealed) details.open = revealed;
  }, [revealed, panel]);

  // Closing it via its own summary keeps the picked option but hides the result.
  React.useEffect(() => {
    const details = panel();
    if (!details) return;
    const onToggle = () => setRevealed(details.open);
    details.addEventListener("toggle", onToggle);
    return () => details.removeEventListener("toggle", onToggle);
  }, [panel]);

  return (
    <>
      <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-2 gap-3" role="group" aria-label={t("optionsFor", { index: position })}>
        {options.map(({ n, text, image }) => {
          const isCorrect = n === correct;
          const isSelected = n === selectedOption;
          // Feedback waits for the reveal button, not merely a pick.
          const highlighted = revealed && (isCorrect || isSelected);
          const bordercolor = revealed && isCorrect
            ? "var(--color-answer-correct-border)"
            : revealed && isSelected
              ? "var(--color-answer-incorrect-border)"
              : isSelected
                ? "var(--color-brand)"
                : "var(--color-border-gray-subtle)";
          const bgcolor = revealed && isCorrect
            ? "var(--color-answer-correct-bg)"
            : revealed && isSelected
              ? "var(--color-answer-incorrect-bg)"
              : isSelected
                ? "var(--color-primary-bg-soft)"
                : "transparent";

          return (
            <button
              key={n}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedOption(n)}
              className={cn(
                "text-left rounded-lg p-0 transition-opacity focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                revealed && !isSelected && !isCorrect && "opacity-70",
              )}
            >
              <Card
                bgcolor={bgcolor}
                bordercolor={bordercolor}
                borderwidth={!revealed || highlighted ? 2 : 1}
                borderRadius={8}
                cursor="pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 shrink-0 rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center font-semibold">
                    {OPTION_LABELS[n]}
                  </span>
                  {text && (
                    <span data-qs="" className="body-large !font-normal surface-text-gray-normal">
                      {text}
                    </span>
                  )}
                  {image && (
                    // Plain <img>: an unverified DB URL would crash next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt=""
                      width={160}
                      height={160}
                      loading={lazyImages ? "lazy" : undefined}
                      decoding="async"
                      className="aspect-video w-24 h-24 rounded-md object-cover shrink-0"
                    />
                  )}
                  {revealed && isCorrect && (
                    <span className="ml-auto text-[var(--color-answer-correct-border)] body-small !font-semibold">
                      {t("correct")}
                    </span>
                  )}
                  {revealed && isSelected && !isCorrect && (
                    <span className="ml-auto text-[var(--color-answer-incorrect-border)] body-small !font-semibold">
                      {t("yourPick")}
                    </span>
                  )}
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {!revealed && (
        <div aria-live="polite" className="text-center">
          {selectedOption === null ? (
            // Icon inline (not a flex item) so it stays next to the first
            // line when the centred hint wraps on phones.
            <p className="text-center body-medium !font-normal surface-text-gray-muted">
              <Lightbulb size={16} className="mr-2 inline-block align-text-bottom" aria-hidden="true" />
              {t("hint")}
            </p>
          ) : (
            <Button variant="solid" color="primary" size="md" onClick={() => setRevealed(true)}>
              {t("showExplanationResult")}
            </Button>
          )}
        </div>
      )}
      {revealed && (
        <div className="flex flex-wrap justify-end gap-2 -mb-2">
          <ShareQuestion questionId={questionId} question={questionText} exam={exam} chapterPath={sharePath} />
          <ReportMistake questionId={questionId} question={questionText} />
        </div>
      )}
    </>
  );
}
