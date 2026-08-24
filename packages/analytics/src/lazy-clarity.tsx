"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { INTERACTION_EVENTS } from "./constants";
import { CLARITY_ID, isAnalyticsEnabled } from "./env";

/**
 * Microsoft Clarity, loaded on first user interaction — same lazy-on-
 * interaction strategy as LazyGTM (see that file's docstring for the
 * rationale), so a visitor who bounces costs zero Clarity bytes either.
 *
 * Once loaded, Clarity exposes `window.clarity(...)` globally — that's what
 * `identifyClarityUser` (./clarity.ts) calls once the app knows who the
 * user is. This component only loads the script; it does not identify
 * anyone by itself.
 */
export default function LazyClarity({ clarityId = CLARITY_ID }: { clarityId?: string }) {
  const [interacted, setInteracted] = useState(false);

  const enabled = isAnalyticsEnabled(clarityId);

  useEffect(() => {
    if (!enabled) return;

    const onInteract = () => setInteracted(true);

    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, onInteract, { once: true });
    }

    return () => {
      for (const event of INTERACTION_EVENTS) {
        window.removeEventListener(event, onInteract);
      }
    };
  }, [enabled]);

  if (!enabled || !interacted || !clarityId) return null;

  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityId}");
      `}
    </Script>
  );
}
