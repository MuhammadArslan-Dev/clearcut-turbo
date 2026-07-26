// src/components/layout/Topbar.tsx
"use client";

import React from "react";
import { Button } from "@clearcut/ui/button";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";

import PageSwitchTab from "@/components/features/preparation/components/PageSwitchTab";
import TestsSwitch from "@/components/features/test-series/components/TestsSwitch";
import PaperSwitch from "@/components/features/test-series/components/PaperSwitch";

import Text from "@clearcut/ui/text";
import { ChevronIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";

/* =========================================================
   TOPBAR COMPONENT
========================================================= */

export default function Topbar() {
  const { exam } = useGetCurrentCourseStore();

  /* ================= DERIVED DATA ================= */

  const examTitle = exam?.short_name ? `${exam?.short_name ?? ""} Exam` : "";

  /* ================= UI ================= */

  return (
    <header className="border-slate-200">
      <div className="h-auto bg-white flex flex-col lg:flex-row lg:gap-3 items-center justify-between rounded-md">
        {/* LEFT SECTION */}
        <div className="flex items-center justify-between md:justify-start w-full md:gap-10 px-3 py-2 lg:p-0 lg:pl-3">
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

        {/* RIGHT SECTION */}
        <div className="md:flex justify-end items-center max-w-[770px] w-full lg:min-w-[450px] lg:rounded-l-full overflow-hidden">
          {/* Paper Switch (mobile only) */}
          <div className="flex md:hidden justify-start px-3">
            <PaperSwitch />
          </div>

          {/* Tests Switch */}
          <TestsSwitch />
        </div>
      </div>
    </header>
  );
}
