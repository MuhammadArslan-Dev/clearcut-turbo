"use client";

/**
 * Dev/QA only. Runs one of the preview demos inside the gallery's <iframe>. Mirrors the gallery's
 * "Slow motion 0.5x" switch (same origin, so the parent's checkbox is readable) onto this document.
 */
import { useEffect } from "react";
import OnboardingDemo from "./OnboardingDemo";
import EnrollmentDemo from "./EnrollmentDemo";

export default function DemoHost({ flow, slowData }: { flow: "onboarding" | "enrollment"; slowData: boolean }) {
  useEffect(() => {
    const id = setInterval(() => {
      let rate = 1;
      try {
        const box = window.parent !== window ? (window.parent.document.getElementById("slow") as HTMLInputElement | null) : null;
        if (box?.checked) rate = 0.5;
      } catch {
        /* cross-origin parent: leave at 1 */
      }
      document.getAnimations().forEach((a) => {
        if (a.playbackRate !== rate) a.playbackRate = rate;
      });
    }, 80);
    return () => clearInterval(id);
  }, []);

  return flow === "onboarding" ? <OnboardingDemo slowData={slowData} /> : <EnrollmentDemo slowData={slowData} />;
}
