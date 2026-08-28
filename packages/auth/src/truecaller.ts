"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthApi, TruecallerStatusResponseData } from "./api";

export type TruecallerLoginState =
  | "idle"
  | "opening" // deep link just triggered, checking whether the OS handed off to the app
  | "waiting" // handed off — polling for the user's in-app approval
  | "success"
  | "error"
  | "unavailable"; // deep link didn't open anything within the grace window, Truecaller app is likely not installed on this device

const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 90_000;
// If the page is still visible this long after triggering the deep link,
// the Truecaller app almost certainly isn't installed — there's no reliable
// JS API to detect app installation ahead of time, so this timeout is the
// standard fallback signal (mirrors how most "open app or show fallback"
// deep-link integrations work).
const APP_OPEN_GRACE_MS = 1500;

export interface TruecallerLoginResult {
  token: string;
  hasCourse: boolean;
  user: unknown;
}

/**
 * Truecaller "verify profile" login: initiate → deep-link → poll. Web
 * counterpart of AuthController::truecallerInitiate/Login/Status on the
 * backend (see that controller's docblock for the full three-step flow and
 * why polling is necessary — Truecaller's own servers call our backend
 * directly, out of band from this browser tab, so there's no way for this
 * tab to be told synchronously when the user approves).
 *
 * Deliberately UI-agnostic — returns state plus a start()/reset() pair so
 * any screen (today: StartAuthForm on /start; later: the shared login
 * modal, InlineAuthFlow, anywhere else) can render its own button/spinner/
 * fallback copy around it without duplicating this logic.
 */
export function useTruecallerLogin(
  authApi: Pick<AuthApi, "truecallerInitiate" | "truecallerStatus">,
  onSuccess: (result: TruecallerLoginResult) => void,
) {
  const [state, setState] = useState<TruecallerLoginState>("idle");
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (appOpenTimerRef.current) clearTimeout(appOpenTimerRef.current);
    if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    pollTimerRef.current = null;
    appOpenTimerRef.current = null;
    maxWaitTimerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setState("idle");
    setError(null);
  }, [clearTimers]);

  // Stop all timers if the consuming component unmounts mid-flow (e.g. the
  // user navigates away while waiting for approval).
  useEffect(() => () => clearTimers(), [clearTimers]);

  const start = useCallback(async () => {
    clearTimers();
    setError(null);
    setState("opening");

    try {
      const initiateRes = await authApi.truecallerInitiate();
      const { request_nonce, deep_link } = initiateRes.data.data;

      // Opening the deep link is what hands off to the Truecaller app. If
      // it's not installed, this is a silent no-op in the browser — no
      // error to catch — which is exactly why the grace-period check below
      // exists as the only available signal.
      window.location.href = deep_link;

      appOpenTimerRef.current = setTimeout(() => {
        if (document.visibilityState === "visible") {
          // Soften the UI to "probably not installed" WITHOUT stopping the
          // poll/max-wait timers below. This is a heuristic, not a
          // certainty — some browsers show an "Open in app?" interstitial
          // before actually switching, so the page can still read as
          // "visible" even though the user goes on to approve in Truecaller
          // a moment later. Truecaller's server calls our backend directly,
          // independent of this tab, so if polling had already been killed
          // here, that later approval would complete server-side with
          // nobody left listening for it — exactly the "record created but
          // never redirected" symptom.
          setState("unavailable");
        }
      }, APP_OPEN_GRACE_MS);

      maxWaitTimerRef.current = setTimeout(() => {
        clearTimers();
        setState("error");
        setError("Truecaller login timed out. Please try again.");
      }, MAX_WAIT_MS);

      pollTimerRef.current = setInterval(async () => {
        try {
          const statusRes = await authApi.truecallerStatus(request_nonce);
          const data: TruecallerStatusResponseData = statusRes.data.data;

          if (data.status === "pending") return;

          clearTimers();

          if (data.status === "success" && data.token) {
            setState("success");
            onSuccessRef.current({
              token: data.token,
              hasCourse: Boolean(data.has_course),
              user: data.user,
            });
            return;
          }

          setState("error");
          setError(
            data.error
              ? data.error
              : data.status === "expired"
                ? "Truecaller login expired. Please try again."
                : "Truecaller login failed. Please try again.",
          );
        } catch {
          // A single failed poll shouldn't kill the whole flow — network
          // blips are common on mobile; let it retry on the next tick, the
          // max-wait timer above is the real backstop.
        }
      }, POLL_INTERVAL_MS);

      setState("waiting");
    } catch {
      clearTimers();
      setState("error");
      setError("Couldn't start Truecaller login. Please try again.");
    }
  }, [authApi, clearTimers]);

  return { state, error, start, reset };
}

export type TruecallerAvailability = "checking" | "available" | "unavailable";

// The exact scheme Truecaller's own app registers on the device (see
// AuthController::truecallerInitiate's docblock link to Truecaller's docs).
// No nonce/partner key needed here — this is a presence probe, not a real
// login attempt, so it deliberately does NOT call truecallerInitiate() (that
// would mint a real backend nonce and cache entry for every random tap on
// the page, not just an actual "Login with Truecaller" click).
const TRUECALLER_SCHEME_PROBE = "truecallersdk://truesdk/web_verify";

// Deliberately much longer than useTruecallerLogin's APP_OPEN_GRACE_MS
// (1500ms). That constant times a *reactive* check after a real "Login with
// Truecaller" click, where the OS typically switches apps near-instantly.
// This ambient, first-touch probe is different: on many devices/browsers
// (notably iOS Safari) navigating to an unregistered-looking custom scheme
// surfaces a native "Open in Truecaller?" confirmation dialog first, which
// waits on the user to notice and tap it — routinely well past 1500ms. Using
// the short constant here made the probe settle "unavailable" (permanently,
// via hasRunRef below) before that dialog was ever answered, hiding the
// button on devices that DO have Truecaller installed.
const AVAILABILITY_PROBE_GRACE_MS = 6000;

/**
 * Detects whether the Truecaller app is installed on this device, so the
 * button can be hidden entirely for users who don't have it instead of
 * showing it and only failing after a click (see TruecallerLoginState's
 * "unavailable", the reactive fallback this complements).
 *
 * There is no direct "is this app installed" browser API — iOS and most
 * modern Android browsers deliberately removed that (privacy). The only
 * available signal is the same one useTruecallerLogin's grace-period check
 * already relies on: attempt the deep link and see whether the OS hands the
 * tab off to the app (page becomes hidden) within a short window. Because
 * that attempt is itself the detection mechanism, IF Truecaller is
 * installed, the very first tap/touch anywhere on the page will briefly
 * switch away to it — an unavoidable trade-off of doing this proactively
 * rather than only after the user taps "Login with Truecaller" (flagged in
 * the PR description, not silently hidden).
 *
 * Runs once, on the user's first interaction with the page — not on mount —
 * for two reasons: (1) most browsers only allow navigating to a custom URL
 * scheme as the direct result of a real user gesture (click/touch), a bare
 * `useEffect` firing on mount is silently ignored in Chrome/Android; (2) it
 * avoids an unsolicited app-switch before the user has done anything at all.
 * A tap/scroll on the phone number field a moment after the page loads is
 * enough to trigger it, so the result is ready well before the user reaches
 * the button itself.
 */
export function useTruecallerAvailability(): TruecallerAvailability {
  const [state, setState] = useState<TruecallerAvailability>("checking");
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Truecaller only exists as a phone app — no desktop counterpart to hand
    // off to. Matches the existing `md:hidden` gate on the button itself.
    if (window.matchMedia("(min-width: 768px)").matches) {
      setState("unavailable");
      return;
    }

    const runDetection = () => {
      if (hasRunRef.current) return;
      hasRunRef.current = true;

      let settled = false;
      const finish = (result: TruecallerAvailability) => {
        if (settled) return;
        settled = true;
        document.removeEventListener("visibilitychange", onVisibilityChange);
        clearTimeout(timer);
        setState(result);
      };

      const onVisibilityChange = () => {
        if (document.visibilityState === "hidden") finish("available");
      };

      document.addEventListener("visibilitychange", onVisibilityChange);
      const timer = setTimeout(() => {
        finish(document.visibilityState === "hidden" ? "available" : "unavailable");
      }, AVAILABILITY_PROBE_GRACE_MS);

      window.location.href = TRUECALLER_SCHEME_PROBE;
    };

    document.addEventListener("pointerdown", runDetection, { once: true });
    document.addEventListener("touchstart", runDetection, { once: true, passive: true });

    return () => {
      document.removeEventListener("pointerdown", runDetection);
      document.removeEventListener("touchstart", runDetection);
    };
  }, []);

  return state;
}
