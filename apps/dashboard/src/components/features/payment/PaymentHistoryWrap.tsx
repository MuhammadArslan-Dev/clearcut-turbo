"use client";

import React, { useMemo, useState, useCallback } from "react";
import PaymentHistoryTable, { PaymentRow } from "./PaymentHistoryTable";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DrawerSheet } from "@/components/modals/modals-bottom-sheet";
import { useResponsiveTabs } from "@/hooks/navigation/useResponsiveTabs";
import { MobileBackButton } from "@/components/ui/button/mobile-back-button";
import { AnimatePresence } from "framer-motion";

export default function PaymentHistoryWrap() {
  const isMobile = useIsMobile();
  const { courses, isLoading } = useMyActiveCourses();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  /* -------------------------------------------------
     DERIVED DATA (NO STATE, NO EFFECT)
  -------------------------------------------------- */
  const data: PaymentRow[] = useMemo(() => {
    const allCourses = courses?.courses ?? [];

    return allCourses.map((item) => {
      let status: PaymentRow["status"];

      switch (item.status) {
        case "active":
          status = "active";
          break;
        case "trial":
          status = "trial";
          break;
        case "trial_end":
          status = "trial-ended";
          break;
        default:
          status = "expired";
      }

      return {
        id: item.uuid,
        date: item.enrolled_at
          ? new Date(item.enrolled_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "--",
        program: item.exam?.short_name ?? "—",
        status,
        amount: Number(item.exam?.price ?? 0),
        paymentMethod: "-",
        invoiceUrl: null,
      };
    });
  }, [courses]);

  const totalItems = data.length;

  /* -------------------------------------------------
     STABLE HANDLERS
  -------------------------------------------------- */
  const handlePageChange = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handlePageSizeChange = useCallback((s: number) => {
    setPageSize(s);
    setPage(1);
  }, []);
  type Tab = "profile" | "payment";

  const { activeTab, handleTabChange, handleBack } = useResponsiveTabs<Tab>({
    defaultTab: "profile",
    queryKey: "tab",
  });

  const table = (
    <PaymentHistoryTable
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      loading={isLoading}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  );

  return (
    table
  )  
}
