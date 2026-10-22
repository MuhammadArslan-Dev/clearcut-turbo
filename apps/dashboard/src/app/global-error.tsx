"use client";

import { useEffect } from "react";
import { isChunkError, reloadOnce } from "@/components/thirdparties/ChunkErrorReload";
import * as Sentry from "@sentry/nextjs";
import "../styles/globals.css";
import { Error500Screen } from "@/components/ui/error-screens";

/**
 * Last-resort boundary — catches throws from the root layout itself, which the
 * per-route `error.tsx` cannot. Anything landing here took the whole app down,
 * so it is reported at `fatal`.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // A chunk from a previous deploy failed to load: reload once (CC-112).
    if ((isChunkError(error?.message) || error?.name === "ChunkLoadError") && reloadOnce()) return;
    Sentry.captureException(error, {
      level: "fatal",
      tags: {
        boundary: "global-error",
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

  return (
    <html lang="en">
      <body>
        <Error500Screen />
      </body>
    </html>
  );
}
