// Base URL for this app's own origin, used for the handful of places that
// build an absolute redirect URL back into it (onboarding's post-purchase
// `window.location.href` hard-reload) instead of a relative `router.push`.
// Env-driven so staging can point at its own dashboard host instead of
// bouncing users to production; falls back to the production domain so
// nothing breaks where the env var isn't set (matches the same
// env-with-static-fallback pattern as NEXT_PUBLIC_LARAVEL_MAIN_BACKEND in
// lib/api/client.ts).
export const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://app.clearcutoff.in";
