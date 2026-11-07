"use client";

import { useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { EnrollSuccess } from "@clearcut/motion/enrollment";
import { usePathname } from "@/i18n/navigation";
import { useMotionLang } from "@/components/features/test-motion/TestStartIntro";
import { useEnrollCelebrationStore } from "@/store/course/useEnrollCelebrationStore";

// Once enrolled, never keep the learner behind the animation if the next page is slow or its data failed.
const MAX_WAIT_MS = 15000;
// The next page must stay idle this long (no query running) before the curtain lifts, so we don't reveal a half-loaded page.
const IDLE_MS = 700;

/**
 * Enrollment animation after "Start Learning": the picks fly into the exam ticket and it is stamped, then the learner's
 * paper + subjects show as the app's selected cards while the Preparation page loads UNDER this layer (the modal already
 * navigated), then the curtain lifts onto it. `ready` = enrolled, on the target page, and its queries have settled.
 */
export default function EnrollCelebration() {
  const celebration = useEnrollCelebrationStore((s) => s.celebration);
  const enrolled = useEnrollCelebrationStore((s) => s.enrolled);
  const awaitPath = useEnrollCelebrationStore((s) => s.awaitPath);
  const finish = useEnrollCelebrationStore((s) => s.finish);
  const lang = useMotionLang();
  const pathname = usePathname();
  const fetching = useIsFetching();
  const [idle, setIdle] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const onTarget = !awaitPath || pathname.startsWith(awaitPath);

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

  if (!celebration) return null;

  return (
    <EnrollSuccess
      lang={lang}
      exam={celebration.exam}
      selection={celebration.selection}
      ready={enrolled && (idle || timedOut)}
      onDone={finish}
    />
  );
}
