/**
 * Fires the Meta "Lead" event on successful OTP verification, but only for
 * users who were new at the moment the OTP was sent — repeat logins by
 * existing users must not inflate Lead counts.
 *
 * `phone`/`userId`, when available, are set via `fbq('set', 'userData', …)`
 * rather than passed inside the `track('Lead', …)` call. Meta only
 * auto-hashes recognized PII fields (`ph`, `em`, …) when they go through
 * `init`/`set userData` — the same fields inside a plain `track()` call's
 * custom-data object are sent as-is, which is exactly what got this event
 * flagged for "sharing unhashed personally identifiable customer data".
 */
export function trackFacebookLead(
  isNewUser: boolean,
  phone?: string,
  userId?: string,
) {
  if (!isNewUser || typeof window === "undefined" || !window.fbq) return;

  const userData: { ph?: string; external_id?: string } = {};

  const digits = phone?.replace(/\D/g, "");
  if (digits) {
    // Meta expects the country code with no leading "+" and no spaces.
    userData.ph = digits.length === 10 ? `91${digits}` : digits;
  }

  if (userId) userData.external_id = userId;

  if (Object.keys(userData).length > 0) {
    window.fbq("set", "userData", userData);
  }

  window.fbq("track", "Lead");
}
