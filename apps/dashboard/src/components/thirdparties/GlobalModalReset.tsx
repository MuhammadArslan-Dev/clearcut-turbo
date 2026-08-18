"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCourseStore } from "@/store/course/useCourseStore";
import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { useTestSeriesModalStore } from "@/components/features/test-series/store/useTestSeriesModalStore";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";

/**
 * Modal-open state lives in global Zustand stores, which survive client-side
 * navigation. If a user leaves a page without the modal calling its own
 * close() (e.g. a CTA inside the modal does router.push() straight to
 * another page instead of closing first, or they hit the browser back/
 * forward button), the store's isOpen stays true forever. The next time
 * whatever screen renders that same modal component remounts — including
 * navigating back to the original page — it reopens itself, because the
 * component only ever reads "is the store open", not "did the user just
 * open me". Concretely: pick a level in the onboarding modal → go to
 * preparation → open the locked-content modal → go to payment → hit back →
 * the *onboarding* modal reappears, because its store was never told to
 * close.
 *
 * Fired once per pathname change from a single app-wide place (mounted in
 * the root layout) rather than per-shell, since the stale-modal problem can
 * happen between ANY two pages, not just within one shell.
 */
export default function GlobalModalReset() {
  const pathname = usePathname();

  useEffect(() => {
    useCourseStore.getState().close();
    usePaywallsStore.getState().close();
    usePreparationModalStore.getState().reset();
    useTestSeriesModalStore.getState().reset();
    useExamModalStore.getState().reset();
  }, [pathname]);

  return null;
}
