"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Select, SelectOption } from "@clearcut/ui/select";
import PaymentHistoryTable, { PaymentRow } from "./PaymentHistoryTable";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { usePaymentHistory } from "@/hooks/payment/usePaymentHistory";
import SwitchTabLink from "@/components/features/profile/SwitchTabLink";
import type { Tab } from "@/app/[locale]/(protected)/(dashboard)/dashboard/profile/page";
import { ChartSuccessBarIcon, ClipBoardIcon, PaymentCardIcon } from "@/components/ui/icons";

/**
 * Profile → Payments (CC-100): the student's real successful ONE-TIME payments
 * from GET /v2/payment/history (amount in rupees, Razorpay payment id and
 * method when stored). Autopay plans live under Profile → Subscriptions —
 * the two tabs used to list the same one-time purchase twice, so they now
 * split by kind and link to each other.
 *
 * If that endpoint is unavailable (a backend from before it existed), it
 * falls back to the old enrollment-based list, showing only active, paid
 * enrollments — never "₹NaN", "₹0.00" or a "-" placeholder.
 */
export default function PaymentHistoryWrap({ onSwitchTab }: { onSwitchTab?: (tab: Tab) => void }) {
  const t = useTranslations("paymentHistory");
  const intlLocale = `${useLocale()}-IN`;
  const formatAmount = (amount: number) =>
    `₹${amount.toLocaleString(intlLocale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(intlLocale, { day: "2-digit", month: "short", year: "numeric" });

  const history = usePaymentHistory();
  const useFallback = history.isError;
  const { courses, isLoading: coursesLoading } = useMyActiveCourses();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const data: PaymentRow[] = useMemo(() => {
    if (!useFallback) {
      return (history.data?.payments ?? [])
        .filter((p) => p.type === "one_time")
        .map((p) => ({
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

  // The design's three figures are all derivable from the same list — count,
  // sum and the newest paid_at — so none of them needs another request.
  const stats = useMemo(() => {
    const spent = data.reduce((sum, row) => sum + (row.amount ?? 0), 0);
    const latest = data
      .map((row) => row.date)
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1);
    const latestRow = latest ? data.find((row) => row.date === latest) : undefined;
    // "Courses bought" counts courses, not payments: an autopay plan that has
    // charged four times is still one course. A payment with no course on
    // record has nothing to group by, so it counts as its own.
    const courses = new Set(data.map((row) => row.program ?? row.id));
    return { count: courses.size, spent, latestAmount: latestRow?.amount ?? null, latestDate: latest ?? null };
  }, [data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data
      .filter((row) =>
        needle
          ? [row.program, row.paymentId].some((f) => f?.toLowerCase().includes(needle))
          : true,
      )
      .sort((a, b) => {
        const av = a.date ?? "";
        const bv = b.date ?? "";
        return sort === "newest" ? bv.localeCompare(av) : av.localeCompare(bv);
      });
  }, [data, query, sort]);

  const totalItems = filtered.length;
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handlePageSizeChange = useCallback((s: number) => {
    setPageSize(s);
    setPage(1);
  }, []);

  const statCards = [
    { key: "totalPurchases", Icon: ClipBoardIcon, value: String(stats.count), caption: t("coursesBought") },
    { key: "totalSpent", Icon: ChartSuccessBarIcon, value: formatAmount(stats.spent), caption: null },
    {
      key: "lastPayment",
      Icon: PaymentCardIcon,
      value: stats.latestAmount !== null ? formatAmount(stats.latestAmount) : "—",
      caption: stats.latestDate ? formatDate(stats.latestDate) : null,
    },
  ];

  return (
    <div className="w-full">
      <div>
        <p className="heading-large !font-semibold text-surface-gray-normal">{t("paneTitle")}</p>
        <p className="body-small !font-normal text-surface-gray-muted">{t("paneSubtitle")}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {statCards.map(({ key, Icon, value, caption }) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)]">
              <Icon size={20} color="var(--color-brand)" />
            </span>
            <span className="min-w-0">
              <span className="body-small !font-normal block text-surface-gray-muted">
                {t(key as "totalPurchases")}
              </span>
              <span className="heading-medium !font-semibold block truncate text-surface-gray-normal">
                {value}
              </span>
              {caption && (
                <span className="body-small !font-normal block truncate text-surface-gray-muted">
                  {caption}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-blue-400"
          />
        </div>

        {/* The shared Select rather than a native <select>, so it matches the
            rest of the app's styling instead of the browser's. */}
        <div className="sm:w-[170px]">
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectOption value="newest">{t("newestFirst")}</SelectOption>
            <SelectOption value="oldest">{t("oldestFirst")}</SelectOption>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        <PaymentHistoryTable
          data={pageRows}
          totalItems={totalItems}
          page={page}
          pageSize={pageSize}
          loading={history.isLoading || (useFallback && coursesLoading)}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <SwitchTabLink
        className="mt-4"
        hint={t("autopayHint")}
        label={t("autopayLink")}
        onClick={onSwitchTab && (() => onSwitchTab("subscription"))}
      />
    </div>
  );
}
