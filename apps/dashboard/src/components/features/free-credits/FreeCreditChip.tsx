"use client";

import { useTranslations } from "next-intl";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { useFreeCredits } from "./useFreeCredits";

/**
 * "3 of 5 free tests left" - same chip look as the "Must attempt" chip on the test cards.
 * Renders nothing unless the user is in the free-credits treatment, so every screen that
 * mounts it is unchanged for everyone else. Never put it on a Topic Test (never credited).
 */
export default function FreeCreditChip({
  exam,
  paid,
  className,
}: {
  exam: string | null | undefined;
  /** Course status "active": paid users never see credits (and no request is made). */
  paid?: boolean;
  className?: string;
}) {
  const t = useTranslations("freeCredits");
  const { credits } = useFreeCredits(exam, { skip: paid });
  if (!credits.active || credits.limit <= 0) return null;
  return (
    <StatusChip
      variant="outline"
      tone="info"
      className={`h-5 !text-brand !bg-brand/9 body-small !font-normal ${className ?? ""}`}
      label={
        credits.remaining > 0
          ? t("chip", { remaining: credits.remaining, limit: credits.limit })
          : t("chipNone", { limit: credits.limit })
      }
    />
  );
}
