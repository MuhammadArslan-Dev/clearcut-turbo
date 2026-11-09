"use client";

import { useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { EnrollSuccess } from "@clearcut/motion/enrollment";
import { usePathname } from "@/i18n/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useMotionLang } from "@/components/features/test-motion/TestStartIntro";
import { useEnrollCelebrationStore } from "@/store/course/useEnrollCelebrationStore";

// Once enrolled, never keep the learner behind the animation if the next page is slow or its data failed.
const MAX_WAIT_MS = 15000;
// The next page must stay idle this long (no query running) before the animation ends, so we don't reveal a half-loaded page.
const IDLE_MS = 700;
// The desktop frame grows from the modal's size to this height (capped to the viewport) so the whole animation fits without scrolling.
const FRAME_HEIGHT = 760;
const FRAME_FADE_MS = 500;
// Practice-test path: a sheet is already open under this frame, so it clears quickly instead of crossfading with it.
const FRAME_FADE_QUICK_MS = 220;

/**
 * Enrollment animation after "Start Learning".
 * - Phone: full screen (the enrolment sheet is full height anyway); the curtain lifts onto the next page.
 * - Desktop: INSIDE a frame that starts at the enrolment modal's exact size and position (the modal's own backdrop is
 *   still showing, and takes over visually when the modal unmounts on navigation), grows smoothly to fit the animation, and
 *   fades away over the next page at the end. No curtain, no second backdrop, no jump.
 * `ready` = enrolled, on the target page, and its queries have settled.
 */
export default function EnrollCelebration() {
  const celebration = useEnrollCelebrationStore((s) => s.celebration);
  const enrolled = useEnrollCelebrationStore((s) => s.enrolled);
  const awaitPath = useEnrollCelebrationStore((s) => s.awaitPath);
  const finish = useEnrollCelebrationStore((s) => s.finish);
  const lang = useMotionLang();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const fetching = useIsFetching();
  const [idle, setIdle] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [grown, setGrown] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const onTarget = !awaitPath || pathname.startsWith(awaitPath);
  // When we navigate, the modal closes at the same moment (it fades its own backdrop out over ~0.2 s), so this frame fades its
  // own identical backdrop in over the same 0.2 s: the dimming never drops or doubles. (Practice-test path: no close, no backdrop.)
  const modalGone = enrolled && !!awaitPath;

  useEffect(() => {
    if (!enrolled) return;
    const t = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [enrolled]);

  useEffect(() => {
    if (!enrolled || !onTarget || fetching > 0) {
      setIdle(false);
      return;
    }
    const t = setTimeout(() => setIdle(true), IDLE_MS);
    return () => clearTimeout(t);
  }, [enrolled, onTarget, fetching]);

  // start growing on the next frame, so the frame first paints at the modal's size
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!celebration) return null;

  const common = {
    lang,
    exam: celebration.exam,
    selection: celebration.selection,
    ready: enrolled && (idle || timedOut),
  };

  if (isMobile) {
    return <EnrollSuccess {...common} onDone={finish} />;
  }

  const base = celebration.panel ?? { width: 720, height: 520 };
  const maxH = typeof window === "undefined" ? FRAME_HEIGHT : Math.floor(window.innerHeight * 0.94);
  const height = grown ? Math.min(FRAME_HEIGHT, maxH) : base.height;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ opacity: leaving ? 0 : 1, transition: leaving ? `opacity ${awaitPath ? FRAME_FADE_MS : FRAME_FADE_QUICK_MS}ms ease` : "none" }}
    >
      {/* same black @ 50% as the modal's own backdrop; only while the modal is leaving / gone */}
      <div className="absolute inset-0 bg-black" style={{ opacity: modalGone ? 0.5 : 0, transition: "opacity 200ms cubic-bezier(0.2, 0.4, 0.4, 1)" }} />
      <div
        className="relative max-w-full overflow-hidden rounded-lg bg-white shadow-xl"
        style={{ width: base.width, height, transition: "height 450ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <EnrollSuccess {...common} fit="parent" exit="none" onReveal={() => setLeaving(true)} onDone={finish} />
      </div>
    </div>
  );
}
