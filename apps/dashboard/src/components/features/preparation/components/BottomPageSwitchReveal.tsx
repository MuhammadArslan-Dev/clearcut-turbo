"use client";

import { useRef } from "react";
import PageSwitchTab from "./PageSwitchTab";
import { useScrollRevealWidth } from "@/hooks/useTopbarScrollHide";
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

  // Always rendered (just visually clipped) so its natural width can be
  // measured; width/opacity are written directly (useScrollRevealWidth), so
  // scrolling never re-renders this or its tabs. Starts fully clipped.
  const outerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  useScrollRevealWidth(outerRef, wrapRef, isMobile);

  return (
    <div ref={outerRef} style={{ width: 0, opacity: 0 }} className="overflow-hidden shrink-0">
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
