import { getCachedUser } from "@/lib/auth-token-client";
import type { UserPreview } from "@/types/User";
import { getMetaGeoData, type MetaGeoData } from "@clearcut/utils/meta-geo";
import { metaPixelId } from "@clearcut/utils/meta-pixel-env";
import { usableEmail } from "@clearcut/utils/usable-email";

// Same live pixel ID every app's own FacebookPixel.tsx uses.
export const LIVE_FB_PIXEL_ID = "1126041265682766";

/**
 * The pixel this page runs: the live one on real sites, none on localhost
 * unless this browser opted in, then the test pixel when
 * NEXT_PUBLIC_FB_PIXEL_ID_TEST is set (packages/utils/src/meta-pixel-env.ts,
 * CC-115 Part A). Every fbq('init', …) in the app uses this, so a local test
 * session never also initializes the live pixel.
 */
export function getFbPixelId(): string | null {
  return metaPixelId(
    LIVE_FB_PIXEL_ID,
    process.env.NEXT_PUBLIC_FB_PIXEL_ID_TEST,
  );
}

export function trackFacebookEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;

  window.fbq("track", eventName, params);
}

type MetaUserData = {
  ph?: string;
  external_id?: string;
} & Partial<MetaGeoData>;

// Same phone/external_id shape as packages/auth/src/facebook-pixel.ts and
// components/thirdparties/FacebookPixel.tsx's getCachedUserData — reads the
// auth cache directly (not useAuth()) so this also works from non-component
// call sites like useRazorpayPayment.ts, which isn't rendered inside
// AuthProvider's tree.
function getCachedMetaUserIdentifiers(): { ph?: string; em?: string; external_id?: string } {
  const cachedUser = getCachedUser<UserPreview>();
  const digits = cachedUser?.phone?.replace(/\D/g, "");

  const userData: { ph?: string; em?: string; external_id?: string } = {};
  if (digits) {
    // Meta expects the country code with no leading "+" and no spaces.
    userData.ph = digits.length === 10 ? `91${digits}` : digits;
  }
  if (cachedUser?.id) userData.external_id = String(cachedUser.id);
  // Email (Truecaller / account page), only when real (CC-113). Plaintext,
  // normalised; the Pixel hashes it. No email → no `em` key at all.
  const em = usableEmail(cachedUser?.email);
  if (em) userData.em = em;

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
): Promise<{ ph?: string; em?: string; external_id?: string }> {
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
  /** Meta de-duplicates events with the same eventID (e.g. a retried Purchase). */
  eventId?: string,
) {
  if (typeof window === "undefined" || !window.fbq) return;

  const userData: MetaUserData = await waitForCachedMetaUserIdentifiers();
  Object.assign(userData, await getMetaGeoData());

  if (Object.keys(userData).length > 0) {
    window.fbq("init", getFbPixelId() ?? LIVE_FB_PIXEL_ID, userData);
  }

  if (eventId) window.fbq("track", eventName, params, { eventID: eventId });
  else window.fbq("track", eventName, params);
}

const META_SENT_PREFIX = "meta_event_sent:";

/**
 * Sends a backend-decided Meta event once per event id on this browser
 * (CC-53). Meta also de-duplicates by eventID; this skips the obvious repeat
 * (a refresh of the success screen) before it is sent at all.
 */
export function trackFacebookEventOnce(
  eventName: string,
  params: Record<string, unknown>,
  eventId: string,
) {
  const key = `${META_SENT_PREFIX}${eventId}:${eventName}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    // Storage unavailable: Meta's eventID de-duplication still applies.
  }
  void trackFacebookEventWithUserData(eventName, params, eventId);
}
