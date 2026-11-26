"use client";

import { useTranslations } from "next-intl";
import { useFreeCredits } from "./useFreeCredits";

/** Small green "Free" chip beside "New" on Today's Daily Test: only while the credits are active. */
export default function FreeCreditDailyBadge({ exam, paid }: { exam: string | null | undefined; paid?: boolean }) {
  const t = useTranslations("freeCredits");
  const { credits } = useFreeCredits(exam, { skip: paid });
  if (!credits.active) return null;
  return (
    <span className="body-xsmall shrink-0 rounded-full bg-[var(--color-success-bg-soft)] px-2.5 py-0.5 !font-semibold text-[var(--color-success-strong)]">
      {t("dailyFreeBadge")}
    </span>
  );
}
