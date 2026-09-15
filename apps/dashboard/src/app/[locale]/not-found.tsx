"use client";

import { useEffect } from "react";
import { logger } from "@/lib/sentry/sentry-logger";
import { Error404Screen } from "@/components/ui/error-screens";

// Next.js resolves the CLOSEST not-found.tsx to the matched route, and
// nearly every real user-facing route lives under [locale]/... (see the
// root CLAUDE.md) — so this file, not ../not-found.tsx, is what actually
// renders for almost every 404 a real visitor hits.
//
// Breadcrumb only, not warn(): landing on this page is expected behavior
// (Error404Screen renders fine, nothing crashes) — it was previously sent
// as a standalone Sentry issue (CLEARCUTOFF-NEXTJS-APP-2X, 97 events, most
// from ErrorPageLayout's own now-fixed broken /contact /terms /privacy
// /refund links) which just paged on-call for dead-end navigation, not a
// real defect. Still visible as context if a genuinely unexpected error
// fires around the same navigation.
export default function NotFound() {
  useEffect(() => {
    logger.breadcrumb("404 - Page Not Found", {
      tags: { type: "not_found" },
      extra: { url: window.location.href },
    });
  }, []);

  return <Error404Screen />;
}
