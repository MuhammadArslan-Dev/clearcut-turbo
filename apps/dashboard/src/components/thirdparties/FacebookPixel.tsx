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

// Bounded budget for waiting on auth_user_cache before the pixel's ONE real
// init() call (see the docblock above the component below for why this has
// to be the first call, not a later re-init). A returning visitor with an
// already-warm cache resolves almost instantly; a brand-new registration's
// first-ever cache write (measured 2.6-4.2s) is the slow path this is sized
// for. This only delays the Pixel's own init()/PageView — never the app's
// own rendering, which this component's effect runs independently of.
const USER_DATA_WAIT_MS = 4000;
const USER_DATA_POLL_INTERVAL_MS = 250;

// Marks the last registration-occurrence id Lead was fired for, so a refresh
// of the same URL (or a stale bookmark/back-navigation carrying the same
// `meta_lead` value) never fires a second Lead for one real registration.
const META_LEAD_FIRED_KEY = "meta_lead_fired";

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

// Still used by CompleteRegistration/StartTrial below, re-sent via a later
// fbq('init', ...) call immediately before their track() call — kept exactly
// as before (client's approved scope excludes changing non-Lead events).
// Confirmed via live network inspection against the real pixel: Meta's SDK
// only reads advanced-matching fields from the FIRST init() call it ever
// sees for a pixel ID on the page, so this only still updates a field's
// VALUE if it was already present in that first call (e.g. country) — it
// cannot attach ph/external_id for a user who was anonymous at that first
// call and only authenticates mid-session. Left in place as a harmless
// no-op for that case, since the real fix is the bootstrap sequence below
// now reliably having that data available for its own first call.
function setMetaUserData(userData: MetaUserData) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("init", FB_PIXEL_ID, userData);
}

async function waitForCachedUserData(
  maxWaitMs = USER_DATA_WAIT_MS,
  intervalMs = USER_DATA_POLL_INTERVAL_MS,
) {
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

  // `onReady` (not `onLoad`) is the signal: for an inline <Script> next/script
  // only calls onReady once the code has run. onLoad is never called for
  // inline scripts.
  const [scriptReady, setScriptReady] = useState(false);

  // Set on the very first run, to the pathname that run saw — lets later
  // route changes know whether they still owe this path its PageView.
  const lastPageViewPath = useRef<string | null>(null);

  // Resolves once the pixel's one real init() call + first PageView have
  // fired. Every other event in this component (route-change PageView,
  // CompleteRegistration/StartTrial/Lead) is chained off this instead of
  // racing it — firing any of those before init() means there is no pixel
  // context yet for fbq to attach them to.
  const bootstrapRef = useRef<Promise<void> | null>(null);

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
    // Captured once so the async callbacks below don't need TS to re-narrow
    // `window.fbq` across a closure boundary — it's already known non-null.
    const fbq = window.fbq;

    if (!bootstrapRef.current) {
      // ---- First run for this page load: the pixel's one real init(). ----
      lastPageViewPath.current = pathname;

      bootstrapRef.current = (async () => {
        let ccUd: MetaUserData = { country: "in" };
        try {
          const [userData, geo] = await Promise.all([
            waitForCachedUserData(),
            getMetaGeoData(),
          ]);
          ccUd = { ...geo, ...(userData ?? {}) };
          console.log("Meta Pixel: user data ready");
        } catch {
          // Never block the app on a tracking failure — fall through and
          // init with whatever's in ccUd (country-only at worst). Do not
          // fabricate phone/zip/state here just to "fill" them.
        }

        try {
          fbq("init", FB_PIXEL_ID, ccUd);
          console.log("Meta Pixel: initialized");
          fbq("track", "PageView");
        } catch {
          reportPixelFailure("init_or_pageview_threw");
        }
      })();
    } else if (lastPageViewPath.current !== pathname) {
      // ---- Route change after the initial load: no re-init, just PageView
      // on the pixel the bootstrap above already initialized. ----
      lastPageViewPath.current = pathname;
      void bootstrapRef.current.then(() => fbq("track", "PageView"));
    }

    // Warm the session geo cache so any Meta event on this page (including
    // the one-shot signals below) doesn't re-fetch it.
    void getMetaGeoData();

    // One-shot signals appended by the navigation that lands the user here.
    // Each is stripped after being read so a refresh/back-navigation to this
    // URL doesn't re-process it. Handled uniformly every run (meta_lead can
    // only ever be present on the very first run — it's only ever set by the
    // post-OTP redirect — but checking it here every time is free).
    const params = new URLSearchParams(searchParams.toString());
    let hasOneShotSignal = false;

    // Set by the post-OTP-verify redirect (packages/auth/src/redirect.ts)
    // only when that verification was a genuinely new registration — see
    // the docblock above the component for the full ordering this enables.
    const leadId = params.get("meta_lead");
    if (leadId) {
      hasOneShotSignal = true;
      params.delete("meta_lead");
      void bootstrapRef.current.then(() => {
        let alreadyFired = false;
        try {
          alreadyFired = localStorage.getItem(META_LEAD_FIRED_KEY) === leadId;
        } catch {
          // Ignore storage failures (private browsing, quota, etc.) — worst
          // case this fires Lead again rather than silently dropping it.
        }

        if (alreadyFired) {
          console.log("Meta Lead: already handled");
          return;
        }

        try {
          fbq("track", "Lead", undefined, { eventID: `lead_${leadId}` });
          console.log("Meta Lead: fired");
        } catch {
          reportPixelFailure("lead_track_threw");
          return;
        }
        try {
          localStorage.setItem(META_LEAD_FIRED_KEY, leadId);
        } catch {
          // Ignore — see above.
        }
      });
    }

    // Set by the onboarding flow's final redirect (ExamStep.tsx) — landing
    // here is the "completed registration" moment.
    if (params.get("user_type") === "new") {
      hasOneShotSignal = true;
      params.delete("user_type");
      void bootstrapRef.current
        .then(() => Promise.all([waitForCachedUserData(), getMetaGeoData()]))
        .then(([userData, geo]) => {
          const merged = { ...(userData ?? {}), ...geo };
          if (Object.keys(merged).length > 0) setMetaUserData(merged);
          // No value/currency — registration has no monetary amount, and
          // Meta's Events Manager flagged formatting/missing-value issues on
          // this pair, so they're left out rather than sent as a placeholder.
          fbq("track", "CompleteRegistration");
        });
    }

    // Set by buy-sigle-course-modal.tsx after a new course purchase — landing
    // here is the "start trial" moment for that subject.
    if (params.get("subject_selected") === "1") {
      hasOneShotSignal = true;
      params.delete("subject_selected");
      void bootstrapRef.current
        .then(() => Promise.all([waitForCachedUserData(), getMetaGeoData()]))
        .then(([userData, geo]) => {
          const merged = { ...(userData ?? {}), ...geo };
          if (Object.keys(merged).length > 0) setMetaUserData(merged);
          fbq("track", "StartTrial");
        });
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
      {/* Script tag with Facebook Pixel code. It only defines window.fbq and
          loads fbevents.js here — it deliberately does NOT call fbq('init',
          ...) inline anymore. The actual init() call is the pixel's ONE real
          first call, and now lives in the effect above, gated behind a
          bounded wait for auth_user_cache (apps/dashboard/src/lib/
          auth-token-client.ts) and meta_geo_data (packages/utils/src/
          meta-geo.ts) — see that effect's docblock. Advanced-matching data
          (ph/external_id/ct/st/zp) can ONLY ever be attached at that one
          call — confirmed via live network inspection against the real
          pixel, Meta's SDK never reads these fields from a later init()/
          set('userData') call, no matter the timing — which is exactly why
          this now waits instead of initializing synchronously and hoping a
          later call could add them. Only real cached/fetched values are
          used — never placeholders — since sending fabricated PII to Meta
          is worse than sending none. Waiting here never blocks the app's
          own rendering; it only delays this pixel's own init()/PageView. */}
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
