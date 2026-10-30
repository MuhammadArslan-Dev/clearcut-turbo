"use client";

import { useEffect } from "react";
import type { AuthSuccessResult } from "@clearcut/auth/types";
import type { LoginGateConfig } from "@/lib/loginGate";
import { AuthModal, setAuthenticatedHandler, setAuthContext, useAuthStore } from "@/lib/toolsAuthFeature";

/** Mounts the shared login modal with the copy of one LoginGateConfig and
 * opens it each time `requestId` increases. Loaded with next/dynamic
 * (ssr: false) by useLoginGate / SyllabusTrackerApp only once a visitor first
 * needs to log in, so the whole auth bundle stays out of a tool's initial
 * load. */
export default function ToolsAuthGate({
  requestId,
  copy,
  onAuthenticated,
}: {
  requestId: number;
  copy: LoginGateConfig;
  onAuthenticated: (result: AuthSuccessResult) => void;
}) {
  useEffect(() => {
    setAuthenticatedHandler(onAuthenticated);
    return () => setAuthenticatedHandler(null);
  }, [onAuthenticated]);

  useEffect(() => {
    setAuthContext(copy.id, copy.eventProps);
    return () => setAuthContext(null);
  }, [copy.id, copy.eventProps]);

  useEffect(() => {
    if (requestId > 0) useAuthStore.getState().goToLogin();
  }, [requestId]);

  return (
    <AuthModal
      loginCopy={{
        title: copy.title,
        subtitle: copy.subtitle,
        submitLabel: copy.submitLabel,
        illustration: copy.illustration,
        featureChips: copy.featureChips,
        otpSubmitLabel: copy.otpSubmitLabel,
        showTrialBanner: false,
        showTrustText: false,
      }}
    />
  );
}
