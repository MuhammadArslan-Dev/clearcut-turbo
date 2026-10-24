import { analyticsAllowedHere } from "@clearcut/utils/analytics-hosts";

/**
 * The Sentry project of the public, no-login sites — landing, blog and tools
 * all report into `clearcutoff-public` and tell themselves apart with the
 * `app` tag. (The dashboard has its own project, clearcutoff-nextjs-app.)
 *
 * A DSN is public by design (it ships in the browser bundle), so it lives
 * here instead of in three hosts' env settings (Coolify, Vercel, the tools
 * build). NEXT_PUBLIC_SENTRY_DSN, when set at build, still wins.
 */
export const PUBLIC_SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://8b7ddf87c52c0797bb0085f53697d696@o4508801367015424.ingest.de.sentry.io/4512311041392720";

/**
 * Browser: report only from the real sites (the CC-94 host list), so
 * localhost, maintest and preview URLs never reach the project. The same
 * per-browser opt-in as analytics turns it on elsewhere for a test:
 * localStorage.setItem("cc-analytics-local", "1").
 */
export const publicSentryAllowedHere = analyticsAllowedHere;

/** Server/edge: production builds only (`next dev` never reports). */
export const PUBLIC_SENTRY_SERVER_ENABLED = process.env.NODE_ENV === "production";
