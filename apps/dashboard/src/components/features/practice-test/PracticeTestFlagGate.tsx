"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { usePracticeTestEnabled } from "@/lib/experiments/usePracticeTestEnabled";
import PracticeTestPage from "./PracticeTestPage";
import { PracticeTestSkeleton } from "./PracticeTestSkeletons";
import { clearPracticeSession } from "./practiceTestSession";

/**
 * Amplitude flag `practice_test` (phase 72) in front of the test route. ON: the
 * test as before. OFF / not confirmed (also: a test that was in progress when
 * the flag was switched off): back to Preparation, and nothing is requested from
 * /v2/first-practice-test. While the flag is being read the test's own skeleton shows.
 */
export default function PracticeTestFlagGate() {
  const enabled = usePracticeTestEnabled();
  const router = useRouter();
  const { courseId } = useParams<{ courseId: string }>();

  useEffect(() => {
    if (enabled !== false) return;
    clearPracticeSession(courseId);
    router.replace(`/preparation/${courseId}`);
  }, [enabled, courseId, router]);

  if (enabled !== true) return <PracticeTestSkeleton />;
  return <PracticeTestPage />;
}
