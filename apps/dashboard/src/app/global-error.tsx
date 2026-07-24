"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import "../styles/globals.css";
import { Error500Screen } from "@/components/ui/error-screens";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <Error500Screen />
      </body>
    </html>
  );
}
