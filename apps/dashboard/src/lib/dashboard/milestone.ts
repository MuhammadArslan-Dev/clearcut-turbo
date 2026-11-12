/**
 * Next Milestone (Learn page) — one rule, computed from the course's real chapter
 * progress (`chapters_completed` / `chapters_total` of /v2/interactions/progress-summary,
 * the same numbers the course card shows). Nothing is stored or invented.
 *
 * Milestones are 25 / 50 / 75 / 100 % of the course's chapters. The next one is the
 * first whose chapter count is still above what the student has completed.
 */
export const MILESTONE_STEPS = [25, 50, 75, 100] as const;

export type NextMilestoneState =
  | { kind: "empty" } // the course has no chapters (nothing to measure)
  | { kind: "complete" } // every chapter done
  | { kind: "next"; percent: number; chaptersAway: number };

export function nextMilestone(completed: number, total: number): NextMilestoneState {
  const t = Math.max(0, Math.floor(total));
  if (t === 0) return { kind: "empty" };
  const done = Math.min(Math.max(0, Math.floor(completed)), t);
  if (done >= t) return { kind: "complete" };
  for (const percent of MILESTONE_STEPS) {
    const target = Math.ceil((t * percent) / 100);
    if (target > done) return { kind: "next", percent, chaptersAway: target - done };
  }
  return { kind: "next", percent: 100, chaptersAway: t - done };
}
