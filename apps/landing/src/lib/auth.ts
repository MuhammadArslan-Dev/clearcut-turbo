// src/lib/auth.ts
//
// The one place landing wires the shared @clearcut/auth feature to its own
// config (API client, redirect URLs, analytics). Every other file in this
// app that needs auth (AuthProvider, AuthModal, useAuthStore, authApi,
// InlineAuthFlow, ...) imports from here — never from @clearcut/auth
// directly — so this file is the single source of app-specific auth
// configuration, matching the same shape blog/dashboard would use.
//
// "use client" is required here: this module is reachable from the root
// layout (a Server Component), and createAuthFeature() calls into
// createAuthContext(), which lives in a "use client" file in the package.
// Calling a client-only function during server evaluation throws, so this
// whole instantiation must itself be a client boundary — matching how the
// original AuthContext.tsx (which this replaces) was also "use client".
"use client";

import { createAuthFeature } from "@clearcut/auth/create-auth-feature";
import { isFacebookOrInstagramInAppBrowser } from "@clearcut/auth/truecaller";

import api from "@/api/axios";
import { logAmplitudeEvent, setUserId } from "@/services/analytics";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api`;
const REDIRECT_BASE_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "https://app.clearcutoff.in";

export const {
  AuthProvider,
  useAuth,
  AuthModal,
  useAuthStore,
  useAuthModal,
  InlineAuthFlow,
  authApi,
} = createAuthFeature({
  apiClient: api,
  apiBaseUrl: API_BASE,
  redirectBaseUrl: REDIRECT_BASE_URL,
  onEvent: logAmplitudeEvent,
  onIdentify: setUserId,
  // Facebook/Instagram's in-app browser is how most ad traffic arrives —
  // never auto-redirect it into the dashboard even with a valid session,
  // since the silent window.location.replace + sandboxed-webview
  // combination is exactly where this is most likely to misbehave.
  shouldSkipRedirect: isFacebookOrInstagramInAppBrowser,
});
