import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExplanationPreview, { type PreviewSample } from "@/components/features/explanation-preview/ExplanationPreview";
import samples from "./samples.json";

// Dev/QA-only preview of the Correct + Incorrect explanation panel (phase 100).
// Real questions exported from the LOCAL DB into samples.json. Not linked from any flow;
// 404 in production unless NEXT_PUBLIC_ENABLE_MOTION_PREVIEW=true (same gate as /animation-preview).
export const metadata: Metadata = {
  title: "Explanation preview",
  robots: { index: false, follow: false },
};

export default function ExplanationPreviewPage() {
  const enabled =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_MOTION_PREVIEW === "true";
  if (!enabled) notFound();
  return <ExplanationPreview samples={samples as PreviewSample[]} />;
}
