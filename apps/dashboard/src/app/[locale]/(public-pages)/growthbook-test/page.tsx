import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GrowthbookTest from "@/components/features/growthbook-test/GrowthbookTest";

// QA-only page for practising GrowthBook targeting by user_id (CC-192, docs/phases/118). Not linked from any flow.
// Hidden (404) in production unless NEXT_PUBLIC_ENABLE_GROWTHBOOK_TEST=true — same pattern as /animation-preview.
export const metadata: Metadata = {
  title: "GrowthBook test",
  robots: { index: false, follow: false },
};

export default function GrowthbookTestPage() {
  const enabled = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_GROWTHBOOK_TEST === "true";
  if (!enabled) notFound();
  return <GrowthbookTest />;
}
