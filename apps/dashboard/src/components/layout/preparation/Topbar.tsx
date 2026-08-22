// src/components/layout/Topbar.tsx
"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@clearcut/ui/button";

import PageSwitchTab from "@/components/features/preparation/components/PageSwitchTab";
import SectionsTab from "@/components/features/preparation/components/SectionsTab";
import PaperSwitch from "@/components/features/preparation/components/PaperSwitch";

import Text from "@clearcut/ui/text";
import { ChevronIcon } from "@/components/ui/icons";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Link } from "@/i18n/navigation";

/* =========================================================
   TOPBAR — PREPARATION LAYOUT
========================================================= */

export default function Topbar() {
  const { exam } = useGetCurrentCourseStore();
  const isMobile = useIsMobile();
  const scrollOffset = useTopbarVisibilityStore((s) => s.offset);
  const setProgress = useTopbarVisibilityStore((s) => s.setProgress);

  /* ================= DERIVED DATA ================= */

  const examTitle = exam?.short_name ? `${exam?.short_name ?? ""} Exam` : "";

  // Measure the title row's own natural height so the hide can be clamped
  // to exactly that (the store's offset is a shared upper-bound value, not
  // this row's real height, which varies with locale/content).
  const titleRowRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = titleRowRef.current;
    if (!el) return;

    const measure = () => setRowHeight(el.scrollHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Desktop always shows this row in full; mobile clips it 1:1 with how far
  // the user has scrolled the chapter list (see Sidebar.tsx). Before the
  // first measurement, render at natural height so nothing flashes closed.
  const clampedOffset =
    isMobile && rowHeight != null ? Math.min(scrollOffset, rowHeight) : 0;

  // Share "how hidden am I, 0..1" with everything that needs to move in
  // sync with this row — see useTopbarVisibilityStore's `progress` doc.
  useEffect(() => {
    setProgress(rowHeight ? clampedOffset / rowHeight : 0);
  }, [clampedOffset, rowHeight, setProgress]);

  /* ================= UI ================= */

  return (
    <header className="border-slate-200">
      <div className="h-auto bg-white flex flex-col lg:flex-row lg:gap-3 items-center justify-between rounded-md">
        {/* LEFT SECTION */}
        <div
          style={{
            height: rowHeight != null ? rowHeight - clampedOffset : "auto",
            opacity: rowHeight ? 1 - clampedOffset / rowHeight : 1,
          }}
          className="w-full overflow-hidden"
        >
          <div
            ref={titleRowRef}
            style={{ transform: `translateY(${-clampedOffset}px)` }}
            className="flex items-center justify-between md:justify-start w-full md:gap-10 px-3 py-2 lg:p-0 lg:pl-3"
          >
            <div className="flex gap-3 md:gap-10 items-center">
              {/* Back Button */}
              <Link href="/dashboard">
                <Button
                  variant="soft"
                  color="neutral"
                  size="sm"
                  sx={{
                    borderRadius: "50px",
                    padding: "8px 8px",
                    height: "36px",
                    width: "36px",
                  }}
                >
                  <ChevronIcon variant="left" size={16} color="#192839" />
                </Button>
              </Link>

              {/* Exam Title */}
              <div>
                <Text
                  as="h2"
                  variant="heading-small"
                  weight="semibold"
                  color="gray-normal"
                >
                  {examTitle}
                </Text>
              </div>
            </div>

            {/* Page Switch Tabs */}
            <div>
              <PageSwitchTab />
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="md:flex justify-end items-center max-w-[770px] md:bg-[var(--color-brand-dark)] w-full lg:rounded-l-full overflow-hidden">
          {/* Paper Switch (mobile / tablet) */}
          <div className="flex lg:hidden justify-start px-3 ">
            <PaperSwitch />
          </div>

          {/* Sections Tabs */}
          <SectionsTab />
        </div>
      </div>
    </header>
  );
}
