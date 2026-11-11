"use client";

import { useRef, type ReactNode } from "react";
import Topbar from "@/components/layout/testSeries/Topbar";
import BottomPageSwitchReveal from "@/components/features/preparation/components/BottomPageSwitchReveal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTopbarScrollHide } from "@/hooks/useTopbarScrollHide";

const TOPBAR_MAX_HIDE_OFFSET = 150; // same as TestSeriesShell

/**
 * Target tab shell (phase 99): the Test Series topbar without its paper/test
 * switches, one scrolling column, and the same mobile bottom tab mirror.
 */
export default function TargetShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const mainRef = useRef<HTMLElement | null>(null);
  useTopbarScrollHide(mainRef, isMobile, TOPBAR_MAX_HIDE_OFFSET);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Topbar plain />
      <main ref={mainRef} className="flex-1 overflow-y-auto bg-[var(--color-background-gray-subtle)] pb-24 md:pb-8">
        {children}
      </main>
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="flex justify-center items-center w-full">
          <BottomPageSwitchReveal />
        </div>
      </div>
    </div>
  );
}
