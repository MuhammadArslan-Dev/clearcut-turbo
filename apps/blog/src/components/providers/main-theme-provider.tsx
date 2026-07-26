"use client";
import React from "react";
import { ReactQueryProvider } from "@clearcut/react-query/provider";
import { useHydrateStore } from "@clearcut/state/use-hydrate-store";
import { useLanguageStore } from "@/store/useLanguageStore";
import EmotionProvider from "@/components/providers/emotion-provider";
type CssVarsProviderProps = {
  children: React.ReactNode;
};

export default function MainThemeProvider({ children }: CssVarsProviderProps) {
  // Phase 3 (Global State): triggers useLanguageStore's deferred localStorage
  // read (skipHydration: true — see useLanguageStore.ts) once, after this
  // component has already mounted/hydrated.
  useHydrateStore(useLanguageStore);

  return (
    <ReactQueryProvider>
      {/* Joy's CssVarsProvider (and `@/themes/joytheme`) used to sit inside
          EmotionProvider here. Both are gone: no Joy component renders anywhere in
          the repository, so the provider had no consumers — it was only emitting
          892 unused `--joy-*` custom properties onto :root (measured before
          removal). Nothing outside the deleted theme file ever referenced them.

          EmotionProvider is deliberately KEPT. Removing Emotion is a separate
          milestone, and it still owns the SSR style cache; blog is believed to
          have no remaining Emotion consumer, but that is for the Emotion ticket to
          establish and act on, not this one. */}
      <EmotionProvider>{children}</EmotionProvider>
    </ReactQueryProvider>
  );
}
