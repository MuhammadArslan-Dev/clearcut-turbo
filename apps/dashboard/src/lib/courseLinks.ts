/**
 * The one place that builds course-page URLs from ids (phase 124):
 *   Preparation → `/preparation/{courseId}?section=&chapter=&topic=`
 *   Test list   → `/test-series/{courseId}?testType=&paper=&section=&startTest=`
 * Only the ids that are set go into the query, in that order. The Preparation page
 * applies `section`, then that section's `chapter` / `topic` (Sidebar.tsx, phase 109).
 *
 * The backend builds the SAME URLs for push deep links
 * (`App\Services\Notifications\CourseDeepLinks`). Both sides are pinned by
 * `course-deep-links.json` (a copy lives in the backend's tests/Fixtures);
 * courseLinks.test.ts fails when they drift. Change both together.
 *
 * Paths are unprefixed: `Link` / `useRouter` from `@/i18n/navigation` add `/hi` / `/mr`.
 */

type Id = string | number | null | undefined;

const isSet = (v: Id): v is string | number => v !== null && v !== undefined && v !== "" && v !== "null" && v !== "undefined";

function withQuery(base: string, params: [string, Id][]): string {
  const q = new URLSearchParams();
  for (const [key, value] of params) if (isSet(value)) q.set(key, String(value));
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

export function preparationHref(
  courseId: string | number,
  ids: { section?: Id; chapter?: Id; topic?: Id } = {},
): string {
  return withQuery(`/preparation/${encodeURIComponent(String(courseId))}`, [
    ["section", ids.section],
    ["chapter", ids.chapter],
    ["topic", ids.topic],
  ]);
}

export type TestListType = "sectional-tests" | "full-length-papers" | "chapter-tests";

export function testListHref(
  courseId: string | number,
  ids: { testType?: TestListType | null; paper?: Id; section?: Id; startTest?: Id } = {},
): string {
  return withQuery(`/test-series/${encodeURIComponent(String(courseId))}`, [
    ["testType", ids.testType],
    ["paper", ids.paper],
    ["section", ids.section],
    ["startTest", ids.startTest],
  ]);
}
