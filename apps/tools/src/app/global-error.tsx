"use client";

import "./globals.css";
import ErrorPageContent from "@/components/ErrorPageContent";
import { ReportBoundaryError } from "@/components/page-error-reporter";

// Last-resort boundary: replaces the whole document (root layout included) if
// the root layout itself throws, so it supplies <html>/<body>. Reports the
// original error instead of swallowing it.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-text-gray-normal">
        <ReportBoundaryError error={error} boundary="global-error" />
        <ErrorPageContent variant="500" />
      </body>
    </html>
  );
}
