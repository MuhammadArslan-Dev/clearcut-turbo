"use client";

import { subjectIcon, TONES } from "./trackerIcons";

/** Rounded-square subject icon badge — the glyph is picked by keyword
 * against a small, known subject vocabulary (see trackerIcons.tsx). Every
 * badge uses the same tone (TONES[0]) regardless of the subject's position
 * in its list — a per-subject cycling tone read as inconsistent across the
 * sidebar, per direct feedback (same reasoning as ChapterCard's tone fix). */
export default function SubjectIcon({
  name,
  index = 0,
  size = 32,
  background,
  iconScale = 1,
}: {
  name: string;
  index?: number;
  size?: number;
  /** Override the badge's own background — for placing it on top of an
   * already-tinted container (e.g. TrackerDashboard's current-subject
   * header card), where the default tone bg would blend into it. */
  background?: string;
  /** Scales just the glyph, independent of the badge's own `size` — every
   * glyph in trackerIcons.tsx is a fixed 16x16 SVG, so growing the badge
   * alone doesn't grow the icon inside it; use this when the icon itself
   * (not the badge) needs to look bigger. 1 = glyph's natural size. */
  iconScale?: number;
}) {
  const tone = TONES[0];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: background ?? tone.bg, color: tone.text }}
    >
      <span className="flex items-center justify-center" style={{ transform: `scale(${iconScale})` }}>
        {subjectIcon(name)}
      </span>
    </div>
  );
}
