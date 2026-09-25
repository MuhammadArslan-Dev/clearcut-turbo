"use client";

import { useEffect } from "react";
import { reportBoundaryError, reportNotFound } from "@/lib/page-errors";

/** Mounted in not-found.tsx: reports the 404 from the browser (only ones that point at a defect). */
export function ReportNotFound() {
  useEffect(() => {
    reportNotFound();
  }, []);
  return null;
}

/** Reports the original error thrown into an error boundary (never swallows it). */
export function ReportBoundaryError({
  error,
  boundary,
}: {
  error: Error & { digest?: string };
  boundary: "route-error" | "global-error";
}) {
  useEffect(() => {
    reportBoundaryError(error, boundary);
  }, [error, boundary]);
  return null;
}
