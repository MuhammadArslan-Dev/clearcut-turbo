"use client";

import { useTranslations } from "next-intl";
import { Info, Gift, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "@/i18n/navigation";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { FREE_CREDITS_PLAN_PRICE, infoBarKind, testTypeOfTab } from "@/lib/freeCredits/ui";
import { useFreeCredits } from "./useFreeCredits";
import { openCreditsCheckout } from "./openCreditsCheckout";

/**
 * Light-blue bar above the test lists (approved design): "2 free tests left. Get unlimited tests
 * for ₹99/month" with an arrow, or - on the last credit - the bolder "Last free test. ...".
 * Tapping it opens the same checkout as the lock screen. Hidden at 0 left (the cards are locked
 * and the modal does the job) and for everyone outside the treatment.
 */
export default function FreeCreditsInfoBar({
  exam,
  groupCode,
  paid,
}: {
  exam: string | null | undefined;
  groupCode: string | number | null | undefined;
  paid?: boolean;
}) {
  const t = useTranslations("freeCredits");
  const router = useRouter();
  const { get } = useQueryParams();
  const { credits } = useFreeCredits(exam, { skip: paid });
  const kind = infoBarKind(credits);
  if (kind === "none") return null;
  const last = kind === "last";
  return (
    <div className="px-3 pt-3 md:px-4" data-testid="free-credits-info-bar">
      <button
        type="button"
        onClick={() =>
          openCreditsCheckout({
            router,
            groupCode,
            examShort: exam,
            testType: testTypeOfTab(get("testType")),
            creditsUsed: credits.used,
            variant: credits.variant,
          })
        }
        className={clsx(
          "flex w-full cursor-pointer items-center gap-3 rounded-lg bg-[var(--color-primary-bg-soft)] px-3 py-3 text-left",
          last ? "text-[var(--color-brand-dark)]" : "text-surface-gray-normal",
        )}
      >
        {last ? (
          <Gift size={22} className="shrink-0 text-brand" aria-hidden="true" />
        ) : (
          <Info size={22} className="shrink-0 text-brand" aria-hidden="true" />
        )}
        <span className={clsx("body-medium flex-1", last && "!font-semibold")}>
          {last
            ? t("bar.last", { price: FREE_CREDITS_PLAN_PRICE })
            : t("bar.left", { remaining: credits.remaining, price: FREE_CREDITS_PLAN_PRICE })}
        </span>
        <ChevronRight size={20} className="shrink-0 text-brand" aria-hidden="true" />
      </button>
    </div>
  );
}
