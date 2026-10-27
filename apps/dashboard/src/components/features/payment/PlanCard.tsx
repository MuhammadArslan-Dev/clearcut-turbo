"use client";

import React from "react";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { CheckIcon } from "@/components/ui/icons";

/** Matches the radius the payment page and MainPaywall already use. */
const PLAN_CARD_RADIUS = 12;

export type PlanBadge = {
  label: string;
  /**
   * "ribbon" straddles the card's top edge (the design's blue "Best for new
   * students"); "inline" sits inside the card above the price (the amber
   * "Most Popular").
   */
  placement: "ribbon" | "inline";
  /** Maps to StatusChip's tone — "info" is the blue pill, "warning" the amber one. */
  tone: "info" | "warning";
  iconLeft?: React.ReactNode;
};

export interface PlanCardProps {
  /** Duration half of the title, e.g. "1 month" — already localised. */
  durationLabel: string;
  /** Price half of the title, e.g. "₹149" — already formatted. */
  price: string;
  /** Struck-through reference price shown beside it, e.g. "₹1,499". */
  strikePrice?: string;
  /** Grey line under the price, e.g. "One-time payment • No auto-renewal". */
  subtitle?: string;
  badge?: PlanBadge;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}

/**
 * One selectable plan row, shared by the payment page and MainPaywall.
 *
 * Both screens had this markup copied out near-identically, so a change to one
 * silently left the other behind. It is purely presentational — it holds no
 * pricing, variant or analytics logic; the caller passes already-localised,
 * already-formatted strings and owns what `onSelect` does.
 */
export default function PlanCard({
  durationLabel,
  price,
  strikePrice,
  subtitle,
  badge,
  selected,
  onSelect,
  className,
}: PlanCardProps) {
  const ribbon = badge?.placement === "ribbon" ? badge : undefined;
  const inline = badge?.placement === "inline" ? badge : undefined;

  return (
    // The ribbon hangs outside the card's own box, and Card clips to its
    // border by default — `overflow="visible"` is what lets it straddle the
    // edge instead of being cut in half.
    <div className={`relative ${ribbon ? "mt-2" : ""} ${className ?? ""}`}>
      <Card
        padding={ribbon ? "16px 20px 12px" : "12px 20px"}
        borderRadius={PLAN_CARD_RADIUS}
        cursor="pointer"
        borderwidth={2}
        overflow="visible"
        bgcolor={selected ? "var(--color-primary-subtle)" : "white"}
        bordercolor={selected ? "var(--color-brand)" : "var(--color-primary-subtle)"}
        className="exam-card !h-auto !min-h-0 transition-all duration-200 ease-out"
        onClick={onSelect}
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        {ribbon && (
          // StatusChip's filled/info is Tailwind blue-600 (#2563eb), which sat
          // next to the brand blue (#0083ff) of the CTA and the selected
          // border and read as a different colour. Overridden at the call site
          // rather than changing the shared chip, which other screens use.
          <StatusChip
            className="absolute -top-3 left-4 !bg-brand !text-white"
            variant="filled"
            tone={ribbon.tone}
            radius="full"
            size="sm"
            iconLeft={ribbon.iconLeft}
            label={ribbon.label}
          />
        )}

        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {inline && (
              <StatusChip
                className="self-start"
                variant="soft"
                tone={inline.tone}
                radius="full"
                size="sm"
                iconLeft={inline.iconLeft}
                label={inline.label}
              />
            )}

            <p className="heading-medium !font-semibold text-surface-gray-normal">
              {durationLabel} • {price}
              {strikePrice && (
                <>
                  {" "}
                  <Text className="line-through" variant="body-small">
                    {strikePrice}
                  </Text>
                </>
              )}
            </p>

            {subtitle && (
              <p className="body-small !font-normal text-surface-gray-muted">{subtitle}</p>
            )}
          </div>

          {/* Both states are the same 24px box, so selecting never shifts the row. */}
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            {selected ? (
              <CheckIcon size={24} />
            ) : (
              <span className="h-6 w-6 rounded-full border border-gray-400" />
            )}
          </span>
        </div>
      </Card>
    </div>
  );
}
