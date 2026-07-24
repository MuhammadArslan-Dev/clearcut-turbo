"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Error500Screen } from "@/components/ui/error-screens";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <Error500Screen />;
}
