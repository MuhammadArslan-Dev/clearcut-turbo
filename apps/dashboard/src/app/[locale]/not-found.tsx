"use client";

import { useEffect } from "react";
import { logger } from "@/lib/sentry/sentry-logger";
import { Error404Screen } from "@/components/ui/error-screens";

// Next.js resolves the CLOSEST not-found.tsx to the matched route, and
// nearly every real user-facing route lives under [locale]/... (see the
// root CLAUDE.md) — so this file, not ../not-found.tsx, is what actually
// renders for almost every 404 a real visitor hits. The root one already
// logs to Sentry via logger.warn(); this one didn't, which is why 404s
// weren't showing up there despite that other file looking correct.
export default function NotFound() {
  useEffect(() => {
    logger.warn("404 - Page Not Found", {
      tags: { type: "not_found" },
      extra: { url: window.location.href },
    });
  }, []);

  return <Error404Screen />;
}
