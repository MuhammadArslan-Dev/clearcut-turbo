"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { getCachedUser } from "@/lib/auth-token-client";
import type { UserPreview } from "@/types/User";

const FB_PIXEL_ID = "1126041265682766";

// Re-sends Meta's advanced-matching data via `init` (the base pixel script
// below already called it once, without user data, on page load) — never
// inside a track() call's custom-data object, which Meta doesn't auto-hash.
// Same fix already applied to the "Lead" event (packages/auth/src/
// facebook-pixel.ts) and to the payment page (setMetaUserData in
// payment/initiated/page.tsx); CompleteRegistration/StartTrial fire from
// here instead, and were missing it, which is why Phone/External ID showed
// on only ~2% of Complete Registration events and 0% of Start Trial events.
// Reads the auth cache directly (not useAuth()) because this component is
// mounted as a sibling of AuthProvider, not a child of it — see layout.tsx.
function setMetaUserData() {
  if (typeof window === "undefined" || !window.fbq) return;

  const cachedUser = getCachedUser<UserPreview>();
  const digits = cachedUser?.phone?.replace(/\D/g, "");

  const userData: { ph?: string; external_id?: string } = {};
  if (digits) {
    // Meta expects the country code with no leading "+" and no spaces.
    userData.ph = digits.length === 10 ? `91${digits}` : digits;
  }
  if (cachedUser?.id) userData.external_id = String(cachedUser.id);

  if (Object.keys(userData).length > 0) {
    window.fbq("init", FB_PIXEL_ID, userData);
  }
}

export default function FacebookPixel() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!window.fbq) return;

    window.fbq("track", "PageView");

    // One-shot signals appended by the navigation that lands the user here.
    // Each is stripped after firing so a refresh/back-navigation to this URL
    // doesn't double-count it.
    const params = new URLSearchParams(searchParams.toString());
    let hasOneShotSignal = false;

    // Set by the onboarding flow's final redirect (ExamStep.tsx) — landing
    // here is the "completed registration" moment.
    if (params.get("user_type") === "new") {
      setMetaUserData();
      window.fbq("track", "CompleteRegistration", {
        value: 0.0,
        currency: "INR",
      });
      params.delete("user_type");
      hasOneShotSignal = true;
    }

    // Set by buy-sigle-course-modal.tsx after a new course purchase — landing
    // here is the "start trial" moment for that subject.
    if (params.get("subject_selected") === "1") {
      setMetaUserData();
      window.fbq("track", "StartTrial");
      params.delete("subject_selected");
      hasOneShotSignal = true;
    }

    if (hasOneShotSignal) {
      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname,
        { scroll: false },
      );
    }
  }, [pathname, searchParams, router]);

  return (
    <>
      {/* Script tag with Facebook Pixel code */}
      <Script
        id={FB_PIXEL_ID}
        strategy="afterInteractive"
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
            fbq('init', '1126041265682766');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Noscript tag for tracking */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`www.facebook.com${FB_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
