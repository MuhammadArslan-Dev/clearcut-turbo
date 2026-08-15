// src/components/layout/Topbar.tsx
"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  const topbarVisible = useTopbarVisibilityStore((s) => s.visible);

  /* ================= DERIVED DATA ================= */

  const examTitle = exam?.short_name ? `${exam?.short_name ?? ""} Exam` : "";
  // Desktop always shows this row; mobile hides/shows it based on the
  // chapter list's scroll direction (see Sidebar.tsx).
  const showTitleRow = !isMobile || topbarVisible;

  /* ================= UI ================= */

  return (
    <header className="border-slate-200">
      <div className="h-auto bg-white flex flex-col lg:flex-row lg:gap-3 items-center justify-between rounded-md">
        {/* LEFT SECTION */}
        <AnimatePresence initial={false}>
          {showTitleRow && (
            <motion.div
              key="topbar-title-row"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex items-center justify-between md:justify-start w-full md:gap-10 px-3 py-2 lg:p-0 lg:pl-3 overflow-hidden"
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
            </motion.div>
          )}
        </AnimatePresence>

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
