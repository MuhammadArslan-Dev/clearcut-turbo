import clsx from "clsx";
import React from "react";

export type Align = "left" | "center" | "right";

/**
 * Splits a heading and wraps the highlighted words with a className.
 * Consolidated during Phase 4 from four separate copies (apps/landing,
 * apps/blog — which had it twice — and packages/auth). The default
 * highlight color uses the shared `--color-brand` design token rather than
 * a hardcoded hex, matching the token-consolidation work done earlier in
 * this migration (packages/auth's copy already used the token; the app-level
 * copies still hardcoded `#0083ff` — the same color, now sourced from one
 * place).
 *
 * @param heading - The full heading text
 * @param highlightText - Word(s) to highlight (string | string[])
 * @param highlightClass - CSS/Tailwind class to apply on highlighted text
 * @returns An array of React nodes with highlighted spans
 */
export function highlightTextUtil(
  heading: string,
  highlightText?: string | string[],
  highlightClass: string = "text-[var(--color-brand)]",
): React.ReactNode[] {
  if (!highlightText) return [heading];

  const highlights = Array.isArray(highlightText) ? highlightText : [highlightText];

  const regex = new RegExp(`(${highlights.join("|")})`, "gi");
  const parts = heading.split(regex);

  return parts.map((part, index) =>
    highlights.includes(part) ? (
      <span key={index} className={highlightClass}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export const getAlignmentClasses = (mobile?: Align, desktop?: Align) => {
  const mobileMap = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const desktopMap = {
    left: "md:text-left",
    center: "md:text-center",
    right: "md:text-right",
  };

  return clsx(mobile && mobileMap[mobile], desktop && desktopMap[desktop]);
};
