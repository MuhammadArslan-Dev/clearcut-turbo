import * as Sentry from "@sentry/nextjs";
import { routing } from "@/i18n/routing";
import { logger } from "./sentry-logger";
import { redactUrl } from "./sentry-shared";

/**
 * Reports a page-level 404 (called from both not-found.tsx files) with enough
 * context to tell WHY it happened — without turning every stray hit into a
 * Sentry issue.
 *
 * History: 404s used to be sent as standalone issues, then were demoted to
 * breadcrumb-only after CLEARCUTOFF-NEXTJS-APP-2X (97 events, mostly the error
 * page's own broken links) paged on-call for dead-end navigation. A breadcrumb
 * with no event is invisible unless an unrelated error follows, so real
 * broken links went completely unnoticed. This keeps the noise out but
 * reports the cases that point at a defect:
 *
 *   in-app navigation → 404      our own link/router.push is wrong   → warning
 *   hard load, same-site referrer                                     → warning
 *   hard load, external referrer  a broken inbound link / old URL     → info
 *   hard load, no referrer        typed URL, bookmark, in-app browser → breadcrumb only
 *   scanner-style paths (/wp-login.php, /.env …)                      → ignored
 *
 * Runs in the browser (not-found renders client-side), so JS-less bots that
 * probe random paths never reach it. One report per path per session.
 */

const SCANNER_PATH =
  /(^|\/)(wp-[a-z-]+|xmlrpc|phpmyadmin|cgi-bin|\.env|\.git|\.aws|\.ds_store)(\/|$|\.)|\.(php|asp|aspx|jsp|cgi|sql|bak|zip|tar|gz)$/i;

const reportedThisSession = new Set<string>();

/** Groups /courses/123 and /x/<uuid> under one Sentry issue per route shape. */
function routeShape(pathname: string): string {
  return pathname
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ":uuid")
    .replace(/\/\d+(?=\/|$)/g, "/:id")
    .replace(/\/[0-9a-f]{10,}(?=\/|$)/gi, "/:hash");
}

type Source = "in-app-navigation" | "same-site-referrer" | "external-referrer" | "no-referrer";

function detectSource(pathname: string): { source: Source; referrer: string | null } {
  // The URL of the document that was actually loaded. If the current path
  // differs, the user got here by client-side navigation (a Link/router.push
  // in our own code) — document.referrer does NOT update on those.
  const nav = performance.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
  let loadedPath: string | null = null;
  try {
    loadedPath = nav ? new URL(nav.name).pathname : null;
  } catch {
    loadedPath = null;
  }
  if (loadedPath && loadedPath !== pathname) return { source: "in-app-navigation", referrer: null };

  if (!document.referrer) return { source: "no-referrer", referrer: null };
  try {
    const ref = new URL(document.referrer);
    return ref.origin === window.location.origin
      ? { source: "same-site-referrer", referrer: ref.pathname }
      : { source: "external-referrer", referrer: ref.hostname };
  } catch {
    return { source: "no-referrer", referrer: null };
  }
}

export function reportNotFound() {
  if (typeof window === "undefined") return;

  const { pathname, search } = window.location;
  if (SCANNER_PATH.test(pathname)) return;

  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const locale = (routing.locales as readonly string[]).includes(firstSegment) ? firstSegment : routing.defaultLocale;
  const { source, referrer } = detectSource(pathname);

  if (source === "no-referrer") {
    logger.breadcrumb("404 - Page Not Found", {
      tags: { type: "not_found" },
      extra: { pathname, locale },
    });
    return;
  }

  if (reportedThisSession.has(pathname)) return;
  reportedThisSession.add(pathname);

  Sentry.withScope((scope) => {
    scope.setLevel(source === "external-referrer" ? "info" : "warning");
    scope.setTags({ type: "not_found", not_found_source: source, locale });
    // One issue per route shape + source, so a single broken link is one
    // issue however many users hit it.
    scope.setFingerprint(["not-found", routeShape(pathname), source]);
    scope.setContext("not_found", {
      pathname,
      routeShape: routeShape(pathname),
      segments: pathname.split("/").filter(Boolean),
      locale,
      source,
      // Path only for same-site, hostname only for external — never a query string.
      referrer,
      queryParams: [...new URLSearchParams(search).keys()],
      url: redactUrl(window.location.href),
    });
    Sentry.captureMessage(`404 Not Found: ${routeShape(pathname)}`);
  });
}
