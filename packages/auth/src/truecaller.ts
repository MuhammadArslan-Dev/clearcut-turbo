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
