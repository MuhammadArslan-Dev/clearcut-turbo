"use client";

import { memo } from "react";
import { Quote } from "lucide-react";
import Text from "@clearcut/ui/text";
import { MainAppLogo } from "@/components/ui/icons";

type AttemptTopbarProps = {
  /** e.g. "Full Length Test – CTET (16 Sep 2026)" */
  title: React.ReactNode;
  /** e.g. "150 Questions • 150 Marks • 2 Hours 30 Minutes" */
  meta?: React.ReactNode;
  /** Motivation line shown in the middle on wide screens. */
  quote?: React.ReactNode;
  /** Right-hand controls (language, End Test, fullscreen, avatar…). */
  actions: React.ReactNode;
  /** Slimmer header (smaller logo, minimal padding) — used by the full exam page. */
  compact?: boolean;
};

/**
 * The header shared by every full-screen attempt page (full-length exam and
 * Daily Test): logo | test title + meta | quote | action controls.
 */
function AttemptTopbar({ title, meta, quote, actions, compact = false }: AttemptTopbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className={`flex items-center justify-between gap-3 px-3 md:px-6 ${compact ? "h-[49px]" : "py-2"}`}>
        <div className="flex min-w-0 items-center gap-4">
          <div className="hidden shrink-0 md:block">
            <MainAppLogo width={130} {...(compact ? { height: 33 } : {})} />
          </div>
          <div className={`hidden w-px bg-gray-200 md:block ${compact ? "h-8" : "h-10"}`} />
          <div className="min-w-0">
            <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="truncate">
              {title}
            </Text>
            {meta && (
              <Text as="p" variant="body-small" color="gray-muted" className="hidden truncate sm:block">
                {meta}
              </Text>
            )}
          </div>
        </div>

        {quote && (
          <div className="hidden flex-1 items-center justify-center gap-2 px-4 xl:flex">
            <Quote size={16} className="shrink-0 text-brand" />
            <Text as="p" variant="body-small" className="italic text-surface-gray-muted">
              {quote}
            </Text>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      </div>
    </header>
  );
}

export default memo(AttemptTopbar);
