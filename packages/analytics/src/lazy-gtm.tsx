"use client";

import { useEffect, useState } from "react";
import { GoogleTagManager } from "@next/third-parties/google";
import { INTERACTION_EVENTS } from "./constants";
import { GTM_ID, isAnalyticsEnabled } from "./env";

/**
 * Google Tag Manager, loaded on first user interaction.
 *
 * This is the single implementation for the whole monorepo. It replaces two
 * byte-identical copies (apps/landing and apps/dashboard each had their own
 * `LazyGTM.tsx`, differing only by a trailing space on line 1) with one shared
 * module, so a fix here lands everywhere instead of in one app.
 *
 * The loading strategy is preserved exactly, because it was already the right
 * one: nothing is requested until the visitor clicks, scrolls or types. A
 * visitor who bounces costs zero bytes of GTM. This is stronger than
 * `next/script strategy="lazyOnload"`, which still loads on every view.
 *
 * Two things changed relative to the old copies:
 *   - the container ID comes from NEXT_PUBLIC_GTM_ID, never a literal
 *   - the environment gate lives in ./env and is checked HERE, not at the call
 *     site, so an app cannot forget it (apps/dashboard previously mounted its
 *     copy ungated and fired from localhost — verified at runtime)
 */
export default function LazyGTM({ gtmId = GTM_ID }: { gtmId?: string }) {
  const [interacted, setInteracted] = useState(false);

  const enabled = isAnalyticsEnabled(gtmId);

  useEffect(() => {
    // Bail before attaching listeners at all when analytics is off. The effect
    // still runs unconditionally so the hook order never changes between
    // renders.
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

  if (!enabled || !interacted || !gtmId) return null;

  return <GoogleTagManager gtmId={gtmId} />;
}
