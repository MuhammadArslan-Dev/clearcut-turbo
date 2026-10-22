"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import PaymentHistoryTable, { PaymentRow } from "./PaymentHistoryTable";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { getPaymentHistory } from "@/lib/payment/payment";

/**
 * Profile → Payments (CC-100): the student's real successful payments from
 * GET /v2/payment/history (one-time purchases and autopay charges, amount in
 * rupees, Razorpay payment id and method when stored).
 *
 * If that endpoint is unavailable (a backend from before it existed), it
 * falls back to the old enrollment-based list, showing only active, paid
 * enrollments — never "₹NaN", "₹0.00" or a "-" placeholder.
 */
export default function PaymentHistoryWrap() {
  const history = useQuery({
    queryKey: ["payment-history"],
    queryFn: getPaymentHistory,
    staleTime: 1000 * 60 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const useFallback = history.isError;
  const { courses, isLoading: coursesLoading } = useMyActiveCourses();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const data: PaymentRow[] = useMemo(() => {
    if (!useFallback) {
      return (history.data?.payments ?? []).map((p) => ({
        id: p.id,
        date: p.paid_at,
        program: p.course?.short_name ?? p.course?.name ?? null,
        kind: p.type,
        amount: Number.isFinite(p.amount) ? p.amount : null,
        method: p.method,
        paymentId: p.payment_id,
      }));
    }
    return (courses?.courses ?? [])
      .filter((item) => item.status === "active" && Number(item.price) > 0)
      .map((item) => ({
        id: item.uuid,
        date: item.enrolled_at ?? null,
        program: item.exam?.short_name ?? null,
        kind: null,
        amount: Number(item.price),
        method: null,
        paymentId: null,
      }));
  }, [useFallback, history.data, courses]);

  const totalItems = data.length;
  const pageRows = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize],
  );

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handlePageSizeChange = useCallback((s: number) => {
    setPageSize(s);
    setPage(1);
  }, []);

  return (
    <PaymentHistoryTable
      data={pageRows}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      loading={history.isLoading || (useFallback && coursesLoading)}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  );
}
