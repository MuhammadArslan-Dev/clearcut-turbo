import type { AxiosInstance } from "axios";

import { createAuthApi } from "./api";
import { createAuthContext } from "./context";
import { createAuthStore } from "./store/auth-store";
import { createAuthModalStore } from "./store/auth-modal-store";
import { createAuthModal } from "./auth-modal";
import { createInlineAuthFlow } from "./screens/inline-auth-flow";
import type { CreateOtpScreenOptions } from "./screens/otp-screen";

export interface CreateAuthFeatureConfig {
  /** The app's own axios instance (see @clearcut/api's createApiClient). */
  apiClient: AxiosInstance;
  /** Full base URL for the AuthProvider's `/v1/me` verify call. */
  apiBaseUrl: string;
  /** Base URL for post-login/verify redirects (dashboard/onboarding app). */
  redirectBaseUrl: string;
  loginRedirectPath?: string;
  logoutRedirectPath?: string;
  verifyTimeoutMs?: number;
  /** Same event names/properties as the original inline logAmplitudeEvent
   * calls — pass your own analytics function to preserve tracking. */
  onEvent?: (name: string, properties?: Record<string, unknown>) => void;
}

/**
 * The single entry point for consuming the complete authentication feature.
 * Wires the API layer, session provider, stores, and every screen together
 * once per app. Usage (in each app, once, e.g. src/lib/auth.ts):
 *
 *   export const { AuthProvider, AuthModal, useAuthStore, InlineAuthFlow } =
 *     createAuthFeature({ apiClient, apiBaseUrl, redirectBaseUrl, onEvent });
 *
 * Then in the root layout: wrap children in <AuthProvider> and render
 * <AuthModal /> once — that's the full login/OTP experience, identical UI
 * and behavior to every other app using this factory.
 *
 * IMPORTANT: put `"use client"` at the top of your own instantiation file
 * (the one that calls createAuthFeature). This factory calls into
 * createAuthContext(), which is a "use client" module — if your file is
 * reachable from a Server Component (e.g. the root layout, which it always
 * is) without its own "use client" directive, Next.js throws at build time
 * ("Attempted to call createAuthContext() from the server...").
 */
export function createAuthFeature(config: CreateAuthFeatureConfig) {
  const authApi = createAuthApi(config.apiClient);

  const { AuthProvider, useAuth } = createAuthContext({
    apiBaseUrl: config.apiBaseUrl,
    redirectBaseUrl: config.redirectBaseUrl,
    loginRedirectPath: config.loginRedirectPath,
    logoutRedirectPath: config.logoutRedirectPath,
    verifyTimeoutMs: config.verifyTimeoutMs,
  });

  const useAuthStore = createAuthStore();
  const useAuthModal = createAuthModalStore();

  const screenDeps: CreateOtpScreenOptions = {
    authApi,
    useAuthStore,
    useAuthModal,
    onEvent: config.onEvent,
    redirectBaseUrl: config.redirectBaseUrl,
  };

  const AuthModal = createAuthModal(screenDeps);
  const InlineAuthFlow = createInlineAuthFlow({
    authApi,
    redirectBaseUrl: config.redirectBaseUrl,
    onEvent: config.onEvent,
  });

  return {
    AuthProvider,
    useAuth,
    AuthModal,
    useAuthStore,
    useAuthModal,
    InlineAuthFlow,
    authApi,
  };
}
