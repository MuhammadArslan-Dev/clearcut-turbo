/**
 * Fires the Meta "Lead" event on successful OTP verification, but only for
 * users who were new at the moment the OTP was sent — repeat logins by
 * existing users must not inflate Lead counts. `phone`/`userId`, when
 * available, are sent as Meta's advanced-matching params (`ph`/`external_id`)
 * so the event can be matched to a user without a first-party cookie.
 */
export function trackFacebookLead(
  isNewUser: boolean,
  phone?: string,
  userId?: string,
) {
  if (!isNewUser || typeof window === "undefined" || !window.fbq) return;

  const params: { ph?: string; external_id?: string } = {};

  const digits = phone?.replace(/\D/g, "");
  if (digits) {
    // Meta expects the country code with no leading "+" and no spaces.
    params.ph = digits.length === 10 ? `91${digits}` : digits;
  }

  if (userId) params.external_id = userId;

  window.fbq("track", "Lead", params);
}
