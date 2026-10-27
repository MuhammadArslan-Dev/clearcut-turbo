"use client";

import { useQuery } from "@tanstack/react-query";
import { getPaymentHistory } from "@/lib/payment/payment";

export const PAYMENT_HISTORY_KEY = ["payment-history"];

/**
 * The signed-in student's successful payments (GET /v2/payment/history).
 *
 * Profile → Payments reads it to list charges and total them; Profile →
 * Subscriptions reads it for the one-time purchases and to sum what each course
 * has cost so far. Both used to declare this query themselves, with matching
 * options copied by hand — which only stayed in step by luck. Sharing one
 * definition means the two tabs always read the same cache entry with the same
 * freshness rules, so their totals cannot drift apart.
 */
export function usePaymentHistory() {
  return useQuery({
    queryKey: PAYMENT_HISTORY_KEY,
    queryFn: getPaymentHistory,
    staleTime: 1000 * 60 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
