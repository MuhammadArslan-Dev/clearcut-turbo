"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Error500Screen } from "@/components/ui/error-screens";

/**
 * Route-segment error boundary. Catches render/effect throws below it and
 * reports them with the route they happened on, so the Sentry issue answers
 * "where" without guesswork.
 */
export default function RouteError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        boundary: "route-error",
        // Matches the digest Next.js logs server-side, so a browser event and
        // a server log line can be tied back to each other.
        digest: error.digest ?? "none",
      },
      extra: {
        digest: error.digest,
        pathname:
          typeof window !== "undefined" ? window.location.pathname : undefined,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
  }, [error]);

  return <Error500Screen />;
}
