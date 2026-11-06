export type TestType = "topic" | "daily" | "full";
export type Lang = "en" | "hi";
export type Outcome = "pass" | "near" | "below";

export type Section = { name: string; score: number; max: number };

export type ResultData = {
  score: number;
  maxScore: number;
  /** Cutoff in marks (same scale as score). Omit for tests without a cutoff. */
  cutoff?: number;
  correct: number;
  wrong: number;
  skipped: number;
  /** Omit when the host does not track time — the "Time" line is then hidden. */
  timeTakenSec?: number;
  /** full mock: per-section marks */
  sections?: Section[];
  /** full mock: optional rank among attempts */
  rank?: { rank: number; of: number };
  /** daily: streak after this test, and last 7 days (oldest → today) */
  streak?: { days: number; week: boolean[] };
  /** topic: chapter mastery level 0–3 before and after this attempt */
  mastery?: { topic: string; from: number; to: number };
};

/** Within this share of max marks below cutoff counts as "near" (min 1 mark, so 10-mark tests work). */
export const NEAR_BAND = 0.08;

export function getOutcome(r: ResultData): Outcome {
  const cutoff = r.cutoff ?? r.maxScore * 0.6;
  if (r.score >= cutoff) return "pass";
  const band = Math.max(1, Math.ceil(r.maxScore * NEAR_BAND));
  if (cutoff - r.score <= band) return "near";
  return "below";
}
