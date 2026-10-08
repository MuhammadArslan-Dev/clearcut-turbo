"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/analytics/browser";
import { getCachedUser } from "@/lib/auth-token-client";
import type { UserPreview } from "@/types/User";
import { getMetaGeoData, type MetaGeoData } from "@clearcut/utils/meta-geo";

const FB_PIXEL_ID = "1126041265682766";

// Pixel failures used to be silent: a broken script just meant missing events
// for days before anyone noticed. Report once per page load so a drop shows up
// in Sentry. Ad-blockers also block fbevents.js, so expect some of this noise.
const PIXEL_READY_TIMEOUT_MS = 10000;

function reportPixelFailure(reason: string) {
  Sentry.captureMessage("Meta Pixel not running", {
    level: "warning",
    tags: { integration: "meta-pixel", reason },
  });
}

// The inline stub defines window.fbq immediately, even when fbevents.js is
// blocked, so only the real SDK (which adds callMethod) proves it loaded.
function isPixelSdkLoaded() {
  return typeof window.fbq === "function" && "callMethod" in window.fbq;
}

// Reads the auth cache directly (not useAuth()) because this component is
// mounted as a sibling of AuthProvider, not a child of it — see layout.tsx.
//
// NOTE on what calling `fbq('init', ...)` with this data actually does:
// confirmed via live network inspection against the real pixel, Meta's SDK
// only reads advanced-matching fields (ph/external_id/ct/st/zp) from the
// FIRST `fbq('init', PIXEL_ID, ...)` call it ever sees for that pixel ID on
// the page — a field that wasn't present in that first call can never be
// added by a later init()/set('userData') call, no matter the timing. The
// Script tag's inline bootstrap below is that first call and bakes in
// whatever's already cached. The re-init calls below (setMetaUserData, used
// for CompleteRegistration/StartTrial) therefore only still work for
// updating a field's VALUE if it was already present at bootstrap (e.g.
// country) — they cannot attach ph/external_id for a user who was anonymous
// at page load and only authenticates mid-session. Left in place as a
// harmless no-op for that case rather than removed, since it's still
// correct for the case where bootstrap already had partial data.
function getCachedUserData(): { ph?: string; external_id?: string } | null {
  const cachedUser = getCachedUser<UserPreview>();
  const digits = cachedUser?.phone?.replace(/\D/g, "");

  const userData: { ph?: string; external_id?: string } = {};
  if (digits) {
    // Meta expects the country code with no leading "+" and no spaces.
    userData.ph = digits.length === 10 ? `91${digits}` : digits;
  }
  if (cachedUser?.id) userData.external_id = String(cachedUser.id);

  return Object.keys(userData).length > 0 ? userData : null;
}

type MetaUserData = { ph?: string; external_id?: string } & Partial<MetaGeoData>;

function setMetaUserData(userData: MetaUserData) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("init", FB_PIXEL_ID, userData);
}

// CompleteRegistration/StartTrial fire on the FIRST-EVER dashboard load after
// registration/a first purchase — exactly when the auth cache AuthProvider
// writes to (after its own ~second-plus /v1/me round trip) is still empty.
// A synchronous cache read here loses the race almost every time for a truly
// new user, which is why Phone/External ID showed on only 53.8% of Start
// Trial and 74.19% of Complete Registration events (vs ~100% for Lead/
// Purchase, which fire once the cache already exists from an earlier visit).
// Polling this same cache for a few seconds — instead of an independent
// fetch — is deliberate: FacebookPixel mounts as AuthProvider's sibling, not
// its child (see layout.tsx), so there's no context to await, and the token
// AuthProvider is about to save from the URL isn't guaranteed written yet on
// this component's very first effect run either.
async function waitForCachedUserData(maxWaitMs = 4000, intervalMs = 250) {
  const deadline = Date.now() + maxWaitMs;
  let data = getCachedUserData();
  while (!data && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    data = getCachedUserData();
  }
  return data;
}

export default function FacebookPixel() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Loads as soon as the app mounts, on every page, for every visitor. This
  // used to wait for the first click/scroll/keydown, which silently dropped
  // PageView for bounced sessions and any one-shot event fired before the
  // visitor interacted. Analytics now starts with the page, as the client
  // requires; the cost is the extra script on first paint.
  //
  // `onReady` (not `onLoad`) is the signal: for an inline <Script> next/script
  // only calls onReady once the code has run. onLoad is never called for
  // inline scripts, which left the old `scriptReady` flag stuck at false and
  // kept every effect-driven event below from firing at all.
  const [scriptReady, setScriptReady] = useState(false);

  // PageView is sent once per route, not on every query-string change: the
  // one-shot signal handling below strips a param with router.replace, which
  // would otherwise re-run this effect on the same page and count PageView
  // a second time.
  const lastPageViewPath = useRef<string | null>(null);

  // If the script never reaches onReady (blocked, failed, or broken), nothing
  // else will tell us. Check once after the timeout: Sentry on failure, and an
  // Amplitude canary on every page load (loaded true/false).
  // TEMPORARY: the Amplitude canary is for monitoring until the Meta graph is
  // stable; the client has approved removing it then.
  useEffect(() => {
    const timer = setTimeout(() => {
      const loaded = isPixelSdkLoaded();
      if (!loaded) reportPixelFailure("sdk_not_loaded_after_timeout");
      trackEvent("Meta Pixel Status", {
        pixel_loaded: loaded,
        page_context: window.location.pathname,
      });
    }, PIXEL_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!scriptReady || !window.fbq) return;
    // Captured once so the async one-shot callbacks below (which run after
    // this effect returns) don't need TS to re-narrow `window.fbq` across a
    // closure boundary — it's already known non-null here.
    const fbq = window.fbq;

    // Sent immediately, never after a geo lookup — PageView is the highest
    // volume event and a visitor can leave at any moment. No re-init here:
    // Meta's SDK only ever reads advanced-matching fields (ph/external_id/
    // ct/st/zp) from the FIRST fbq('init', ...) call it sees for a pixel ID —
    // confirmed via live network inspection (a later init()/set('userData')
    // never attaches a field that wasn't in that first call, even when
    // called before the first track()). The Script tag below's inline
    // bootstrap is that first call, and already bakes in whatever's cached
    // from an earlier request this session — that's the only place this can
    // be set. Re-calling init() here would be a no-op for any new field and
    // only risks the SDK's own "Duplicate Pixel ID" console warning.
    if (lastPageViewPath.current !== pathname) {
      lastPageViewPath.current = pathname;
      fbq("track", "PageView");
    }
    void getMetaGeoData();

    // One-shot signals appended by the navigation that lands the user here.
    // Each is stripped after firing so a refresh/back-navigation to this URL
    // doesn't double-count it.
    const params = new URLSearchParams(searchParams.toString());
    let hasOneShotSignal = false;

    // Set by the onboarding flow's final redirect (ExamStep.tsx) — landing
    // here is the "completed registration" moment.
    if (params.get("user_type") === "new") {
      Promise.all([waitForCachedUserData(), getMetaGeoData()]).then(([userData, geo]) => {
        const merged = { ...(userData ?? {}), ...geo };
        if (Object.keys(merged).length > 0) setMetaUserData(merged);
        // No value/currency — registration has no monetary amount, and
        // Meta's Events Manager flagged formatting/missing-value issues on
        // this pair, so they're left out rather than sent as a placeholder.
        fbq("track", "CompleteRegistration");
      });
      params.delete("user_type");
      hasOneShotSignal = true;
    }

    // Set by buy-sigle-course-modal.tsx after a new course purchase — landing
    // here is the "start trial" moment for that subject.
    if (params.get("subject_selected") === "1") {
      Promise.all([waitForCachedUserData(), getMetaGeoData()]).then(([userData, geo]) => {
        const merged = { ...(userData ?? {}), ...geo };
        if (Object.keys(merged).length > 0) setMetaUserData(merged);
        fbq("track", "StartTrial");
      });
      params.delete("subject_selected");
      hasOneShotSignal = true;
    }

    if (hasOneShotSignal) {
      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname,
        { scroll: false },
      );
    }
  }, [scriptReady, pathname, searchParams, router]);

  return (
    <>
      {/* Script tag with Facebook Pixel code. PageView is sent by the effect
          above once onReady flips scriptReady, so it isn't sent twice.

          The init() call below is THE only place advanced-matching data
          (ph/external_id/ct/st/zp) can ever be attached for this pixel
          instance — see the NOTE above getCachedUserData(). It reads
          auth_user_cache (apps/dashboard/src/lib/auth-token-client.ts) and
          meta_geo_data (packages/utils/src/meta-geo.ts) synchronously,
          in plain JS, before React/fbevents.js even run, so a returning
          visitor's already-cached phone/user-id/geo is baked into the
          FIRST init() call instead of a later one that Meta would ignore.
          Only real cached values are used — never placeholders — since
          sending fabricated PII to Meta is worse than sending none. */}
      <Script
        id={FB_PIXEL_ID}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            var ccUd = { country: 'in' };
            try {
              var ccUserRaw = localStorage.getItem('auth_user_cache');
              var ccUserEntry = ccUserRaw ? JSON.parse(ccUserRaw) : null;
              if (ccUserEntry && ccUserEntry.data && (Date.now() - ccUserEntry.cachedAt) <= 300000) {
                var ccDigits = String(ccUserEntry.data.phone || '').replace(/[^0-9]/g, '');
                if (ccDigits) ccUd.ph = ccDigits.length === 10 ? ('91' + ccDigits) : ccDigits;
                if (ccUserEntry.data.id) ccUd.external_id = String(ccUserEntry.data.id);
              }
            } catch (e) {}
            try {
              var ccGeoRaw = sessionStorage.getItem('meta_geo_data');
              var ccGeo = ccGeoRaw ? JSON.parse(ccGeoRaw) : null;
              if (ccGeo) {
                if (ccGeo.ct) ccUd.ct = ccGeo.ct;
                if (ccGeo.st) ccUd.st = ccGeo.st;
                if (ccGeo.zp) ccUd.zp = ccGeo.zp;
              }
            } catch (e) {}
            fbq('init', '${FB_PIXEL_ID}', ccUd);
          `,
        }}
      />
      {/* Noscript tag for tracking */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
