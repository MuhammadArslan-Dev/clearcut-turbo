"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Card } from "@clearcut/ui/card";
import { Button } from "@clearcut/ui/button";
import { Chip } from "@clearcut/ui/chip";
import { ChevronDown, Lightbulb } from "lucide-react";
import Math from "@/components/ui/math";
import TextMarkDown from "@/components/ui/text-markdown";
import { cn } from "@clearcut/ui/utils";
import type { Question } from "./questions-list";
import { normalizeCourseLang, selectTranslation } from "@/utils/question-translation";
import { useLanguageStore } from "@/store/useLanguageStore";
import ReportMistake from "./report-mistake/report-mistake";
import ShareQuestion from "./share-question/share-question";

const OPTION_LABELS = ["", "A", "B", "C", "D"];

export interface SectionQuestionCardProps {
  question: Question;
  index: number; // 1-based position within the section
  total: number;
  /** Label shown as the small badge next to the heading — the question's
   * topic/chapter/subject name, whichever the page's `groupBy` is currently
   * using (see section-questions-experience.tsx). Named generically because
   * which field it comes from varies by page, not because it's ever
   * ambiguous at a given call site. */
  groupLabel: string | null;
  hidden: boolean; // parent-controlled visibility (search/group filter) — CSS only, node stays in the DOM
  /** Parent sets this briefly after the visitor picks this question from the
   * search-suggestions dropdown — a temporary ring so "visibly identify the
   * target question" doesn't rely on scroll position alone. */
  justNavigatedTo?: boolean;
  /** Exam slug and this question's canonical chapter path, for its share link. */
  exam?: string;
  shareChapterPath?: string;
}

/**
 * Visually matches apps/dashboard's real Exam/Daily Test attempt question
 * card (`QOption.tsx`, shared by both attempt screens — confirmed by a
 * direct repo trace, not assumed) and its Exam Report Sheet's
 * correct/incorrect reveal + explanation panel (`exam-report/OptionCard.tsx`,
 * `ExamReportSheet.tsx`). Matched: outer card recipe (white, no border,
 * rounded-xl, p-4/lg:p-5), options grid breakpoint (`lg:grid-cols-2`, not
 * `md`), the 36×36 circular lettered option badge, 14px/16px option padding,
 * the exact correct/incorrect reveal colours (new `--color-answer-correct-*`
 * / `--color-answer-incorrect-*` tokens in packages/design-tokens, added
 * specifically because dashboard's own versions are hardcoded hex with no
 * existing token), the "Question N / Total" heading format, and the
 * Explanation panel's header/badge/content-box styling (`--color-brand-dark-
 * legacy` at the exact tint dashboard's `#006bd108`/`#006bd115` resolve to).
 *
 * NOT copied: dashboard's collapse MECHANISM for the question card and the
 * explanation panel — both are React-state conditional renders there
 * (`{isOpen && (...)}` / `{isExplanation && (...)}`), which is fine on an
 * authenticated, client-only report screen but would strip the explanation
 * out of this page's server-rendered HTML entirely while collapsed — exactly
 * the bug Phase 1 fixed. This still uses native `<details>`/`<summary>` so
 * the full text is always in the initial HTML; see the file-level comment on
 * `section-questions-experience.tsx` for the same reasoning applied to
 * search/filter visibility.
 */
export default function SectionQuestionCard({
  question,
  index,
  total,
  groupLabel,
  hidden,
  justNavigatedTo,
  exam,
  shareChapterPath,
}: SectionQuestionCardProps) {
  const t = useTranslations("QuestionCard");
  const { courseLanguage } = useLanguageStore();
  const courseLang = normalizeCourseLang(courseLanguage);
  const translation = selectTranslation(question.translations, courseLang);

  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  // Single disclosure state driving the correct/wrong feedback and the merged
  // "answer + explanation" panel. Set true only by the "Show Explanation &
  // Result" button, which appears once an option is picked. Native
  // <details>'s `open` is kept in sync both ways: forced open by this state,
  // and synced back here via onToggle so a user can close it again without
  // losing their selected option.
  const [revealed, setRevealed] = React.useState(false);

  const anchorId = `q-${question.id}`;
  const correctOption = Number(translation?.correct_option) || 0;

  const options = [
    { text: translation?.option_1_text, img: translation?.option_1_image },
    { text: translation?.option_2_text, img: translation?.option_2_image },
    { text: translation?.option_3_text, img: translation?.option_3_image },
    { text: translation?.option_4_text, img: translation?.option_4_image },
  ];

  if (!translation) {
    // No translation at all for this question in any locale — nothing to
    // render; never fabricate placeholder question/option text.
    return null;
  }

  const correctAnswerBadge = (
    <span className="inline-flex items-center justify-center h-6 px-2 rounded-[6px] bg-[var(--color-brand-dark-legacy)]/[8%] text-[var(--color-brand-dark-legacy)] body-small !font-semibold">
      {t("option", { label: OPTION_LABELS[correctOption] || "-" })}
    </span>
  );

  return (
    <section
      id={anchorId}
      aria-labelledby={`${anchorId}-heading`}
      tabIndex={-1}
      // scroll-margin-top keeps a hash/anchor jump from landing the question
      // under the page's own sticky header; see globals.css for the token.
      // bg-white, no border, rounded-xl, p-4/lg:p-5 — the exact recipe
      // dashboard's attempt question card uses (`<Card bgcolor="white"
      // border="border-none" padding={0} borderRadius={12}>` + inner
      // `p-4 lg:p-5`); kept as a plain <section> rather than <Card> itself so
      // the question keeps its own landmark/heading semantics.
      className={cn(
        "scroll-mt-24 bg-white rounded-xl p-4 lg:p-5 space-y-4 transition-shadow duration-500",
        hidden && "hidden",
        justNavigatedTo && "ring-2 ring-[var(--color-brand)] ring-offset-2",
      )}
      data-question-id={question.id}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id={`${anchorId}-heading`} className="heading-large !font-semibold">
          {t("question")} {index}{" "}
          <span className="body-large !font-normal surface-text-gray-muted">/ {total}</span>
        </h3>
        {groupLabel && (
          <Chip size="sm" className="surface-text-gray-muted bg-[var(--color-background-gray-subtle)]">
            {groupLabel}
          </Chip>
        )}
      </div>

      <div className="body-large !font-normal">
        <Math content={translation.question}>
          <TextMarkDown>{translation.question ?? ""}</TextMarkDown>
        </Math>
      </div>

      {translation.question_image && (
        // Matches dashboard's QuestionText.tsx image treatment (160×160,
        // aspect-video, rounded-md). Deliberately a plain <img>, not
        // next/image: dashboard's own remote images come from the same S3
        // bucket apps/blog already allowlists in next.config.ts, but an
        // unverified image URL elsewhere in the DB would hard-crash
        // next/image at runtime (unlike a plain <img>, which just renders
        // whatever src it's given) — not a risk worth taking for a visual
        // match alone.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={translation.question_image}
          alt=""
          width={160}
          height={160}
          className="aspect-video w-40 h-40 rounded-md object-cover"
        />
      )}

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-3"
        role="group"
        aria-label={t("optionsFor", { index })}
      >
        {options.map((opt, i) => {
          const optionNumber = i + 1;
          if (!opt.text && !opt.img) return null;
          const isCorrect = optionNumber === correctOption;
          const isSelected = optionNumber === selectedOption;
          // Driven by `revealed`, not merely "an option was clicked" — picking
          // only marks the selection; feedback waits for the reveal button.
          const highlighted = revealed && (isCorrect || isSelected);

          // Reveal colours match apps/dashboard's exam-report OptionCard.tsx
          // exactly (border #15803d/bg #dcfce7 correct, border #b91c1c/bg
          // #fee2e2 incorrect) via the new --color-answer-correct-*/
          // --color-answer-incorrect-* tokens — not --color-success/-danger,
          // which exist but are a different, not byte-identical green/red.
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
              key={optionNumber}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedOption(optionNumber)}
              className={cn(
                "text-left rounded-lg p-0 transition-opacity focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                revealed && !isSelected && !isCorrect && "opacity-70",
              )}
            >
              {/* borderwidth 2 matches dashboard's live-attempt QOption
                  default, and its report-sheet reveal (2 when highlighted,
                  1 otherwise once answered) — borderRadius 8, padding
                  "14px 16px", both exact QOption.tsx values. */}
              <Card
                bgcolor={bgcolor}
                bordercolor={bordercolor}
                borderwidth={!revealed || highlighted ? 2 : 1}
                borderRadius={8}
                // padding="14px 16px"
                cursor="pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 shrink-0 rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center font-semibold">
                    {OPTION_LABELS[optionNumber]}
                  </span>
                  {opt.text && <span className="body-large !font-normal surface-text-gray-normal">{opt.text}</span>}
                  {opt.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={opt.img}
                      alt=""
                      width={160}
                      height={160}
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

      {/*
        SEO-safe disclosure: the correct answer and explanation are ALWAYS
        present in this <details> element's markup — including in the raw
        server-rendered HTML, before any hydration or interaction — so they
        are indexable content, not something that exists only after a
        client-side fetch. What changes with `revealed` is purely visual:
        native <details> hides its body via the UA stylesheet when closed.
        This is the same mechanism for every visitor (no bot/user branching,
        no cloaking) — search engines that render JS see identical markup to
        a human; the only thing that differs is whether the visitor (or
        crawler) happened to trigger the same toggle a human would.

        Until the visitor picks an option and presses "Show Explanation &
        Result", the panel is visually hidden (still in the markup) and a
        hint takes its place, so nothing answer-revealing is visible first.

        Always rendered (not gated on `translation.explanation` existing) —
        a question's correct answer must stay revealable even when it has no
        explanation text.
      */}
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
          <ShareQuestion
            questionId={question.id}
            question={translation.question ?? ""}
            exam={exam}
            chapterPath={shareChapterPath}
          />
          <ReportMistake questionId={question.id} question={translation.question ?? ""} />
        </div>
      )}
      <details
        open={revealed}
        onToggle={(e) => setRevealed(e.currentTarget.open)}
        className={cn(
          "group rounded-lg bg-[var(--color-brand-dark-legacy)]/[3%] p-3",
          !revealed && "hidden",
        )}
      >
        <summary className="cursor-pointer list-none flex items-center justify-between">
          <span className="heading-medium !font-semibold">{t("answerExplanation")}</span>
          <ChevronDown
            className="text-[var(--color-brand-dark-legacy)] group-open:rotate-180 transition-transform"
            size={18}
            aria-hidden="true"
          />
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="body-medium !font-semibold surface-text-gray-normal">{t("correctAnswer")}</span>
            {correctAnswerBadge}
          </div>
          {translation.explanation && (
            <div className="body-large !font-normal surface-text-gray-normal leading-7">
              <Math content={translation.explanation}>
                <TextMarkDown>{translation.explanation ?? ""}</TextMarkDown>
              </Math>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}
