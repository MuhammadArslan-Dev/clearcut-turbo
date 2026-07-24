// utils/highlightTextUtil.ts

/**
 * Splits a heading and wraps the highlighted words with a className.
 *
 * @param heading - The full heading text
 * @param highlightText - Word(s) to highlight (string | string[])
 * @param highlightClass - CSS/Tailwind class to apply on highlighted text
 * @returns An array of React nodes with highlighted spans
 */
import React from "react";

export function highlightTextUtil(
  heading: string,
  highlightText?: string | string[],
  highlightClass: string = "text-[#0083ff]"
): React.ReactNode[] {
  if (!highlightText) return [heading];

  const highlights = Array.isArray(highlightText)
    ? highlightText
    : [highlightText];

  const regex = new RegExp(`(${highlights.join("|")})`, "gi");
  const parts = heading.split(regex);

  return parts.map((part, index) =>
    highlights.includes(part) ? (
      <span key={index} className={highlightClass}>
        {part}
      </span>
    ) : (
      part
    )
  );
}
