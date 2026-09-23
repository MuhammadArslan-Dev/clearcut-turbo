"use client";

import { memo } from "react";
import { Target } from "lucide-react";
import Text from "@clearcut/ui/text";
import MountainFlagIllustration from "@/components/ui/illustrations/MountainFlagIllustration";

type TipCardProps = {
  title: React.ReactNode;
  body: React.ReactNode;
  /** Defaults to the target icon ("Stay Focused!"). */
  icon?: React.ReactNode;
};

/** The soft-blue "Stay Focused!" card with the mountain-flag art. */
function TipCard({ title, body, icon }: TipCardProps) {
  return (
    <div className="relative hidden flex-1 items-center gap-3 overflow-hidden rounded-lg bg-[var(--color-primary-bg-soft)] p-3 lg:flex lg:max-w-[380px]">
      <MountainFlagIllustration className="pointer-events-none absolute inset-y-0 right-0 h-full w-[150px] opacity-70" />
      <span className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/70 text-brand">
        {icon ?? <Target size={24} />}
      </span>
      <div className="z-10 flex-1">
        <Text as="p" variant="body-medium" weight="semibold" color="primary-normal">
          {title}
        </Text>
        <Text as="p" variant="body-small" color="gray-muted">
          {body}
        </Text>
      </div>
    </div>
  );
}

export default memo(TipCard);
