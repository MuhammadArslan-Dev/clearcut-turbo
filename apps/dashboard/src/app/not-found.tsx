"use client";

import { useEffect } from "react";
import { logger } from "@/lib/sentry/sentry-logger";
import "../styles/globals.css";
import { Error404Screen } from "@/components/ui/error-screens";

export default function NotFound() {
  useEffect(() => {
    // Breadcrumb only — see [locale]/not-found.tsx for why (expected
    // dead-end navigation, not a defect worth its own Sentry issue).
    logger.breadcrumb("404 - Page Not Found", {
      tags: { type: "not_found" },
      extra: { url: window.location.href },
    });
  }, []);

  return <Error404Screen />;
}
