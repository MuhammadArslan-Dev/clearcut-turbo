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

// Facebook's and Instagram's in-app browsers routinely destroy this page's
// entire JS context the moment `window.location.href = deep_link` hands off
// to Truecaller, rather than just backgrounding the tab — so the poll
// interval below, which lives only in memory, never gets to resume when the
// user comes back (they land on a freshly-loaded page in "idle" state, even
// though their approval may already be sitting on the backend waiting to be
// picked up). Persisting the nonce the moment it's minted, and checking for
// one on every mount, lets a fresh page instance pick the same poll back up
// automatically instead of requiring the user to notice nothing happened and
// tap the button a second time.
const PENDING_NONCE_KEY = "truecaller_pending_nonce";

interface PendingNonce {
  nonce: string;
  startedAt: number;
}

function readPendingNonce(): PendingNonce | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_NONCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingNonce>;
    if (typeof parsed.nonce !== "string" || typeof parsed.startedAt !== "number") return null;
    // Older than the max wait window is definitely stale (that attempt would
    // already have timed out server-side too) — treat it as nothing pending
    // rather than resuming a poll that can only ever come back "expired".
    if (Date.now() - parsed.startedAt > MAX_WAIT_MS) return null;
    return parsed as PendingNonce;
  } catch {
    return null;
  }
}

function writePendingNonce(nonce: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_NONCE_KEY, JSON.stringify({ nonce, startedAt: Date.now() }));
}

function clearPendingNonce(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_NONCE_KEY);
}

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
    clearPendingNonce();
    setState("idle");
    setError(null);
  }, [clearTimers]);

  // Stop all timers if the consuming component unmounts mid-flow (e.g. the
  // user navigates away while waiting for approval).
  useEffect(() => () => clearTimers(), [clearTimers]);

  // Shared between a fresh start() and resuming a pending nonce found on
  // mount below — both just need to poll truecallerStatus until it settles.
  const pollForResult = useCallback(
    (requestNonce: string, remainingMs: number) => {
      maxWaitTimerRef.current = setTimeout(() => {
        clearTimers();
        clearPendingNonce();
        setState("error");
        setError("Truecaller login timed out. Please try again.");
      }, remainingMs);

      pollTimerRef.current = setInterval(async () => {
        try {
          const statusRes = await authApi.truecallerStatus(requestNonce);
          const data: TruecallerStatusResponseData = statusRes.data.data;

          if (data.status === "pending") return;

          clearTimers();
          clearPendingNonce();

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
    },
    [authApi, clearTimers],
  );

  // On mount, pick back up a poll a PREVIOUS instance of this hook started
  // and never got to finish — see PENDING_NONCE_KEY's comment for why this
  // happens (Facebook/Instagram in-app browsers tearing down the JS context
  // on handoff). Runs once; if nothing's pending this is a no-op.
  useEffect(() => {
    const pending = readPendingNonce();
    if (!pending) return;

    setState("waiting");
    const remainingMs = Math.max(MAX_WAIT_MS - (Date.now() - pending.startedAt), POLL_INTERVAL_MS);
    pollForResult(pending.nonce, remainingMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    clearTimers();
    clearPendingNonce();
    setError(null);
    setState("opening");

    try {
      const initiateRes = await authApi.truecallerInitiate();
      const { request_nonce, deep_link } = initiateRes.data.data;
      writePendingNonce(request_nonce);

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

      pollForResult(request_nonce, MAX_WAIT_MS);
      setState("waiting");
    } catch {
      clearTimers();
      clearPendingNonce();
      setState("error");
      setError("Couldn't start Truecaller login. Please try again.");
    }
  }, [authApi, clearTimers, pollForResult]);

  return { state, error, start, reset };
}

// Facebook's and Instagram's in-app browsers are a special case, not just
// another mobile browser: their embedded WebView is documented to often
// block or silently swallow custom-URL-scheme navigation entirely (the exact
// mechanism this whole feature depends on) and to tear down the page's JS
// context on any app handoff far more aggressively than a normal mobile
// browser — see the multi-signal handling above and the pending-nonce
// resume in useTruecallerLogin, both added to compensate for that and still
// not enough to make the feature reliable there. Rather than continuing to
// patch symptoms of a technique that may not function in this WebView at
// all, detect it directly and skip Truecaller entirely — falling back to
// the always-reliable OTP flow, exactly as if the app just weren't
// installed. `FBAN`/`FBAV`/`FB_IAB`/`FBIOS`/`FB4A` are Facebook's in-app
// browser markers; a literal "Instagram" substring is Instagram's — both are
// the standard, widely-used way sites detect these in-app browsers.
export function isFacebookOrInstagramInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram/i.test(navigator.userAgent || "");
}

export type TruecallerAvailability = "checking" | "available" | "unavailable";

// Persisted across page loads AND across every clearcutoff.in property
// (landing, /go marketing pages, academy.clearcutoff.in) so the detection
// probe below — which unavoidably triggers a real, visible handoff attempt
// the first time it runs (see that function's docblock) — only ever has to
// run ONCE per device, ever, anywhere on the domain. localStorage is the
// fast path for same-origin reads; the cookie is what actually makes it
// cross-subdomain (localStorage is strictly per-origin, so
// academy.clearcutoff.in can't see clearcutoff.in's localStorage no matter
// what — a cookie scoped to the parent domain is the only browser mechanism
// that spans subdomains). Every read checks localStorage first and falls
// back to the cookie, mirroring the cookie's value into localStorage when
// found so the *next* read on that origin is the fast path.
const TRUECALLER_FLAG_KEY = "truecaller_available";
const TRUECALLER_FLAG_COOKIE_DOMAIN = ".clearcutoff.in";
const TRUECALLER_FLAG_MAX_AGE_DAYS = 180;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeDays: number): void {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  // `domain=.clearcutoff.in` doesn't match a `localhost`/preview host — the
  // browser just drops that attribute and the cookie fails to set at all, so
  // it's only added on the real production domain. Local/preview testing
  // still gets a same-origin cookie (no domain attribute), which is enough
  // to verify the caching behavior itself.
  const isProd = window.location.hostname.endsWith("clearcutoff.in");
  const domainPart = isProd ? `; domain=${TRUECALLER_FLAG_COOKIE_DOMAIN}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}${domainPart}; SameSite=Lax`;
}

export function getCachedTruecallerAvailability(): "available" | "unavailable" | null {
  if (typeof window === "undefined") return null;

  const fromLocal = localStorage.getItem(TRUECALLER_FLAG_KEY);
  if (fromLocal === "available" || fromLocal === "unavailable") return fromLocal;

  const fromCookie = readCookie(TRUECALLER_FLAG_KEY);
  if (fromCookie === "available" || fromCookie === "unavailable") {
    localStorage.setItem(TRUECALLER_FLAG_KEY, fromCookie);
    return fromCookie;
  }

  return null;
}

export function setCachedTruecallerAvailability(value: "available" | "unavailable"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRUECALLER_FLAG_KEY, value);
  writeCookie(TRUECALLER_FLAG_KEY, value, TRUECALLER_FLAG_MAX_AGE_DAYS);
}

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
 * modern Android browsers deliberately removed that (privacy: a site could
 * otherwise fingerprint installed apps by probing thousands of schemes). The
 * only available signal is the same one useTruecallerLogin's grace-period
 * check already relies on: attempt the deep link and see whether the OS
 * hands the tab off to the app (page becomes hidden) within a grace window.
 * Because that attempt IS the detection mechanism, if Truecaller is
 * installed, triggering it will briefly switch away to it — an unavoidable
 * trade-off of checking proactively rather than only after the user taps
 * "Login with Truecaller".
 *
 * That trade-off is made acceptable by getCachedTruecallerAvailability /
 * setCachedTruecallerAvailability above: the very first time this resolves
 * on a device (anywhere on clearcutoff.in — landing, /go marketing pages, or
 * academy.clearcutoff.in), the result is cached for 180 days across a cookie
 * + localStorage. Every subsequent mount of this hook, on any of those
 * properties, checks the cache FIRST and returns immediately without ever
 * probing again — so the one unavoidable handoff attempt happens at most
 * once per device, ever, not once per page/session.
 *
 * Listens on scroll/keydown, page-wide — deliberately NOT
 * pointerdown/touchstart/click. Those fire on every tap anywhere on the
 * page, including a tap on an unrelated button, and the scheme-navigation
 * below is a real navigation attempt that some mobile in-app browsers
 * (observed in Instagram's) resolve synchronously enough to delay that SAME
 * click's own handler — which surfaced as "the login modal won't open until
 * Truecaller detection finishes." scroll/keydown never co-occur with a
 * button click, so this can't happen: the probe only fires once the user
 * scrolls the page or starts typing into a field.
 *
 * Doesn't run on mount, and can't be made to: browsers only allow navigating
 * to a custom URL scheme as the direct, synchronous result of a real user
 * gesture — a bare `useEffect` or a `setTimeout` firing after page load is
 * silently ignored in Chrome/Safari/Firefox precisely to stop sites from
 * background-probing installed apps. There is no delay or "run after load"
 * variant of this that still works; the gesture requirement is what makes
 * attaching the listener itself effectively free — it's inert until the
 * first scroll/keypress happens, and skipped entirely once cached.
 */
export function useTruecallerAvailability(): TruecallerAvailability {
  const cached = getCachedTruecallerAvailability();
  const inAppBrowser = isFacebookOrInstagramInAppBrowser();
  const [state, setState] = useState<TruecallerAvailability>(
    inAppBrowser ? "unavailable" : (cached ?? "checking"),
  );
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (inAppBrowser) return; // known-unreliable WebView — never probe here, see isFacebookOrInstagramInAppBrowser's docblock
    if (cached) return; // already resolved on a previous visit — never re-probe

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
      const finish = (result: "available" | "unavailable") => {
        if (settled) return;
        settled = true;
        document.removeEventListener("visibilitychange", onSignal);
        window.removeEventListener("pagehide", onSignal);
        window.removeEventListener("pageshow", onSignal);
        window.removeEventListener("focus", onSignal);
        clearTimeout(timer);
        // Written synchronously so it survives even if this page's JS
        // context gets torn down immediately after (see the note below) —
        // localStorage/cookie writes commit before the handler returns,
        // unlike React state.
        setCachedTruecallerAvailability(result);
        setState(result);
      };

      // Facebook's and Instagram's in-app browsers are known to suspend or
      // fully destroy this page's JS context the moment it hands off to
      // another app, rather than just backgrounding the tab like a normal
      // mobile browser — sometimes without ever dispatching a
      // "visibilitychange to hidden" event this page gets to observe before
      // being torn down. Rather than distinguishing "went hidden" from
      // "came back", any of these four events firing at all during an
      // in-flight probe is itself sufficient proof some app-switch happened
      // — an uninstalled scheme never leaves the page, so there's nothing to
      // hide from or return from. `pagehide` catches the leaving moment most
      // reliably; `visibilitychange`/`pageshow`/`focus` catch the return,
      // which also covers the case where the leaving transition was missed
      // entirely (page recreated fresh) but this same instance is still the
      // one running when focus comes back.
      const onSignal = () => finish("available");

      document.addEventListener("visibilitychange", onSignal);
      window.addEventListener("pagehide", onSignal);
      window.addEventListener("pageshow", onSignal);
      window.addEventListener("focus", onSignal);

      const timer = setTimeout(() => {
        finish(document.visibilityState === "hidden" ? "available" : "unavailable");
      }, AVAILABILITY_PROBE_GRACE_MS);

      window.location.href = TRUECALLER_SCHEME_PROBE;
    };

    // Deliberately NOT pointerdown/touchstart/click: those fire on EVERY tap
    // anywhere on the page, including a tap on an unrelated button like
    // "Continue Free" — and `window.location.href = TRUECALLER_SCHEME_PROBE`
    // below is a real navigation attempt that some mobile WebViews (observed
    // in Instagram's in-app browser) resolve synchronously enough to delay
    // that SAME click's own handler, which looked like "the login modal
    // won't open until Truecaller detection finishes." scroll/keydown never
    // co-occur with a button click, so they can't cause that conflict — the
    // trade-off is the probe now only fires once the user scrolls the page
    // or starts typing into a field, not on their very first tap.
    const opts = { once: true, passive: true } as const;
    document.addEventListener("keydown", runDetection, opts);
    document.addEventListener("scroll", runDetection, opts);

    return () => {
      document.removeEventListener("keydown", runDetection);
      document.removeEventListener("scroll", runDetection);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
