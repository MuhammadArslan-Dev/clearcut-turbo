"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { getCachedUser } from "@/lib/auth-token-client";
import type { UserPreview } from "@/types/User";
import { getMetaGeoData, type MetaGeoData } from "@clearcut/utils/meta-geo";

const FB_PIXEL_ID = "1126041265682766";

// Re-sends Meta's advanced-matching data via `init` (the base pixel script
// below already called it once, without user data, on page load) — never
// inside a track() call's custom-data object, which Meta doesn't auto-hash.
// Same fix already applied to the "Lead" event (packages/auth/src/
// facebook-pixel.ts) and to the payment page (setMetaUserData in
// payment/initiated/page.tsx). Reads the auth cache directly (not useAuth())
// because this component is mounted as a sibling of AuthProvider, not a
// child of it — see layout.tsx.
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

  useEffect(() => {
    if (!scriptReady || !window.fbq) return;
    // Captured once so the async one-shot callbacks below (which run after
    // this effect returns) don't need TS to re-narrow `window.fbq` across a
    // closure boundary — it's already known non-null here.
    const fbq = window.fbq;

    // Sent immediately, never after a geo lookup — PageView is the highest
    // volume event and a visitor can leave at any moment. Geo is fetched in
    // the background so the later events in this session carry it from cache.
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
      {/* Script tag with Facebook Pixel code. The base init (country only) runs
          here; PageView is sent by the effect above once onReady flips
          scriptReady, so it isn't sent twice. */}
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
            fbq('init', '${FB_PIXEL_ID}', { country: 'in' });
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
