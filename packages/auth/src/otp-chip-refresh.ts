/**
 * After a wrong or expired OTP: blur the OTP input, then focus it again.
 *
 * The keyboard's OTP suggestion chip (autoComplete="one-time-code") is built
 * by Chrome/Google from the newest code SMS when the input gains focus. Our
 * login screens focus the input before the new SMS has arrived, so the chip
 * can show the previous login's code; tapping it fails verification.
 * Re-focusing after that failure makes the keyboard rebuild the chip from the
 * SMS that has arrived by then. `delayMs` gives the blur time to register.
 */
export function refocusForNewOtpChip(
  getInput: () => HTMLInputElement | null | undefined,
  delayMs = 300,
): void {
  if (typeof window === "undefined") return;
  getInput()?.blur();
  window.setTimeout(() => getInput()?.focus(), delayMs);
}
