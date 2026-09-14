"use client";

import Text from "@clearcut/ui/text";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";

export default function StepEyebrow({ step, total = 3, locale = "en" }: { step: number; total?: number; locale?: Locale }) {
  const t = getSyllabusStrings(locale);
  return (
    <Text as="p" variant="body-small" weight="semibold" className="mb-1 uppercase tracking-wide text-brand">
      {t.stepOf(step, total)}
    </Text>
  );
}
