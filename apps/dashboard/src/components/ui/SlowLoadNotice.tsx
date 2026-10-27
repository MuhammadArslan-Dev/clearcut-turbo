"use client";

import Button from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import { useTranslations } from "next-intl";
import SandTimerIcon from "@/components/ui/icons/sand-timer-icon";

/**
 * "Taking longer than usual" + Try again (CC-152). Shown under a screen's
 * skeleton when its data has not arrived after ~10 s on a slow connection,
 * so a student never stares at a silent page. Presentational only: the
 * caller decides when to show it and what Try again does (refetch, never
 * an automatic retry storm — see CC-146).
 */
export default function SlowLoadNotice({ onRetry, className = "" }: { onRetry: () => void; className?: string }) {
  const t = useTranslations("slowLoad");

  return (
    <Card
      bgcolor="white"
      border="border-gray-200"
      padding="16px"
      borderRadius={12}
      className={`!h-auto !min-h-0 ${className}`}
    >
      <div role="status" aria-live="polite" className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5">
          <SandTimerIcon size={20} color="var(--color-brand)" />
        </span>
        <div className="flex flex-col gap-2 min-w-0">
          <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
            {t("title")}
          </Text>
          <Text as="p" variant="body-small" color="gray-muted">
            {t("body")}
          </Text>
          <div>
            <Button variant="outlined" color="primary" size="lg" onClick={onRetry}>
              {t("retry")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
