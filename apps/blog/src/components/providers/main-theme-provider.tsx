"use client";
import React from "react";
import { CssVarsProvider } from "@mui/joy/styles";
import joytheme from "@/themes/joytheme";
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
      {/* EmotionProvider must wrap CssVarsProvider: Joy's global styles are
          emitted by Emotion's <Global>, and the cache has to be in context
          before those styles are serialized. See emotion-provider.tsx. */}
      <EmotionProvider>
        <CssVarsProvider theme={joytheme}>{children}</CssVarsProvider>
      </EmotionProvider>
    </ReactQueryProvider>
  );
}
