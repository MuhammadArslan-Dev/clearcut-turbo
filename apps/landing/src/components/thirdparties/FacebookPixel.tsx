"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { getMetaGeoData } from "@clearcut/utils/meta-geo";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "1126041265682766";

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loadPixel, setLoadPixel] = useState(false);

  useEffect(() => {
    const enablePixel = () => setLoadPixel(true);

    window.addEventListener("click", enablePixel, { once: true });
    window.addEventListener("scroll", enablePixel, { once: true });
    window.addEventListener("keydown", enablePixel, { once: true });

    return () => {
      window.removeEventListener("click", enablePixel);
      window.removeEventListener("scroll", enablePixel);
      window.removeEventListener("keydown", enablePixel);
    };
  }, []);

  useEffect(() => {
    if (!loadPixel) return;

    // Landing has no logged-in user (no ph/external_id to add), but its
    // PageView is the highest-volume event across the whole funnel — the
    // inline script below used to `init` with only `{ country: 'in' }` and
    // fire PageView immediately, so city/state/zip (Meta's `ct`/`st`/`zp`
    // advanced-matching fields, IP-geolocated — see packages/utils/src/
    // meta-geo.ts) never went out on it. This effect is now the *only* place
    // that fires PageView (the inline script only sets up the SDK + the
    // country-only base init, see below) — re-initializing with the fuller
    // geo data right before it, same pattern already used for the
    // dashboard's events (apps/dashboard/src/lib/analytics/facebook-pixel.ts
    // and components/thirdparties/FacebookPixel.tsx). Meta only auto-hashes
    // these fields when set via `init`, never inside a `track()` call's own
    // custom-data object.
    //
    // `window.fbq` is checked only after the geo fetch resolves, not before
    // it — the inline script's fbq stub is created synchronously as soon as
    // it runs, well within the time an external geo lookup takes, so this
    // avoids a startup race against `next/script`'s own load timing without
    // needing a retry loop.
    getMetaGeoData().then((geo) => {
      if (!window.fbq) return;
      window.fbq("init", FB_PIXEL_ID, geo);
      window.fbq("track", "PageView");
    });
  }, [pathname, searchParams, loadPixel]);

  if (!loadPixel) return null;

  return (
    <>
      <Script
        id="fb-pixel"
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
            fbq('init', '${FB_PIXEL_ID}', { country: 'in' });
          `,
        }}
      />
      {/* No inline fbq('track', 'PageView') here — the effect above fires
          it once the geo lookup resolves (re-init'd with city/state/zip
          first), so it isn't sent twice. */}
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
