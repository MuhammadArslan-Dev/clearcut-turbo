// Decides what to do about a page-level 404, and builds the Sentry payload.
//
// Same policy as apps/dashboard/src/lib/sentry/report-not-found.ts, but pure
// (no Sentry import, no globals) so blog/landing/tools — which each bundle a
// different Sentry SDK version, and load it lazily only when a page error
// actually happens — share ONE implementation and it is unit-testable.
//
// A blanket "capture every 404" paged on-call with dead-end navigation and
// scanner noise; "breadcrumb only" hid real broken links entirely. So:
//
//   in-app navigation → 404      our own link/router.push is wrong   → warning
//   hard load, same-site referrer                                     → warning
//   hard load, external referrer  a broken inbound link / old URL     → info
//   hard load, no referrer        typed URL, bookmark, in-app browser → ignore
//   scanner-style paths (/wp-login.php, /.env …)                      → ignore
//
// 404 pages render in the browser, so JS-less bots probing random paths never
// reach this at all.

import { redactUrl } from "./redact";

const SCANNER_PATH =
  /(^|\/)(wp-[a-z-]+|xmlrpc|phpmyadmin|cgi-bin|\.env|\.git|\.aws|\.ds_store)(\/|$|\.)|\.(php|asp|aspx|jsp|cgi|sql|bak|zip|tar|gz)$/i;

export type NotFoundSource = "in-app-navigation" | "same-site-referrer" | "external-referrer" | "no-referrer";

export type NotFoundEnvironment = {
  /** window.location.href */
  href: string;
  /** document.referrer */
  referrer: string;
  /** URL of the document that was actually loaded (PerformanceNavigationTiming.name), if known. */
  loadedUrl?: string | null;
};

export type NotFoundOptions = {
  env: NotFoundEnvironment;
  /** Locale prefixes the app routes on, e.g. ["en", "hi", "mr"]. */
  locales: readonly string[];
  defaultLocale: string;
  /** Extra path prefixes to strip before locale detection (e.g. tools' "/tools"). */
  ignorePrefixes?: readonly string[];
};

export type NotFoundReport =
  | { action: "ignore"; reason: "scanner" | "no-referrer" }
  | {
      action: "capture";
      level: "warning" | "info";
      message: string;
      /** Groups one broken link into one Sentry issue however many users hit it. */
      fingerprint: string[];
      tags: Record<string, string>;
      context: Record<string, unknown>;
      /** Dedupe key: one report per path per session. */
      dedupeKey: string;
    };

/** Groups /courses/123 and /x/<uuid> under one issue per route shape. */
export function routeShape(pathname: string): string {
  return pathname
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ":uuid")
    .replace(/\/\d+(?=\/|$)/g, "/:id")
    .replace(/\/[0-9a-f]{10,}(?=\/|$)/gi, "/:hash");
}

export function detectNotFoundSource(env: NotFoundEnvironment): { source: NotFoundSource; referrer: string | null } {
  const url = new URL(env.href);

  // If the document that was loaded is a different page from the one now
  // showing, the user got here by client-side navigation — a Link/router.push
  // in our own code. document.referrer does NOT update on those.
  if (env.loadedUrl) {
    try {
      if (new URL(env.loadedUrl).pathname !== url.pathname) return { source: "in-app-navigation", referrer: null };
    } catch {
      /* fall through to referrer detection */
    }
  }

  if (!env.referrer) return { source: "no-referrer", referrer: null };
  try {
    const ref = new URL(env.referrer);
    return ref.origin === url.origin
      ? { source: "same-site-referrer", referrer: ref.pathname }
      : { source: "external-referrer", referrer: ref.hostname };
  } catch {
    return { source: "no-referrer", referrer: null };
  }
}

export function classifyNotFound({ env, locales, defaultLocale, ignorePrefixes = [] }: NotFoundOptions): NotFoundReport {
  const url = new URL(env.href);
  const { pathname, search } = url;

  if (SCANNER_PATH.test(pathname)) return { action: "ignore", reason: "scanner" };

  const { source, referrer } = detectNotFoundSource(env);
  if (source === "no-referrer") return { action: "ignore", reason: "no-referrer" };

  // Tools' public URLs are /hi/tools/… and /mr/tools/… (physically
  // /tools/hi/… in dev); dropping the shared prefix makes the locale the first
  // meaningful segment in both shapes.
  const segments = pathname.split("/").filter((s) => Boolean(s) && !ignorePrefixes.includes(s));
  const locale = locales.includes(segments[0]) ? segments[0] : defaultLocale;

  const shape = routeShape(pathname);
  return {
    action: "capture",
    level: source === "external-referrer" ? "info" : "warning",
    message: `404 Not Found: ${shape}`,
    fingerprint: ["not-found", shape, source],
    tags: { type: "not_found", not_found_source: source, locale },
    dedupeKey: pathname,
    context: {
      pathname,
      routeShape: shape,
      segments,
      locale,
      source,
      // Path only for same-site, hostname only for external — never a query string.
      referrer,
      queryParams: [...new URLSearchParams(search).keys()],
      url: redactUrl(env.href),
    },
  };
}
