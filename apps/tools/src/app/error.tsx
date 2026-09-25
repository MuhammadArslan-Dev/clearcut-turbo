"use client";

import ErrorPageContent from "@/components/ErrorPageContent";
import { ReportBoundaryError } from "@/components/page-error-reporter";

// Route-segment boundary for a crash while rendering a page. Reports the
// original error (with digest, pathname, redacted URL) instead of swallowing it.
export default function RouteError({ error }: { error: Error & { digest?: string } }) {
  return (
    <>
      <ReportBoundaryError error={error} boundary="route-error" />
      <ErrorPageContent variant="500" />
    </>
  );
}
