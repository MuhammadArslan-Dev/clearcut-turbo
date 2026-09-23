"use client";

import { memo } from "react";
import { Maximize } from "lucide-react";

/** Square outlined "toggle fullscreen" button (desktop only). */
function FullscreenButton({
  onClick,
  label = "Toggle fullscreen",
  compact = false,
}: {
  onClick: () => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`hidden ${compact ? "h-9 w-9" : "h-10 w-10"} cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-surface-gray-normal hover:bg-gray-50 lg:flex`}
    >
      <Maximize size={16} />
    </button>
  );
}

export default memo(FullscreenButton);
