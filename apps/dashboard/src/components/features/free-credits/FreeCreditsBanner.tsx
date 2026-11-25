"use client";

import { useTranslations } from "next-intl";
import InfoStrip from "@/components/features/attempt-ui/InfoStrip";
import { getPriceForVariant } from "@/lib/payment/examPriceOverrides";
import { useFreeCredits } from "./useFreeCredits";

/** Soft banner: shown once 3 or more credits are used and some are still left. */
export const FREE_CREDITS_BANNER_FROM_USED = 3;

export default function FreeCreditsBanner({
  exam,
  paid,
}: {
  exam: string | null | undefined;
  paid?: boolean;
}) {
  const t = useTranslations("freeCredits");
  const { credits } = useFreeCredits(exam, { skip: paid });
  if (!credits.active || credits.used < FREE_CREDITS_BANNER_FROM_USED || credits.remaining <= 0) return null;
  return (
    <div className="px-3 pt-3 md:px-4" data-testid="free-credits-banner">
      <InfoStrip>
        {t("banner", {
          remaining: credits.remaining,
          price: getPriceForVariant("1month-onetime", null, exam ?? undefined),
        })}
      </InfoStrip>
    </div>
  );
}
