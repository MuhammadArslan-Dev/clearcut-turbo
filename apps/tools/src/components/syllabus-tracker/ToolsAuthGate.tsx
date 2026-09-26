"use client";

import { useEffect } from "react";
import type { AuthSuccessResult } from "@clearcut/auth/types";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import { AuthModal, setAuthenticatedHandler, useAuthStore } from "@/lib/toolsAuthFeature";

/** Mounts the shared login modal with Tools-specific copy and opens it each
 * time `requestId` increases. Loaded with next/dynamic (ssr: false) by
 * SyllabusTrackerApp only once a visitor first asks to log in, so the whole
 * auth bundle stays out of the anonymous tracker's initial load. */
export default function ToolsAuthGate({
  requestId,
  reason,
  locale,
  onAuthenticated,
}: {
  requestId: number;
  /** Why the login was opened — only changes the modal's title. */
  reason: "save" | "load";
  locale: Locale;
  onAuthenticated: (result: AuthSuccessResult) => void;
}) {
  const t = getSyllabusStrings(locale);

  useEffect(() => {
    setAuthenticatedHandler(onAuthenticated);
    return () => setAuthenticatedHandler(null);
  }, [onAuthenticated]);

  useEffect(() => {
    if (requestId > 0) useAuthStore.getState().goToLogin();
  }, [requestId]);

  return (
    <AuthModal
      loginCopy={{
        title: reason === "load" ? t.loginToLoadTitle : t.loginToSaveTitle,
        subtitle: t.loginToSaveSubtitle,
        submitLabel: t.loginToSaveSubmit,
        showTrialBanner: false,
        showTrustText: false,
      }}
    />
  );
}
