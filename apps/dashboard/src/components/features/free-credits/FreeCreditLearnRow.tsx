"use client";

import { useTranslations } from "next-intl";
import type { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import { FREE_CREDITS_PLAN_PRICE, learnRowKind } from "@/lib/freeCredits/ui";
import FreeCreditDots from "./FreeCreditDots";
import { useFreeCredits } from "./useFreeCredits";
import { openCreditsInfo } from "./openCreditsInfo";

/**
 * Credit row of the My Courses card (approved design 05/06): dots + "N of 5 free tests left",
 * a "Get unlimited" link on the last credit, "Free tests used" (muted) at 0. Renders nothing
 * outside the treatment, so the card is unchanged for everyone else.
 */
export default function FreeCreditLearnRow({
  exam,
  course,
  paid,
  part = "row",
}: {
  exam: string | null | undefined;
  /** The card's own enrolment (with its exam), straight from the caller: no lookup. */
  course: ExamEnrollmentWithExam | null | undefined;
  paid?: boolean;
  /** "row" = dots + counter (under the header); "note" = the 0-left note (above the card's buttons). */
  part?: "row" | "note";
}) {
  const t = useTranslations("freeCredits");
  const { credits } = useFreeCredits(exam, { skip: paid });
  const kind = learnRowKind(credits);
  if (kind === "none") return null;
  const used = kind === "used";
  if (part === "note") {
    return used ? (
      <p
        className="body-small rounded-md bg-[var(--color-primary-bg-soft)] px-3 py-2 text-center !font-medium text-brand"
        data-testid="free-credits-learn-note"
      >
        {t("learn.note", { price: FREE_CREDITS_PLAN_PRICE })}
      </p>
    ) : null;
  }
  return (
    <div className="flex flex-col gap-2" data-testid="free-credits-learn-row">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <FreeCreditDots limit={credits.limit} remaining={credits.remaining} size="sm" className="shrink-0" />
        <span className="h-5 w-px shrink-0 bg-gray-200" aria-hidden="true" />
        <span className={used ? "body-medium whitespace-nowrap text-surface-gray-muted" : "body-medium whitespace-nowrap text-surface-gray-normal"}>
          {used ? t("learn.used") : t("learn.left", { remaining: credits.remaining, limit: credits.limit })}
        </span>
        {kind === "last" && (
          <button
            type="button"
            className="body-medium ml-auto shrink-0 cursor-pointer !font-semibold text-brand underline"
            onClick={() => openCreditsInfo(course, "learn_row")}
          >
            {t("learn.getUnlimited")}
          </button>
        )}
      </div>
    </div>
  );
}
