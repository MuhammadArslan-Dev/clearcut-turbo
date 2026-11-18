"use client";

// Phase 119: which variant of the Practice Test the learner is in. Read it only where the learner actually sees the prompt or
// the test: reading it is what sends the Amplitude `$exposure` (see PracticeTestPromptSheet, which reads it only while open).
import { useExperimentValue } from "@/lib/experiments";
import { PRACTICE_SKIP_CONTROL, PRACTICE_SKIP_FLAG, allowSkipFromValue } from "./practiceSkipValue";

/**
 * `allowSkip` is true for the control and for every failure path. `ready` is false until GrowthBook has answered (milliseconds
 * with the server payload, at most 500 ms otherwise); callers keep the layout of the skip controls but hide them until then,
 * so a learner in `no_skip` never sees a Skip button flash by.
 */
export function usePracticeSkip(): { allowSkip: boolean; ready: boolean } {
  const { value, ready } = useExperimentValue<string>(PRACTICE_SKIP_FLAG, PRACTICE_SKIP_CONTROL);
  return { allowSkip: allowSkipFromValue(value), ready };
}
