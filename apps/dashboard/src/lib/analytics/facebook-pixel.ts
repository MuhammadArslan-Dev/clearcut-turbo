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

  const userData: MetaUserData = getCachedMetaUserIdentifiers();
  Object.assign(userData, await getMetaGeoData());

  if (Object.keys(userData).length > 0) {
    window.fbq("init", FB_PIXEL_ID, userData);
  }

  window.fbq("track", eventName, params);
}
