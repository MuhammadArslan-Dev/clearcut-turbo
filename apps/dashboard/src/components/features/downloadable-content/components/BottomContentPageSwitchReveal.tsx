"use client";

import { useLayoutEffect, useRef, useState } from "react";
import ContentPageSwitch from "./ContentPageSwitch";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * Mirrors Topbar's Notes/PYQs switch at the bottom of the mobile screen,
 * growing in exact sync with how much the top one has hidden (see
 * useTopbarVisibilityStore's `progress`) instead of a fixed-duration
 * animation. Same technique as preparation's BottomPageSwitchReveal.
 */
export default function BottomContentPageSwitchReveal() {
  const isMobile = useIsMobile();
  const progress = useTopbarVisibilityStore((s) => s.progress);

  // Always rendered (just visually clipped below) so ResizeObserver can
  // measure its natural width — same technique Topbar uses for its height.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => setNaturalWidth(el.scrollWidth);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clippedWidth =
    isMobile && naturalWidth != null ? naturalWidth * progress : 0;

  return (
    <div
      style={{ width: clippedWidth, opacity: isMobile ? progress : 0 }}
      className="overflow-hidden shrink-0"
    >
      <div ref={wrapRef} className="inline-block">
        {/* Distinct layoutScopeId — see ContentPageSwitch's prop doc. This
            one is mounted at the same time as Topbar's own copy during the
            scroll-hide transition, and they must not share a Framer Motion
            layoutId. */}
        <ContentPageSwitch layoutScopeId="content-page-change-bottom" />
      </div>
    </div>
  );
}
