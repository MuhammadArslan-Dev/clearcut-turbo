"use client";

import ErrorContent from "@/components/error-content";
import { ReportBoundaryError } from "@/components/page-error-reporter";

// Route-segment boundary for everything under [locale]. Reports the original
// error (with digest, pathname, redacted URL) instead of swallowing it.
export default function RouteError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="min-h-screen w-full flex justify-center items-center">
      <ReportBoundaryError error={error} boundary="route-error" />
      <ErrorContent />
    </div>
  );
}
