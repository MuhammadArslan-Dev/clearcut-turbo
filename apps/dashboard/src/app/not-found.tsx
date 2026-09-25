"use client";

import { useEffect } from "react";
import { reportNotFound } from "@/lib/sentry/report-not-found";
import "../styles/globals.css";
import { Error404Screen } from "@/components/ui/error-screens";

export default function NotFound() {
  useEffect(() => {
    // Only 404s that point at a defect become Sentry events — see
    // report-not-found.ts.
    reportNotFound();
  }, []);

  return <Error404Screen />;
}
