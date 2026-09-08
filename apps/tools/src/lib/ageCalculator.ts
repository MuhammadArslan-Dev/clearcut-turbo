// Pure age-eligibility math, kept independent of any exam's data so it's
// easy to unit-reason-about: given a date of birth and a cutoff date,
// compute the exact (years, months, days) age on that cutoff, then compare
// against a category's min/max age band down to the exact day.

export type AgeBreakdown = { years: number; months: number; days: number };

/** Calendar difference `to - from` as {years, months, days}, e.g. for a leap-day DOB
 * the "days in previous month" borrow below correctly lands on 28/29 as appropriate.
 * Assumes `to >= from` — returns all-zero otherwise rather than negative parts. */
function diffYMD(from: Date, to: Date): AgeBreakdown {
  if (to <= from) return { years: 0, months: 0, days: 0 };

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    // Day 0 of `to`'s month is the last day of the month before it.
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

/** Exact years+months+days between `dob` and `cutoff` (cutoff must be >= dob). */
export function ageOn(dob: Date, cutoff: Date): AgeBreakdown {
  return diffYMD(dob, cutoff);
}

/** `dob` shifted forward by `years` — the calendar date the person turns that age. */
function birthdayAt(dob: Date, years: number): Date {
  return new Date(dob.getFullYear() + years, dob.getMonth(), dob.getDate());
}

export type EligibilityResult =
  | { status: "eligible" }
  | { status: "under_age"; shortBy: AgeBreakdown }
  | { status: "over_age"; overBy: AgeBreakdown };

/**
 * Day-precise eligibility: eligible once the candidate has turned `minAge`
 * on or before `cutoff`, and (if `maxAge` is set) only up to and including
 * the exact day they turn `maxAge`.
 */
export function checkEligibility(dob: Date, cutoff: Date, minAge: number, maxAge: number | null): EligibilityResult {
  const minBoundary = birthdayAt(dob, minAge);
  if (cutoff < minBoundary) {
    return { status: "under_age", shortBy: diffYMD(cutoff, minBoundary) };
  }

  if (maxAge !== null) {
    const maxBoundary = birthdayAt(dob, maxAge);
    if (cutoff > maxBoundary) {
      return { status: "over_age", overBy: diffYMD(maxBoundary, cutoff) };
    }
  }

  return { status: "eligible" };
}

/** Full-word age string, e.g. "13 Years, 5 Months, 12 Days" — drops any zero part. */
export function formatAgeBreakdown(
  breakdown: AgeBreakdown,
  labels: { year: (n: number) => string; month: (n: number) => string; day: (n: number) => string },
): string {
  const parts: string[] = [];
  if (breakdown.years > 0) parts.push(`${breakdown.years} ${labels.year(breakdown.years)}`);
  if (breakdown.months > 0) parts.push(`${breakdown.months} ${labels.month(breakdown.months)}`);
  if (breakdown.days > 0 || parts.length === 0) parts.push(`${breakdown.days} ${labels.day(breakdown.days)}`);
  return parts.join(", ");
}
