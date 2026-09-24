"use client";

import { memo } from "react";
import { Button } from "@clearcut/ui/button";
import { ChevronIcon, TrashIcon } from "@/components/ui/icons";

type AttemptActionBarProps = {
  onPrevious: () => void;
  previousDisabled?: boolean;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  onClear: () => void;
  clearDisabled?: boolean;
  previousLabel?: string;
  primaryLabel?: string;
  clearLabel?: string;
  /**
   * The original button look (soft grey pills, double chevron on Previous,
   * no arrow on the primary) — used by the full exam page. Default is the
   * outlined look of the new design.
   */
  legacy?: boolean;
  /** Below `lg`: one slim row [«] [Save and Next] [🗑] with icon-only side buttons. */
  compactMobile?: boolean;
};

/**
 * Previous | Save and Next | Clear Response. Below `lg` the primary action
 * takes its own full-width row with Previous + Clear side by side underneath;
 * from `lg` it is the single row of the design.
 */
function AttemptActionBar({
  onPrevious,
  previousDisabled,
  onPrimary,
  primaryDisabled,
  onClear,
  clearDisabled,
  previousLabel = "Previous",
  primaryLabel = "Save and Next",
  clearLabel = "Clear Response",
  legacy = false,
  compactMobile = false,
}: AttemptActionBarProps) {
  const muted = "var(--color-surface-gray-muted)";
  const normal = "var(--color-surface-gray-normal)";
  const layout = (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="w-full lg:order-2 lg:w-auto lg:max-w-[460px] lg:flex-1">
        <Button
          size="lg"
          sx={{ borderRadius: "50px" }}
          disabled={primaryDisabled}
          onClick={onPrimary}
          rightIcon={legacy ? undefined : <ChevronIcon size={16} variant="right" color="white" />}
          fullWidth
        >
          {primaryLabel}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 lg:contents">
        <Button
          sx={{ borderRadius: "50px", paddingX: legacy ? "30px" : "24px" }}
          size="lg"
          variant={legacy ? "soft" : "outlined"}
          color="gray"
          className="lg:order-1"
          disabled={previousDisabled}
          onClick={onPrevious}
        >
          <div className="flex items-center gap-2">
            {legacy ? (
              <ChevronIcon size={20} type="double" variant="left" color={previousDisabled ? muted : normal} />
            ) : (
              <ChevronIcon size={20} variant="left" />
            )}
            <span>{previousLabel}</span>
          </div>
        </Button>

        <Button
          sx={{ borderRadius: "50px", paddingX: legacy ? "30px" : "24px" }}
          size="lg"
          variant={legacy ? "soft" : "outlined"}
          color="gray"
          className="lg:order-3"
          disabled={clearDisabled}
          onClick={onClear}
        >
          <div className="flex items-center gap-2">
            <TrashIcon size={18} {...(legacy ? { color: clearDisabled ? muted : normal } : {})} />
            <span>{clearLabel}</span>
          </div>
        </Button>
      </div>
    </div>
  );

  if (!compactMobile) return layout;

  return (
    <>
      <div className="flex w-full items-center gap-2 lg:hidden">
        <Button
          sx={{ borderRadius: "50px", paddingX: "14px" }}
          variant={legacy ? "soft" : "outlined"}
          color="gray"
          aria-label={previousLabel}
          disabled={previousDisabled}
          onClick={onPrevious}
        >
          {/* Short label here only — this row is mobile-only; desktop keeps
              the full `previousLabel` prop via `layout` below. */}
          <div className="flex items-center gap-1.5">
            <ChevronIcon size={18} type="double" variant="left" color={previousDisabled ? muted : normal} />
            <span className="whitespace-nowrap">Pre</span>
          </div>
        </Button>
        <div className="min-w-0 flex-1">
          <Button
            sx={{ borderRadius: "50px" }}
            disabled={primaryDisabled}
            onClick={onPrimary}
            rightIcon={legacy ? undefined : <ChevronIcon size={14} variant="right" color="white" />}
            fullWidth
          >
            {primaryLabel}
          </Button>
        </div>
        <Button
          sx={{ borderRadius: "50px", paddingX: "14px" }}
          variant={legacy ? "soft" : "outlined"}
          color="gray"
          aria-label={clearLabel}
          disabled={clearDisabled}
          onClick={onClear}
        >
          <div className="flex items-center gap-1.5">
            <TrashIcon size={18} color={clearDisabled ? muted : normal} />
            <span className="whitespace-nowrap">Clear</span>
          </div>
        </Button>
      </div>
      <div className="hidden lg:block">{layout}</div>
    </>
  );
}

export default memo(AttemptActionBar);
