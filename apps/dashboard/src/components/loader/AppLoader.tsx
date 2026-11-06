"use client";

import { CCLoader } from "@clearcut/motion/loader";
import { useMotionLang } from "@/components/features/test-motion/TestStartIntro";

/**
 * The dashboard's loading state: @clearcut/motion's CCLoader with the "Lesson Path" scene (Nibbu hops up a
 * chapter path). Same API surface as the loader it replaces (see ./legacy): `AppFullScreenLoader` = the full-screen
 * overlay (ProtectedPage fallback, /dashboard), `AppMainLoader` = the small in-page loader.
 *
 * Uncontrolled mode on purpose: the library holds the fade-in with a CSS delay (250 ms), so a fast load shows no
 * flash and nothing here changes when / how long it is mounted. Marathi falls back to Hindi (the library is en + hi).
 */
export function AppFullScreenLoader() {
  const lang = useMotionLang();
  return <CCLoader variant="fullscreen" design="path" lang={lang} />;
}

export function AppMainLoader() {
  const lang = useMotionLang();
  // Inline in a page/card: no tips (they belong to the long, full-screen waits), the callers add their own text.
  return <CCLoader variant="inline" design="path" lang={lang} tips={false} />;
}
