"use client";

import Text from "@clearcut/ui/text";

/** Small promo/orientation card shown beside each step's heading — icon,
 * short headline, one-line description. Purely presentational encouragement
 * text (no exam-specific facts), so it's safe to author per step. */
export default function TipCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-primary-subtle)] p-4 sm:max-w-xs">
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
