"use client";

import { useTranslations } from "next-intl";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@clearcut/ui/button";
import FreeCreditDots from "./FreeCreditDots";
import { FREE_CREDITS_PLAN_PRICE, cutoffBox } from "@/lib/freeCredits/ui";

/**
 * Body of the "free tests are used" lock screen - approved Variant C ("Cutoff motivated"):
 * title, price line, dots row, three benefits, the cutoff box (only for a known positive gap),
 * "Get Unlimited Tests", "Continue Free" and the reassurance line. No illustration.
 * Presentational: the caller owns navigation, tracking and closing.
 */
export default function CreditsFinishedBody({
  limit,
  used,
  exam,
  gap,
  pass,
  onGetUnlimited,
  onContinueFree,
  onClose,
}: {
  limit: number;
  used: number;
  exam: string;
  gap: number | null;
  pass: number | null;
  onGetUnlimited: () => void;
  onContinueFree: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("freeCredits.finished");
  const box = cutoffBox(gap, pass);
  const shownLimit = limit > 0 ? limit : used;
  const benefits = [t("benefitUnlimited"), t("benefitSolutions"), t("benefitRank")];
  return (
    <div className="flex flex-col gap-3 bg-white p-5" data-testid="free-credits-finished">
      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="-m-2 cursor-pointer p-2" aria-label={t("close")}>
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="heading-large !font-bold text-surface-gray-normal">{t("title", { limit: shownLimit })}</h2>
        <p className="body-medium text-surface-gray-muted" data-testid="free-credits-lock-subtitle">
          {t("subtitle", { price: FREE_CREDITS_PLAN_PRICE })}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 rounded-full bg-[var(--color-primary-bg-soft)] px-4 py-2">
        <FreeCreditDots limit={shownLimit} remaining={shownLimit} />
        <span className="body-medium text-surface-gray-normal">{t("progress", { used: shownLimit, limit: shownLimit })}</span>
      </div>

      <ul className="flex flex-col gap-3 rounded-lg bg-[var(--background-gray-subtle)] px-4 py-4">
        {benefits.map((b) => (
          <li key={b} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-strong)] text-white">
              <Check size={14} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="body-medium text-surface-gray-normal">{b}</span>
          </li>
        ))}
      </ul>

      {box && (
        <p
          className="body-medium rounded-lg bg-[var(--color-primary-bg-soft)] px-4 py-3 !font-semibold text-brand"
          data-testid="free-credits-cutoff-box"
        >
          {box.pass != null
            ? t("cutoffWithPass", { gap: box.gap, exam, pass: box.pass })
            : t("cutoff", { gap: box.gap, exam })}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button onClick={onGetUnlimited} fullWidth size="lg" sx={{ borderRadius: "50px" }}>
          <span className="flex items-center justify-center gap-2">
            {t("cta")}
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        </Button>
        <Button onClick={onContinueFree} fullWidth size="lg" variant="outlined" sx={{ borderRadius: "50px" }}>
          {t("continueFree")}
        </Button>
      </div>

      <p className="body-small text-center text-surface-gray-muted">{t("footnote")}</p>
    </div>
  );
}
