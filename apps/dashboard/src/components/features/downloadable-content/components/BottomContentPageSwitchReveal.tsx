"use client";

import { useRef } from "react";
import ContentPageSwitch from "./ContentPageSwitch";
import { useScrollRevealWidth } from "@/hooks/useTopbarScrollHide";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * Mirrors Topbar's Notes/PYQs switch at the bottom of the mobile screen,
 * growing in exact sync with how much the top one has hidden (see
 * useTopbarVisibilityStore's `progress`) instead of a fixed-duration
 * animation. Same technique as preparation's BottomPageSwitchReveal.
 */
export default function BottomContentPageSwitchReveal() {
  const isMobile = useIsMobile();

  // Same as preparation's BottomPageSwitchReveal: width/opacity are written
  // directly (useScrollRevealWidth), so scrolling never re-renders this.
  const outerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  useScrollRevealWidth(outerRef, wrapRef, isMobile);

  return (
    <div ref={outerRef} style={{ width: 0, opacity: 0 }} className="overflow-hidden shrink-0">
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
