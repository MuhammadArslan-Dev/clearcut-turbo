// Pure age-eligibility math, kept independent of any exam's data so it's
// easy to unit-reason-about: given a date of birth and a cutoff date,
// compute the exact (years, months) age on that cutoff, then compare
// against a category's min/max age band.

export type AgeBreakdown = { years: number; months: number };

/** Exact years+months between `dob` and `cutoff` (cutoff must be >= dob). */
export function ageOn(dob: Date, cutoff: Date): AgeBreakdown {
  let years = cutoff.getFullYear() - dob.getFullYear();
  let months = cutoff.getMonth() - dob.getMonth();

  if (cutoff.getDate() < dob.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years: Math.max(0, years), months: Math.max(0, months) };
}

/** Total age in months — used for min/max comparisons so partial months count correctly. */
export function ageInMonths(dob: Date, cutoff: Date): number {
  const { years, months } = ageOn(dob, cutoff);
  return years * 12 + months;
}

export type EligibilityResult =
  | { status: "eligible" }
  | { status: "under_age"; shortByMonths: number }
  | { status: "over_age"; overByMonths: number };

export function checkEligibility(ageMonths: number, minAge: number, maxAge: number | null): EligibilityResult {
  const minMonths = minAge * 12;
  if (ageMonths < minMonths) {
    return { status: "under_age", shortByMonths: minMonths - ageMonths };
  }
  if (maxAge !== null) {
    const maxMonths = maxAge * 12;
    if (ageMonths > maxMonths) {
      return { status: "over_age", overByMonths: ageMonths - maxMonths };
    }
  }
  return { status: "eligible" };
}

/** Formats a month count as "Xy Ym" (e.g. 161 -> "13y 5m"), dropping a zero part. */
export function formatYearsMonths(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}m`;
}

/** Parses a "DD/MM/YYYY" string into a Date, or null if invalid. */
export function parseDDMMYYYY(value: string): Date | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);
  // Reject overflowed dates (e.g. 31/02/2024) rather than silently rolling forward.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}
