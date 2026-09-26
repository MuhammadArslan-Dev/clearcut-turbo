"use client";

// The one place apps/tools wires the shared @clearcut/auth feature — same
// role as apps/landing/src/lib/auth.ts, with one deliberate difference:
// `onAuthenticated` is set, so a successful OTP/Truecaller login closes the
// modal and runs the callback on THIS page instead of redirecting to the
// dashboard/onboarding app (see AuthScreenDeps.onAuthenticated in
// packages/auth). AuthProvider is intentionally never mounted in this app —
// its mount-time "already logged in, bounce to the dashboard" effect is
// exactly what Tools must not do.
//
// Heavy (axios, zustand, framer-motion, the OTP screens) so it's only ever
// reached through the lazily-loaded ToolsAuthGate component, the first time a
// visitor actually asks to log in.
import { createApiClient } from "@clearcut/api/client";
import { createAuthFeature } from "@clearcut/auth/create-auth-feature";
import { clearToken, getToken } from "@clearcut/auth/token";
import type { AuthSuccessResult } from "@clearcut/auth/types";

import { MAIN_BACKEND_URL } from "./api/mainBackend";
import { logAmplitudeEvent } from "./toolsAnalytics";
import { notifySessionChange } from "./toolsSession";

let authenticatedHandler: ((result: AuthSuccessResult) => void) | null = null;

/** ToolsAuthGate registers the current page's "what to do once logged in"
 * callback here (e.g. resume a pending Save for Future). */
export function setAuthenticatedHandler(handler: ((result: AuthSuccessResult) => void) | null) {
  authenticatedHandler = handler;
}

const api = createApiClient({
  baseURL: MAIN_BACKEND_URL,
  getAuthToken: getToken,
  onUnauthorized: () => {
    clearToken();
    notifySessionChange();
  },
});

export const { AuthModal, useAuthStore } = createAuthFeature({
  apiClient: api,
  apiBaseUrl: MAIN_BACKEND_URL,
  // Required by the type but never used: `onAuthenticated` below replaces the
  // redirect this URL would have been the base of.
  redirectBaseUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || "https://app.clearcutoff.in",
  // Records the auth funnel (Verification Sent / Resent, …) from Tools too.
  onEvent: logAmplitudeEvent,
  onAuthenticated: (result) => {
    notifySessionChange();
    authenticatedHandler?.(result);
  },
});
