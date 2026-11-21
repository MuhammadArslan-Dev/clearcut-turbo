// Phase 122: A/B test "finish setup" dashboard (design: Exam-Add prototype, tab 2, "Proposed") for a learner who has an
// exam but has not chosen a level/paper in ANY enrolment yet. Assignment comes from GrowthBook (String flag below:
// "control" = today's dashboard, "setup_first" = the prototype). Pure file, no React; the hook is ./useSetupFirst.

export const SETUP_FIRST_FLAG = "dash_all_setup_first_202611";
/** Control: exactly what learners get today. */
export const SETUP_FIRST_CONTROL = "control";
export const SETUP_FIRST_VARIANT = "setup_first";

/** Only the explicit "setup_first" turns the new flow on; flag off / missing / unreachable / any other value = today. */
export function isSetupFirst(value: unknown): boolean {
  return value === SETUP_FIRST_VARIANT;
}

/** The minimum of an enrolment this decision needs (`ExamEnrollment` from `@/types/Exam` satisfies it). */
export type SetupCourse = { stage_id?: number | string | null } | null | undefined;

/**
 * The learner may see the new flow only while NONE of their enrolments has a level/paper (`stage_id`). As soon as any
 * enrolment of theirs has one (they finished their first exam's setup), they get today's dashboard for good, also when
 * they later add a second exam without a paper. No enrolment at all (data still loading, or not enrolled) = not eligible.
 */
export function needsFirstSetup(courses: readonly SetupCourse[] | null | undefined): boolean {
  if (!courses || courses.length === 0) return false;
  return courses.every((c) => c != null && (c.stage_id === null || c.stage_id === undefined || c.stage_id === ""));
}
