/**
 * A daily test is addressed by an opaque uuid in the URL
 * (`/daily-test-attempt/{courseId}/{testId}`). A link built before that id is
 * known (or for a day that has no test) used to stringify `null` /
 * `undefined` into the path and the start call then failed with a 404
 * (CC-190, Sentry CLEARCUTOFF-NEXTJS-APP-BB).
 *
 * One place decides what counts as "no id", so every list, link and page
 * agrees: empty, whitespace, or the strings a stringified null/undefined/NaN
 * leave behind.
 */
const NO_ID_STRINGS = new Set(["null", "undefined", "nan", "false"]);

export function isUsableDailyTestId(id: unknown): id is string {
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  return trimmed !== "" && !NO_ID_STRINGS.has(trimmed.toLowerCase());
}
