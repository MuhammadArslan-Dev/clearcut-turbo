import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { Chip } from "@clearcut/ui/chip";
import { limitChars } from "@clearcut/utils/text-limit";
import type { CardQuestion } from "@/lib/question-bank/card-model";
import { pagePath } from "@/lib/question-bank/pagination";
import { stripHtml } from "@/utils/section-search";
import RichText from "./rich-text";
import { EXPLANATION_ATTR } from "@/lib/question-bank/dom-attrs";
import QuestionInteraction from "./question-interaction";

const OPTION_LABELS = ["", "A", "B", "C", "D"];
// Share/Report show a few lines of the question; no need to send the whole
// text a second time.
const SHARE_TEXT_CHARS = 400;

/**
 * One question, rendered on the server: heading, group label, question text
 * (markdown + KaTeX), image, and the answer + explanation panel. Only
 * `QuestionInteraction` (option picking and the reveal) is a client
 * component, and it receives plain data only — server-rendered markdown is
 * never passed into it.
 *
 * `data-tr` marks content that belongs to one course language (en | hi) —
 * hidden by CSS when the other is selected; "both" always shows. The
 * toolbar reads `data-qcard`, `data-g-en`/`data-g-hi` and `[data-qs]` text to
 * search/filter this page without re-rendering any card.
 */
export default async function QuestionCard({
  locale,
  card,
  eagerImages,
  exam,
  chapterPaths,
}: {
  locale: string;
  card: CardQuestion;
  /** First card on the page: its images are likely above the fold. */
  eagerImages: boolean;
  exam?: string;
  /** chapter slug -> canonical "<level>/subject/<subject>/<chapter>". */
  chapterPaths?: Record<string, string>;
}) {
  const t = await getTranslations({ locale, namespace: "QuestionCard" });
  const anchorId = `q-${card.id}`;
  const label = (lang: "en" | "hi") => card.labels.find((l) => l.show === "both" || l.show === lang)?.text ?? "";
  const chapterPath = card.chapterSlug ? chapterPaths?.[card.chapterSlug] : undefined;
  const sharePath = chapterPath ? pagePath(chapterPath, card.chapterPage ?? 1) : undefined;

  return (
    <section
      id={anchorId}
      aria-labelledby={`${anchorId}-heading`}
      tabIndex={-1}
      data-qcard=""
      data-n={card.position}
      data-g-en={label("en")}
      data-g-hi={label("hi")}
      // scroll-margin-top keeps a hash jump from landing under the sticky
      // header. bg-white, rounded-xl, p-4/lg:p-5: dashboard's attempt card.
      className="scroll-mt-24 bg-white rounded-xl p-4 lg:p-5 space-y-4 transition-shadow duration-500"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id={`${anchorId}-heading`} className="heading-large !font-semibold">
          {t("question")} {card.position}
        </h3>
        {card.labels.map((l) => (
          <Chip key={l.show} data-tr={l.show} size="sm" className="surface-text-gray-muted bg-[var(--color-background-gray-subtle)]">
            {l.text}
          </Chip>
        ))}
      </div>

      {card.blocks.map((block) => (
        <div key={block.show} data-tr={block.show} className="space-y-4">
          <div className="body-large !font-normal" data-qs="">
            <RichText>{block.question}</RichText>
          </div>

          {block.questionImage && (
            // Plain <img>, not next/image: an unverified URL in the DB would
            // crash next/image at runtime.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.questionImage}
              alt=""
              width={160}
              height={160}
              loading={eagerImages ? undefined : "lazy"}
              decoding="async"
              className="aspect-video w-40 h-40 rounded-md object-cover"
            />
          )}

          <QuestionInteraction
            questionId={card.id}
            position={card.position}
            correct={block.correct}
            options={block.options}
            lazyImages={!eagerImages}
            questionText={limitChars(stripHtml(block.question).trim(), SHARE_TEXT_CHARS)}
            exam={exam}
            sharePath={sharePath}
          />

          {/* SEO: the correct answer and explanation are always in the
              server-rendered HTML; QuestionInteraction only opens/closes
              this panel (hidden until the visitor reveals the result). */}
          <details
            {...{ [EXPLANATION_ATTR]: "" }}
            className="group rounded-lg bg-[var(--color-brand-dark-legacy)]/[3%] p-3 hidden"
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
                <span className="inline-flex items-center justify-center h-6 px-2 rounded-[6px] bg-[var(--color-brand-dark-legacy)]/[8%] text-[var(--color-brand-dark-legacy)] body-small !font-semibold">
                  {t("option", { label: OPTION_LABELS[block.correct] || "-" })}
                </span>
              </div>
              {block.explanation && (
                <div className="body-large !font-normal surface-text-gray-normal leading-7">
                  <RichText>{block.explanation}</RichText>
                </div>
              )}
            </div>
          </details>
        </div>
      ))}
    </section>
  );
}
