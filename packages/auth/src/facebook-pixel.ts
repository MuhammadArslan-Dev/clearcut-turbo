/**
 * Fires the Meta "Lead" event on successful OTP verification, but only for
 * users who were new at the moment the OTP was sent — repeat logins by
 * existing users must not inflate Lead counts.
 */
export function trackFacebookLead(isNewUser: boolean) {
  if (!isNewUser || typeof window === "undefined" || !window.fbq) return;

  window.fbq("track", "Lead");
}
