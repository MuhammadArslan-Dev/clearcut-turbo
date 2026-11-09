"use client";

import dynamic from "next/dynamic";
import { useEnrollCelebrationStore } from "@/store/course/useEnrollCelebrationStore";

// The animation (and the @clearcut/motion enrollment bundle) is only fetched when an enrolment actually starts.
const EnrollCelebration = dynamic(() => import("./EnrollCelebration"), { ssr: false });

/** Mounted once in the locale layout; renders nothing until the enrolment modal starts the celebration. */
export default function EnrollCelebrationHost() {
  const active = useEnrollCelebrationStore((s) => s.celebration !== null);
  return active ? <EnrollCelebration /> : null;
}
