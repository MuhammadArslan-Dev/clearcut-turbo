import { z } from "zod";

/**
 * Indian mobile number: 10 digits, first digit 6-9. Matches the pattern
 * already used ad-hoc across the auth flow (e.g. `PHONE_REGEX` inlined in
 * result-step.tsx) — consolidated here instead of re-declared per call site.
 * Exported as a raw regex too, for callers doing imperative keystroke-level
 * validation (e.g. @clearcut/auth) rather than a single final zod parse.
 */
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const indianMobileSchema = z
  .string()
  .regex(INDIAN_MOBILE_REGEX, "Enter a valid 10-digit mobile number");

export type IndianMobile = z.infer<typeof indianMobileSchema>;
