"use client";
import React from "react";
import { CssVarsProvider } from "@mui/joy/styles";
import joytheme from "@/themes/joytheme";
import { ReactQueryProvider } from "@clearcut/react-query/provider";
import { useHydrateStore } from "@clearcut/state/use-hydrate-store";
import { useLanguageStore } from "@/store/useLanguageStore";
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
      <CssVarsProvider theme={joytheme}>{children}</CssVarsProvider>
    </ReactQueryProvider>
  );
}
