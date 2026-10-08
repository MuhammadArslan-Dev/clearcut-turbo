"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { getMetaGeoData } from "@clearcut/utils/meta-geo";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "1126041265682766";

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Loads as soon as the app mounts, on every page. This used to wait for the
  // first click/scroll/keydown, which silently dropped PageView for bounced
  // visitors. The client requires the pixel to be live on page load.
  //
  // `onReady` (not `onLoad`) is the signal: for an inline <Script> next/script
  // only calls onReady once the code has run; onLoad is never called for inline
  // scripts.
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !window.fbq) return;

    // PageView is never held back by the geo lookup (it can take up to its
    // time budget, and a visitor can leave at any moment). No re-init here:
    // confirmed via live network inspection against the real pixel, Meta's
    // SDK only ever reads advanced-matching fields (ct/st/zp/ph/external_id)
    // from the FIRST `fbq('init', PIXEL_ID, ...)` call it sees for a pixel ID
    // on the page — a field that wasn't present in that first call can never
    // be added by a later init() call, regardless of timing relative to the
    // first track(). The Script tag below's inline bootstrap is that first
    // call and already bakes in cached geo if this session has it; re-init
    // here would be a no-op for a visitor whose first page load this session
    // had no cached geo yet, and only risks the SDK's own "Duplicate Pixel
    // ID" console warning.
    window.fbq("track", "PageView");

    // Warm the session cache so the next PageView / conversion event on this
    // visit carries geo without waiting for the lookup.
    void getMetaGeoData();
  }, [pathname, searchParams, scriptReady]);

  return (
    <>
      {/* The init() call below is THE only place advanced-matching geo data
          (ct/st/zp) can ever be attached for this pixel instance — Meta's SDK
          only reads these fields from the FIRST init() call it sees for a
          pixel ID (confirmed via live network inspection), never a later
          one. It reads meta_geo_data (packages/utils/src/meta-geo.ts)
          synchronously, in plain JS, before React/fbevents.js even run, so a
          geo lookup already cached earlier this session is baked in from the
          start. Landing has no reliable synchronous phone/user-id cache at
          this point (visitors are anonymous pre-login, and a logged-in
          visitor is redirected to the dashboard — see root CLAUDE.md "Tools:
          Save for Future"), so only geo is read here. */}
      <Script
        id="fb-pixel"
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
      {/* No inline fbq('track', 'PageView') here — the effect above fires it
          once the script is ready, so it isn't sent twice. */}
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
