"use client";

import dynamic from "next/dynamic";

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

    return (
      <>
        {screen === "login" && <LoginScreen />}
        {screen === "otp" && <OTPScreen />}
      </>
    );
  }

  return AuthModal;
}
