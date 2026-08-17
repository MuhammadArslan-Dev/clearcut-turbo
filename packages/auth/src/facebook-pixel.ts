// Same pixel ID hardcoded in every app's own FacebookPixel.tsx
// (apps/blog, apps/landing, apps/dashboard all currently share one pixel).
const FB_PIXEL_ID = "1126041265682766";

/**
 * Fires the Meta "Lead" event on successful OTP verification, but only for
 * users who were new at the moment the OTP was sent — repeat logins by
 * existing users must not inflate Lead counts.
 *
 * `phone`/`userId`, when available, are re-sent via `fbq('init', PIXEL_ID, …)`
 * — never inside the `track('Lead', …)` call's custom-data object. Meta only
 * auto-hashes recognized PII fields (`ph`, `em`, …) when they're passed to
 * `init`; the same fields inside a plain `track()` call are sent as-is,
 * which is exactly what got this event flagged for "sharing unhashed
 * personally identifiable customer data". Re-calling `init` (the base pixel
 * script already called it once, without user data, on page load) updates
 * the advanced-matching data without re-firing PageView — that's a separate,
 * explicit `track('PageView')` call in each app's FacebookPixel.tsx.
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
    window.fbq("init", FB_PIXEL_ID, userData);
  }

  window.fbq("track", "Lead");
}
