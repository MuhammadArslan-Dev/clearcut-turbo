// import { logAmplitudeEvent } from "@/services/analytics";
// import { useAuthModal } from "@/store/authModalStore";
import Chip from "@clearcut/ui/chip";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

type Props = {
  text?: string | React.ReactNode;
};

export default function FreeBadge({ text = "3 day FREE trial" }: Props) {
  // const { openModal } = useAuthModal();
  const t = useTranslations("CourseHeader");

  const badgeText = text || t("trialText");

  return (
    // Migrated from @mui/joy/Chip to the shared Chip.
    //
    // `onClick` was dropped, not lost: every line of its body was already
    // commented out, so it was a no-op that only caused Joy to render a nested
    // focusable <button class="MuiChip-action"> overlay. Removing a focus stop
    // that performs no action is an accessibility improvement, and no behaviour
    // is lost because there was none.
    //
    // `color="success"` / `variant="outlined"` have no shared-Chip equivalent by
    // design (the shared Chip is deliberately colour-neutral), so the success
    // outline is expressed with design tokens rather than Joy's palette — per the
    // approved architecture the Design System wins on styling.
    //
    // `startDecorator` becomes an ordinary first child; `labelClassName` lays the
    // image and label out with the same 6px gap Joy's lg Chip used.
    <Chip
      size="lg"
      className="w-full border-2 border-[var(--color-success)] text-[var(--color-success-strong)]"
      style={{ padding: "8px 12px", height: "40px" }}
      labelClassName="flex items-center gap-[6px] overflow-visible"
    >
      <Image
        src="/images/discount-badge.webp"
        alt="Arrow Down"
        width={20}
        height={20}
      />
      <p className="body-medium !font-semibold"> {badgeText} </p>
    </Chip>
  );
}
