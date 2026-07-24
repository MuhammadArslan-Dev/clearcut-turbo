"use client";

import { useEffect } from "react";
import { logger } from "@/lib/sentry/sentry-logger";
import "../styles/globals.css";
import { Error404Screen } from "@/components/ui/error-screens";

export default function NotFound() {
  useEffect(() => {
    logger.warn("404 - Page Not Found", {
      tags: { type: "not_found" },
      extra: { url: window.location.href },
    });
  }, []);

  return <Error404Screen />;
}
