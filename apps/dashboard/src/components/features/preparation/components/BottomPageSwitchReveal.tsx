"use client";

import { useLayoutEffect, useRef, useState } from "react";
import PageSwitchTab from "./PageSwitchTab";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * Mirrors Topbar's Course/Test Series switch at the bottom of the mobile
 * screen, growing in exact sync with how much the top one has hidden (see
 * useTopbarVisibilityStore's `progress`) instead of a fixed-duration
 * animation — so it never drifts out of sync with the Topbar it mirrors,
 * the same way the top one shrinks 1:1 with the scroll gesture.
 */
export default function BottomPageSwitchReveal() {
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
        {/* Distinct layoutScopeId — see PageSwitchTab's prop doc. This one
            is mounted at the same time as Topbar's own copy during the
            scroll-hide transition, and they must not share a Framer Motion
            layoutId. */}
        <PageSwitchTab layoutScopeId="page-change-tab-bottom" />
      </div>
    </div>
  );
}
