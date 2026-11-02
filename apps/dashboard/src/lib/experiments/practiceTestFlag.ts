// Amplitude flag `practice_test` for the first-enrollment Practice Test (phase 72).
// The request and cache live in ./experimentFlag.
//
// The answer is `true` ONLY when the flag says `on`. Everything else - no key,
// no user, network error, timeout, non-200, bad JSON, flag missing or disabled -
// is `false` (go straight to Preparation). Nothing here throws.

import { getFlagVariant, resetExperimentFlagCache, type FlagOptions } from "./experimentFlag";

export { DEFAULT_EXPERIMENT_DEPLOYMENT_KEY, experimentDeploymentKey } from "./experimentFlag";

export const PRACTICE_TEST_FLAG_KEY = "practice_test";
/** How long the enrolment flow waits for the flag before treating it as OFF. */
export const PRACTICE_TEST_FLAG_TIMEOUT_MS = 1500;

/** Test helper: forget every cached answer. */
export const resetPracticeTestFlagCache = resetExperimentFlagCache;

export async function isPracticeTestEnabled(
  userId: string | null | undefined,
  options: FlagOptions = {},
): Promise<boolean> {
  const variant = await getFlagVariant(PRACTICE_TEST_FLAG_KEY, userId, {
    timeoutMs: PRACTICE_TEST_FLAG_TIMEOUT_MS,
    ...options,
  });
  return variant === "on";
}
