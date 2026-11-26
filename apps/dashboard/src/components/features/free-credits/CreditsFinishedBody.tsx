"use client";

import { useTranslations } from "next-intl";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@clearcut/ui/button";
import FreeCreditDots from "./FreeCreditDots";
import { FREE_CREDITS_PLAN_PRICE, finishedView } from "@/lib/freeCredits/ui";

/**
 * Body of the "free tests are used" lock screen - approved Variant B ("Progress first"):
 * title, the dots row as the hero, the price pill, three benefit tiles, "Get Unlimited Tests",
 * "Continue Free" and the reassurance line. No subtitle, no illustration.
 * Presentational: the caller owns navigation, tracking and closing.
 */
export default function CreditsFinishedBody({
  limit,
  used,
  remaining = 0,
  onGetUnlimited,
  onContinueFree,
  onClose,
}: {
  limit: number;
  used: number;
  /** Credits still left: > 0 = the info modal ("N free tests left" / "Last free test"); 0 = the lock screen. */
  remaining?: number;
  onGetUnlimited: () => void;
  onContinueFree: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("freeCredits.finished");
  const shownLimit = limit > 0 ? limit : used;
  const view = finishedView(shownLimit, remaining);
  const benefits = [t("benefitUnlimited"), t("benefitSolutions"), t("benefitRank")];
  return (
    <div className="flex flex-col gap-4 bg-white p-5" data-testid="free-credits-finished">
      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="-m-2 cursor-pointer p-2" aria-label={t("close")}>
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      <h2 className="heading-large !font-bold text-center text-surface-gray-normal">{view.kind === "used" ? t("title", { limit: shownLimit }) : view.kind === "last" ? t("titleLast") : t("titleLeft", { remaining: view.remaining })}</h2>

      <div className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl bg-[var(--color-primary-bg-soft)] px-4 py-2">
        <FreeCreditDots limit={shownLimit} remaining={view.filled} />
        <span className="body-medium text-surface-gray-normal">
          {view.kind === "used"
            ? t("progress", { used: shownLimit, limit: shownLimit })
            : t("progressLeft", { remaining: view.remaining, limit: shownLimit })}
        </span>
      </div>

      <p className="heading-small mx-auto w-fit max-w-full rounded-xl bg-[var(--color-primary-bg-soft)] px-4 py-2 text-center !font-bold text-brand">
        {t("priceLine", { price: FREE_CREDITS_PLAN_PRICE })}
      </p>

      <ul className="grid grid-cols-3 gap-2">
        {benefits.map((b) => (
          <li
            key={b}
            className="flex min-w-0 flex-col items-center gap-2 rounded-xl bg-[var(--color-success-bg-soft)] px-1.5 py-3 text-center"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-strong)] text-white">
              <Check size={14} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="body-small break-words !font-medium leading-tight text-surface-gray-normal">{b}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <Button onClick={onGetUnlimited} fullWidth size="lg" sx={{ borderRadius: "50px" }}>
          <span className="flex items-center justify-center gap-2">
            {t("cta")}
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        </Button>
        <Button onClick={onContinueFree} fullWidth size="lg" variant="outlined" color="primary" sx={{ borderRadius: "50px" }}>
          {t("continueFree")}
        </Button>
      </div>

      <p className="body-small text-center text-surface-gray-muted">{t("footnote")}</p>
    </div>
  );
}
