import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionPreview } from "@clearcut/motion/preview";
import MiniTestDemo from "@/components/features/motion-preview/MiniTestDemo";
import FlowFrame from "@/components/features/motion-preview/FlowFrame";

// Dev/QA-only gallery of the motion library (@clearcut/motion). Not linked from any flow.
// Hidden (404) in production unless NEXT_PUBLIC_ENABLE_MOTION_PREVIEW=true — set it on a
// staging/preview build to test on real phones. See docs/phases/79-motion-library-animations.md.
export const metadata: Metadata = {
  title: "Motion preview",
  robots: { index: false, follow: false },
};

export default function AnimationPreviewPage() {
  const enabled =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_MOTION_PREVIEW === "true";
  if (!enabled) notFound();
  // The "Mini test", "Onboarding" and "Enrollment" tabs show the app's own screens with only the library's animations.
  return (
    <MotionPreview
      slots={{
        "mini-test": <MiniTestDemo />,
        onboarding: <FlowFrame flow="onboarding" />,
        enrollment: <FlowFrame flow="enrollment" />,
      }}
    />
  );
}
