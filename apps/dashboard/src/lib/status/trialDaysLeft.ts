// Days left in the free trial, for the "N days left in FREE trial" badge
// (CC-67; it used to say "3 days" on every day of the trial).
//
// Mirrors the backend's ExpireTrials command: a trial enrollment turns into
// `trial_end` once its creation DATE is TRIAL_DAYS days back (whereDate
// created_at <= today - 3). So: day of signup = 3, next day = 2, the day
// after = 1 (the last day). Clamped to 1..TRIAL_DAYS, and TRIAL_DAYS when the
// date is missing or unparsable — never 0 or negative while still `trial`.
export const TRIAL_DAYS = 3;

export function trialDaysLeft(startedAt?: string | number | null, now: Date = new Date()): number {
  if (startedAt === null || startedAt === undefined || startedAt === "") return TRIAL_DAYS;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return TRIAL_DAYS;
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSince = Math.round((today - startDay) / 86_400_000);
  return Math.min(TRIAL_DAYS, Math.max(1, TRIAL_DAYS - daysSince));
}
