import { getCachedUser } from "@/lib/auth-token-client";
import type { UserPreview } from "@/types/User";
import { getMetaGeoData, type MetaGeoData } from "@clearcut/utils/meta-geo";

// Same pixel ID every app's own FacebookPixel.tsx hardcodes.
const FB_PIXEL_ID = "1126041265682766";

export function trackFacebookEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;

  window.fbq("track", eventName, params);
}

type MetaUserData = { ph?: string; external_id?: string } & Partial<MetaGeoData>;

// Same phone/external_id shape as packages/auth/src/facebook-pixel.ts and
// components/thirdparties/FacebookPixel.tsx's getCachedUserData — reads the
// auth cache directly (not useAuth()) so this also works from non-component
// call sites like useRazorpayPayment.ts, which isn't rendered inside
// AuthProvider's tree.
function getCachedMetaUserIdentifiers(): { ph?: string; external_id?: string } {
  const cachedUser = getCachedUser<UserPreview>();
  const digits = cachedUser?.phone?.replace(/\D/g, "");

  const userData: { ph?: string; external_id?: string } = {};
  if (digits) {
    // Meta expects the country code with no leading "+" and no spaces.
    userData.ph = digits.length === 10 ? `91${digits}` : digits;
  }
  if (cachedUser?.id) userData.external_id = String(cachedUser.id);

  return userData;
}

// Same race AuthProvider's own comment documents and
// components/thirdparties/FacebookPixel.tsx's waitForCachedUserData already
// works around: StartTrial (onboarding's full-exam-selection*.tsx /
// single-level-selection.tsx) and the payment-page events below can all fire
// on a user's FIRST-EVER dashboard load, right after the OTP-verify redirect
// — exactly when AuthProvider's /v1/auth-user round trip (measured
// 2.6-4.2s) hasn't written the auth cache yet, so the synchronous read above
// returns nothing and the event ships with no phone/external_id. For an
// already-cached (returning) user this resolves on the very first check, so
// no delay is added to Purchase/Subscribe/AddPaymentInfo etc. on a normal
// session — same bounded budget (4s poll, 250ms interval) as the existing
// landing fix, applied here since this helper had never been polled before.
async function waitForCachedMetaUserIdentifiers(
  maxWaitMs = 4000,
  intervalMs = 250,
): Promise<{ ph?: string; external_id?: string }> {
  const deadline = Date.now() + maxWaitMs;
  let identifiers = getCachedMetaUserIdentifiers();
  while (Object.keys(identifiers).length === 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    identifiers = getCachedMetaUserIdentifiers();
  }
  return identifiers;
}

/**
 * Fires a Meta event WITH advanced-matching data (phone, external_id, city,
 * state, zip, country) attached — re-sent via `fbq('init', PIXEL_ID, …)`
 * immediately before the `track()` call, never inside track()'s own
 * custom-data object, which Meta doesn't auto-hash (same fix already applied
 * to "Lead" in packages/auth/src/facebook-pixel.ts and to
 * "CompleteRegistration"/"StartTrial" in components/thirdparties/
 * FacebookPixel.tsx — read that file's docblock for why user-data has to be
 * *polled* for a few seconds there specifically, right after registration).
 *
 * Use this instead of the plain `trackFacebookEvent` above for any event
 * where advanced matching should be sent — it existed as one working
 * pattern already, just wasn't reused, which is exactly why "Purchase"
 * (useRazorpayPayment.ts) and "CustomizeProduct" (payment/initiated/
 * page.tsx) were shipping with no phone/external_id/city/state/zip at all:
 * each call site would have needed its own copy of this same init-then-track
 * sequence, and two of them never got one.
 */
export async function trackFacebookEventWithUserData(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;

  const userData: MetaUserData = await waitForCachedMetaUserIdentifiers();
  Object.assign(userData, await getMetaGeoData());

  if (Object.keys(userData).length > 0) {
    window.fbq("init", FB_PIXEL_ID, userData);
  }

  window.fbq("track", eventName, params);
}
