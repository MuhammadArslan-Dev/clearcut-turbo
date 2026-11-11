"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@clearcut/motion/core";

type ProgressBarProps = {
  completed: number;
  total: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  /**
   * Optional tick on the same scale as `total` (e.g. the pass mark on the
   * My Courses Cutoff Meter bar). Omitted → the bar renders exactly as before.
   */
  marker?: number;
  markerColor?: string;
  /** Accessible label for the bar (only used with `marker`). */
  ariaLabel?: string;
  /**
   * Entrance animation (only with `marker`): the fill grows 0 → value with
   * the Cutoff Meter design's spring (cubic-bezier(.34,1.56,.64,1), 1150 ms,
   * after `animateDelayMs`). Reduced motion → final width at once.
   */
  animate?: boolean;
  animateMs?: number;
  animateDelayMs?: number;
};

export default function ProgressBar({
  completed,
  total,
  height = 4,
  color = "#1677ff",
  backgroundColor = "#e5e7eb",
  showLabel = true,
  marker,
  markerColor = "var(--color-surface-gray-normal, currentColor)",
  ariaLabel,
  animate = false,
  animateMs = 1150,
  animateDelayMs = 250,
}: ProgressBarProps) {
  const percentage =
    total > 0 ? Math.min((completed / total) * 100, 100) : 0;

  // Hooks run for every variant (rules of hooks); they only matter when
  // `marker` + `animate` are set — the legacy render below never reads them.
  const reduced = usePrefersReducedMotion();
  const [grown, setGrown] = useState(!animate);
  useEffect(() => {
    if (!animate || reduced) {
      setGrown(true);
      return;
    }
    const t = setTimeout(() => setGrown(true), animateDelayMs);
    return () => clearTimeout(t);
  }, [animate, reduced, animateDelayMs]);

  if (marker !== undefined) {
    const markerPct = total > 0 ? Math.min(Math.max((marker / total) * 100, 0), 100) : 0;
    return (
      <div
        className="w-full relative"
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.round(completed)}
      >
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height, backgroundColor }}
        >
          <div
            className={animate ? "h-full rounded-full" : "h-full rounded-full transition-all duration-300"}
            style={{
              width: `${grown ? percentage : 0}%`,
              backgroundColor: color,
              ...(animate && {
                transition: reduced
                  ? "none"
                  : `width ${animateMs}ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 400ms ease-out`,
              }),
            }}
          />
        </div>
        {/* Tick sits outside the clipped track so it can extend above/below it. */}
        <span
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            left: `calc(${markerPct}% - 1px)`,
            top: -(height * 0.6),
            bottom: -(height * 0.6),
            width: 2,
            backgroundColor: markerColor,
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1 flex justify-end text-xs text-gray-500">
          {completed}/{total}
        </div>
      )}

      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
