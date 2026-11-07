import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DemoHost from "@/components/features/motion-preview/DemoHost";

// Dev/QA-only frame for the "Onboarding" and "Enrollment" tabs of the motion gallery: the gallery embeds this page in an
// <iframe> so the real app screens run at their true phone / desktop breakpoints. Same guard as /animation-preview.
export const metadata: Metadata = {
  title: "Motion preview frame",
  robots: { index: false, follow: false },
};

export default async function AnimationPreviewDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ flow: string }>;
  searchParams: Promise<{ speed?: string }>;
}) {
  const enabled =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_MOTION_PREVIEW === "true";
  const { flow } = await params;
  if (!enabled || (flow !== "onboarding" && flow !== "enrollment")) notFound();
  const { speed } = await searchParams;
  return <DemoHost flow={flow} slowData={speed === "slow"} />;
}
