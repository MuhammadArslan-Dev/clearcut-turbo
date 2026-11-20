/**
 * Browser errors that are not ours to fix (CC-112): in-app browsers,
 * extensions and injected scripts. Used as `ignoreErrors` / `denyUrls` in
 * every public app's Sentry init (lib/page-errors.ts). dashboard keeps its own
 * list in src/lib/sentry/sentry-shared.ts — keep the two in step.
 */
export const IGNORE_ERRORS: (string | RegExp)[] = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  // No first-party code uses these; injected by in-app browsers / extensions.
  "speechSynthesis is not defined",
  /webkit\.messageHandlers/,
  // Facebook / Instagram in-app browser bridge scripts.
  "_AutofillCallbackHandler",
  "instantSearchSDKJSBridgeClearHighlight",
  /Java object is gone/,
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,
  // Classic React/browser-extension DOM race (Google Translate and similar mutate nodes React still tracks) on
  // unmount (CLEARCUTOFF-PUBLIC-A/-9/-B on the tools and /start pages). Already ignored in the dashboard's own list;
  // same entry here so the public apps match it.
  "Failed to execute 'removeChild' on 'Node'",
  // Benign pointer-capture race on fast pointerup/pointercancel sequences; not actionable (dashboard ignores it too).
  "Failed to execute 'releasePointerCapture' on 'Element'",
];

/** Third-party scripts we cannot fix and do not want reports from. */
export const DENY_URLS: RegExp[] = [
  /extensions\//i,
  /^chrome(-extension)?:\/\//i,
  /^moz-extension:\/\//i,
  /googletagmanager\.com/i,
  /connect\.facebook\.net/i,
  /clarity\.ms/i,
  /iab_inner_frame/i,
  // Facebook's in-app browser injects `browser_declutter` (its own script);
  // its SyntaxErrors land on our global handler (CLEARCUTOFF-NEXTJS-APP-7K/-AC).
  /browser_declutter/i,
];
