"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { getMetaGeoData, readCachedMetaGeoData } from "@clearcut/utils/meta-geo";

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
    // time budget, and a visitor can leave at any moment). If geo is already
    // cached for this session, re-init with it first so PageView carries
    // city/state/zip; otherwise send PageView now with country only. Meta only
    // auto-hashes these fields when they're passed to `init`, never inside a
    // `track()` call's own custom-data object.
    const cachedGeo = readCachedMetaGeoData();
    if (cachedGeo) window.fbq("init", FB_PIXEL_ID, cachedGeo);
    window.fbq("track", "PageView");

    // Warm the session cache so the next PageView / conversion event on this
    // visit carries geo without waiting for the lookup.
    void getMetaGeoData();
  }, [pathname, searchParams, scriptReady]);

  return (
    <>
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
            fbq('init', '${FB_PIXEL_ID}', { country: 'in' });
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
