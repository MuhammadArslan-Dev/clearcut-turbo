"use client";

import Text from "@clearcut/ui/text";

/** Small promo/orientation card shown beside each step's heading — icon,
 * short headline, one-line description. Purely presentational encouragement
 * text (no exam-specific facts), so it's safe to author per step. */
export default function TipCard({
  icon,
  title,
  description,
  tone = "subtle",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** "subtle" (default) matches every wizard step's tip card. "soft" is a
   * touch darker/more saturated — used where a paler background read as too
   * washed out next to the rest of that screen (e.g. the tracked-exams
   * list). */
  tone?: "subtle" | "soft";
}) {
  const bg = tone === "soft" ? "var(--color-primary-soft)" : "var(--color-primary-subtle)";
  return (
    <div className="flex items-start gap-3 rounded-2xl p-4 sm:max-w-xs" style={{ background: bg }}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand">{icon}</span>
      <div>
        <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
          {title}
        </Text>
        <Text as="p" variant="body-small" color="gray-muted" className="mt-0.5">
          {description}
        </Text>
      </div>
    </div>
  );
}
