// src/lib/auth.ts
//
// The one place blog wires the shared @clearcut/auth feature to its own
// config (API client, redirect URLs, analytics), matching the same pattern
// used by apps/landing. Every file that needs auth (AuthProvider, AuthModal,
// useAuthStore, authApi, ...) should import from here — never from
// @clearcut/auth directly.
//
// "use client" is required here: this module is reachable from the root
// layout (a Server Component), and createAuthFeature() calls into
// createAuthContext(), which lives in a "use client" file in the package.
"use client";

import { createAuthFeature } from "@clearcut/auth/create-auth-feature";

import api from "@/api/axios";
import { logAmplitudeEvent } from "@/services/analytics";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://apptest.clearcutoff.in/api";
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
});
