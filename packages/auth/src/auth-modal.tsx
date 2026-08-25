"use client";

import dynamic from "next/dynamic";
import { useHydrateStore } from "@clearcut/state/use-hydrate-store";

import type { CreateOtpScreenOptions } from "./screens/otp-screen";

/**
 * 1:1 port of apps/landing's former AuthModals.tsx. Keeps the same
 * `next/dynamic(..., { ssr: false })` code-splitting — LoginScreen/OTPScreen
 * are client-only modal UI that stays out of the initial bundle until the
 * modal actually opens.
 */
export function createAuthModal(deps: CreateOtpScreenOptions) {
  const LoginScreen = dynamic(
    () => import("./screens/login-screen").then((mod) => mod.createLoginScreen(deps)),
    { ssr: false },
  );
  const OTPScreen = dynamic(
    () => import("./screens/otp-screen").then((mod) => mod.createOtpScreen(deps)),
    { ssr: false },
  );

  function AuthModal() {
    const { screen } = deps.useAuthStore();
    // authStore persists `userId` (see store/auth-store.ts) — this is the
    // one always-mounted component (root layout, every app using this
    // factory) where that deferred localStorage read can happen.
    useHydrateStore(deps.useAuthStore);

    return (
      <>
        {screen === "login" && <LoginScreen />}
        {screen === "otp" && <OTPScreen />}
      </>
    );
  }

  return AuthModal;
}
