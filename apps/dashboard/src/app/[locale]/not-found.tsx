"use client";

import { useEffect } from "react";
import { reportNotFound } from "@/lib/sentry/report-not-found";
import { Error404Screen } from "@/components/ui/error-screens";

// Next.js resolves the CLOSEST not-found.tsx to the matched route, and
// nearly every real user-facing route lives under [locale]/... (see the
// root CLAUDE.md) — so this file, not ../not-found.tsx, is what actually
// renders for almost every 404 a real visitor hits.
//
// Not every 404 is a Sentry issue: a blanket capture paged on-call for
// dead-end navigation (CLEARCUTOFF-NEXTJS-APP-2X, 97 events, mostly
// ErrorPageLayout's own now-fixed broken links), but breadcrumb-only hid real
// broken links entirely. reportNotFound() reports the ones that point at a
// defect (our own link led here, same-site referrer, external inbound link)
// with route/locale/referrer context, and keeps typed/bookmarked URLs as a
// breadcrumb — see report-not-found.ts for the exact rules.
export default function NotFound() {
  useEffect(() => {
    reportNotFound();
  }, []);

  return <Error404Screen />;
}
