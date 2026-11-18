// Phase 119: A/B test "Skip vs no Skip" on the first-enrolment Practice Test. The assignment comes from GrowthBook
// (flag below, String: "skip" = control = today's behaviour, "no_skip" = the variant); this file is the pure part so it
// can be unit tested without React. The hook that reads the flag is ./usePracticeSkip.

export const PRACTICE_SKIP_FLAG = "dash_all_practice_skip_202611";
/** Control: exactly what learners get today (prompt with Skip, skip controls inside the test). */
export const PRACTICE_SKIP_CONTROL = "skip";
export const PRACTICE_NO_SKIP = "no_skip";

/**
 * Only the explicit "no_skip" removes the Skip controls. Anything else (flag off or missing, GrowthBook unreachable, an
 * unknown or empty value, a wrong type) keeps Skip: every failure path leaves the learner with today's prompt.
 */
export function allowSkipFromValue(value: unknown): boolean {
  return value !== PRACTICE_NO_SKIP;
}
