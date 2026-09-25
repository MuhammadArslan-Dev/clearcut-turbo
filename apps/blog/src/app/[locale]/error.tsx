"use client";

import ErrorPage from "@/components/error-page";
import { ReportBoundaryError } from "@/components/page-error-reporter";

// Route-segment boundary for everything under [locale]. Reports the original
// error (with digest, pathname, redacted URL) instead of swallowing it.
export default function RouteError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <ReportBoundaryError error={error} boundary="route-error" />
      <ErrorPage variant="500" />
    </div>
  );
}
