import { INDIAN_MOBILE_REGEX } from "@clearcut/validation/common/phone-regex";

export { INDIAN_MOBILE_REGEX };
export const INDIAN_MOBILE_FIRST_DIGIT_REGEX = /^[6-9]$/;

/**
 * Detects likely fake / bogus mobile numbers on a full 10-digit string.
 * Ported verbatim from login-screen.tsx's `isFakeNumber` — the only one of
 * the two flows that had this check (result-step.tsx's inline flow doesn't,
 * and that difference is intentionally preserved rather than unified).
 *
 * Flags the number when EITHER:
 *  - it matches at least 2 of the pattern checks below, OR
 *  - (extreme case) any single digit is repeated 5+ times.
 *
 * Pattern checks:
 *  1. All identical digits            e.g. 9999999999
 *  2. Strictly ascending sequence     e.g. 1234567890 (steps of +1, mod 10)
 *  3. Strictly descending sequence    e.g. 9876543210 (steps of -1, mod 10)
 *  4. Repeating alternating pairs     e.g. 9898989898
 *  5. 4+ zeros after the first digit  e.g. 9000000123
 */
export function isFakeMobileNumber(value: string): boolean {
  if (value.length !== 10) return false;

  const digits = value.split("").map(Number);

  const counts = new Map<number, number>();
  for (const d of digits) counts.set(d, (counts.get(d) ?? 0) + 1);
  const repeatedFiveTimes = [...counts.values()].some((c) => c >= 5);
  if (repeatedFiveTimes) return true;

  const allIdentical = counts.size === 1;

  let ascending = true;
  for (let i = 1; i < digits.length; i++) {
    if ((digits[i - 1] + 1) % 10 !== digits[i]) {
      ascending = false;
      break;
    }
  }

  let descending = true;
  for (let i = 1; i < digits.length; i++) {
    if ((digits[i - 1] + 9) % 10 !== digits[i]) {
      descending = false;
      break;
    }
  }

  let alternatingPairs = digits[0] !== digits[1];
  if (alternatingPairs) {
    for (let i = 2; i < digits.length; i++) {
      if (digits[i] !== digits[i - 2]) {
        alternatingPairs = false;
        break;
      }
    }
  }

  const zerosAfterFirst = digits.slice(1).filter((d) => d === 0).length >= 4;

  const matchedPatterns = [
    allIdentical,
    ascending,
    descending,
    alternatingPairs,
    zerosAfterFirst,
  ].filter(Boolean).length;

  return matchedPatterns >= 2;
}
