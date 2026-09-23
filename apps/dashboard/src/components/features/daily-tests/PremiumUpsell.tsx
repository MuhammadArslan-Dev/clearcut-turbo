"use client";

import { useTranslations } from "next-intl";
import { Card } from "@clearcut/ui/card";
import { Button } from "@clearcut/ui/button";
import { Crown } from "lucide-react";
import { ChevronIcon } from "@/components/ui/icons";

export interface PremiumUpsellProps {
  variant: "compact" | "banner";
  /** Whether the user already has premium — swaps copy/colors between the
   * "upgrade" pitch and the "you're covered" confirmation (both states are
   * in the mockups: amber/upgrade vs. green/blue "active" treatment). */
  active: boolean;
  onAction: () => void;
}

/**
 * No existing paywall component fit here without pulling in the
 * enrollment-scoped fields (group_code / price / combo_price) that
 * PaywallFloatingWidget/PreparationPaywall require and Daily Tests'
 * un-enrolled exam browsing doesn't have — see the two upgrade-prompt
 * blocks in the "UGC – Daily Tests" mockups, which are just a small
 * card + a wide banner, not a full paywall modal.
 */
export default function PremiumUpsell({ variant, active, onAction }: PremiumUpsellProps) {
  const t = useTranslations("DailyTests.upsell");
  if (variant === "compact") {
    return (
      <Card
        bgcolor={active ? "var(--color-success-bg-soft)" : "white"}
        padding="12px 16px"
        borderRadius={12}
        className="!w-auto !cursor-pointer transition-colors hover:!border-brand"
        onClick={onAction}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              active ? "bg-white" : "bg-[var(--color-warning-bg-soft)]"
            }`}
          >
            <Crown
              size={18}
              className={active ? "text-[var(--color-success-strong)]" : "text-[var(--color-warning-strong)]"}
            />
          </div>
          <div className="min-w-0">
            <p
              className={`body-small !font-semibold ${active ? "text-[var(--color-success-strong)]" : "text-brand"}`}
            >
              {active ? t("premiumActive") : t("upgrade")}
            </p>
            <p className="body-xsmall whitespace-nowrap text-surface-gray-muted">
              {active ? t("compactActiveDesc") : t("compactUpgradeDesc")}
            </p>
          </div>
          <ChevronIcon
            size={16}
            variant="right"
            color={active ? "var(--color-success-strong)" : "var(--color-surface-gray-muted)"}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card bgcolor="var(--color-primary-soft)" padding="20px" borderRadius={12}>
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
            <Crown size={22} className={active ? "text-brand" : "text-[var(--color-warning-strong)]"} />
          </div>
          <div>
            <p className="body-large !font-semibold">
              {active ? t("onPremium") : t("getFullAccess")}
            </p>
            <p className="body-small text-surface-gray-muted">
              {active ? t("bannerActiveDesc") : t("bannerUpgradeDesc")}
            </p>
          </div>
        </div>

        <Button
          variant={active ? "outlined" : "solid"}
          color="primary"
          size="md"
          rounded="50px"
          rightIcon={<ChevronIcon size={14} variant="right" color={active ? "var(--color-brand)" : "white"} />}
          onClick={onAction}
          className="w-full md:w-auto"
        >
          {active ? t("exploreMore") : t("upgrade")}
        </Button>
      </div>
    </Card>
  );
}
