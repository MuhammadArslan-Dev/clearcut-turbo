"use client";

import { useTranslations } from "next-intl";
import { Ticket } from "lucide-react";
import { isTestHeld, startNoteKind } from "@/lib/freeCredits/ui";
import { useFreeCredits } from "./useFreeCredits";

/**
 * Soft-blue note in the start sheet / dialog of a credited test: "Uses 1 of your 3 free tests.
 * 2 will be left." / "This uses your last free test." Nothing when the feature is off, no credit
 * is left, or the test was already started (re-opening it is free). Never mounted for Topic Tests.
 */
export default function FreeCreditStartNote({
  exam,
  paid,
  testType,
  testRef,
}: {
  exam: string | null | undefined;
  paid?: boolean;
  /** sectional | chapter | full-length */
  testType: string;
  testRef: string | number | null | undefined;
}) {
  const t = useTranslations("freeCredits");
  const { credits } = useFreeCredits(exam, { skip: paid });
  const kind = startNoteKind(credits, isTestHeld(credits, testType, testRef));
  if (kind === "none") return null;
  return (
    <div
      className="mx-auto flex w-full max-w-[336px] items-center gap-3 rounded-lg bg-[var(--color-primary-bg-soft)] px-3 py-3"
      data-testid="free-credits-start-note"
    >
      <Ticket size={26} className="shrink-0 text-brand" aria-hidden="true" />
      <p className="body-medium text-surface-gray-normal">
        {kind === "last" ? (
          <span className="!font-semibold text-brand">{t("start.last")}</span>
        ) : (
          <>
            <span className="!font-semibold text-brand">{t("start.uses", { remaining: credits.remaining })}</span>{" "}
            {t("start.left", { left: credits.remaining - 1 })}
          </>
        )}
      </p>
    </div>
  );
}
