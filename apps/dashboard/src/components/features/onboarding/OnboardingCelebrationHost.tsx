"use client";

import dynamic from "next/dynamic";
import { useOnboardingCelebrationStore } from "@/store/onboarding/useOnboardingCelebrationStore";

// The animation (and the whole @clearcut/motion onboarding bundle) is only fetched when onboarding actually finishes.
const OnboardingCelebration = dynamic(() => import("./OnboardingCelebration"), { ssr: false });

/** Mounted once in the locale layout; renders nothing until the exam step starts the celebration. */
export default function OnboardingCelebrationHost() {
  const active = useOnboardingCelebrationStore((s) => s.celebration !== null);
  return active ? <OnboardingCelebration /> : null;
}
