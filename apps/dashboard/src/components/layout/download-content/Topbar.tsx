// src/components/layout/Topbar.tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@clearcut/ui/button";
import {  ChevronIcon } from "@/components/ui/icons";
import { useRouter } from "@/i18n/navigation";
import Text from "@clearcut/ui/text";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import ContentPageSwitch from "@/components/features/downloadable-content/components/ContentPageSwitch";
import ContentTabsBar from "@/components/features/downloadable-content/components/ContentTabsBar";
import { useTopbarVisibilityStore } from "@/store/dashboard/useTopbarVisibilityStore";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function Topbar() {
  const route = useRouter();
  const t = useTranslations("Sidebar");

  const {exam} = useGetCurrentCourseStore();
  const isMobile = useIsMobile();
  const scrollOffset = useTopbarVisibilityStore((s) => s.offset);
  const setProgress = useTopbarVisibilityStore((s) => s.setProgress);

  // Same clamp-against-own-measured-height technique as preparation's
  // Topbar — see that file's docblock for why (the store's offset is a
  // shared upper bound, not this row's real height).
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

  const clampedOffset =
    isMobile && rowHeight != null ? Math.min(scrollOffset, rowHeight) : 0;

  useEffect(() => {
    setProgress(rowHeight ? clampedOffset / rowHeight : 0);
  }, [clampedOffset, rowHeight, setProgress]);

  return (
    <header className="border-slate-200">
      <div
        style={{
          height: rowHeight != null ? rowHeight - clampedOffset : "auto",
          opacity: rowHeight ? 1 - clampedOffset / rowHeight : 1,
        }}
        className="w-full overflow-hidden bg-white"
      >
        <div
          ref={titleRowRef}
          style={{ transform: `translateY(${-clampedOffset}px)` }}
          className="h-auto flex flex-col lg:flex-row lg:gap-3 items-center justify-between"
        >
          <div className="flex items-center justify-between w-full md:gap-10 px-3 py-2 lg:px-3">
            <div className="flex gap-3 md:gap-10 items-center">
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
                onClick={() => route.push("/dashboard")}
              >
                <ChevronIcon variant="left" size={16} color="#192839" />
              </Button>
              <div>
                <Text
                  as="h2"
                  variant="heading-small"
                  weight="semibold"
                  color="gray-normal"
                >
                  {exam?.short_name} Exam
                </Text>
              </div>
            </div>

            <div>
              <ContentPageSwitch />
            </div>
          </div>
        </div>
      </div>

      {/* Always visible — part of the SAME sticky header box as the row
          above (not its own independently-sticky element), so it never
          drifts out of sync while that row is mid-collapse. Mirrors
          preparation's Topbar, where PaperSwitch/SectionsTab live in the
          non-collapsing half of the same header for the same reason. */}
      <ContentTabsBar />
    </header>
  );
}
