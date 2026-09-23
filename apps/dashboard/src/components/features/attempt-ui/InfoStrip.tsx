"use client";

import { memo } from "react";
import Text from "@clearcut/ui/text";
import { WarningCircleIcon } from "@/components/ui/icons";

/** Soft-blue hint line under the options ("Select the best answer…"). */
function InfoStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[var(--color-primary-bg-soft)] px-3 py-3">
      <WarningCircleIcon variant="help" size={16} color="var(--color-brand)" />
      <Text as="p" variant="body-small" color="primary-normal">
        {children}
      </Text>
    </div>
  );
}

export default memo(InfoStrip);
