// Date-of-birth picker rules for the age calculator (moved out of
// AgeEligibilityCalculator.tsx so they can be unit-tested).

/** The latest birth date that still makes someone exactly 18 today — the
 * calendar guard rail: no day/month/year combination past this is selectable. */
export function maxDob(): Date {
  const today = new Date();
  return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
}

export const MIN_DOB_YEAR = new Date().getFullYear() - 100;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Highest selectable day for a given year/month, respecting both the
 * month's real length and the 18-years-old ceiling. */
export function maxSelectableDay(year: number, monthIndex: number): number {
  const cap = maxDob();
  const monthMax = daysInMonth(year, monthIndex);
  if (year === cap.getFullYear() && monthIndex === cap.getMonth()) {
    return Math.min(monthMax, cap.getDate());
  }
  return monthMax;
}

/** Highest selectable month (0-indexed) for a given year, respecting the ceiling. */
export function maxSelectableMonth(year: number): number {
  const cap = maxDob();
  return year === cap.getFullYear() ? cap.getMonth() : 11;
}

type Part = number | "";

/**
 * Pulls a picked month/day back inside what the year (and then the month)
 * allows: month first, then the day against the clamped month. Empty parts
 * stay empty; with no year nothing is clamped.
 */
export function clampDob(year: Part, month: Part, day: Part): { month: Part; day: Part } {
  if (year === "") return { month, day };
  const monthLimit = maxSelectableMonth(year);
  const clampedMonth = month !== "" && month > monthLimit ? monthLimit : month;
  if (clampedMonth === "") return { month: clampedMonth, day };
  const dayLimit = maxSelectableDay(year, clampedMonth);
  const clampedDay = day !== "" && day > dayLimit ? dayLimit : day;
  return { month: clampedMonth, day: clampedDay };
}
