"use client";

import { subjectIcon, TONES } from "./trackerIcons";

/** Rounded-square subject icon badge — the glyph is picked by keyword
 * against a small, known subject vocabulary (see trackerIcons.tsx), and the
 * background tone cycles by the subject's position in its list (decorative,
 * like the exam-picker avatars — not meant to encode meaning on its own). */
export default function SubjectIcon({ name, index = 0, size = 32 }: { name: string; index?: number; size?: number }) {
  const tone = TONES[index % TONES.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: tone.bg, color: tone.text }}
    >
      {subjectIcon(name)}
    </div>
  );
}
