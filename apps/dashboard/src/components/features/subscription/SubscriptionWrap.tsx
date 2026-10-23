"use client";

import React, { memo, useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@clearcut/ui/button";
import {
  getSubscriptions,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  Subscription,
  SubscriptionStatus,
} from "@/lib/payment/payment";
import { CustomBottomSheet } from "@/components/modals/modals-bottom-sheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { trackEvent } from "@/lib/analytics/browser";
import CancelFlowContent, { CancelReason } from "./CancelFlowContent";

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const QUERY_KEY = ["subscriptions"];
const PAGE_SIZE = 5;

type ActionType = "pause" | "resume" | "cancel";

// Status is shown as plain text, not a pill: it isn't tappable (CC-100).
// Labels come from messages (subscriptionsTab.status_*).
const STATUS_TEXT_CLASS: Record<SubscriptionStatus, string> = {
  active: "text-[var(--color-success-strong)]",
  authenticated: "text-[var(--color-success-strong)]",
  created: "text-[var(--color-text-gray-muted)]",
  paused: "text-[var(--color-text-gray-subtle)]",
  cancelled: "text-[var(--color-text-gray-muted)]",
  completed: "text-[var(--color-text-gray-subtle)]",
  expired: "text-[var(--color-text-gray-muted)]",
};

const ACTION_COLOR: Record<ActionType, "warning" | "success" | "danger"> = {
  pause: "warning",
  resume: "success",
  cancel: "danger",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Rupee amounts and dates in the page's language (en-IN / hi-IN / mr-IN). */
function useFormatters() {
  const intlLocale = `${useLocale()}-IN`;
  return {
    money: (paise: number) =>
      `₹${(paise / 100).toLocaleString(intlLocale, { minimumFractionDigits: 0 })}`,
    date: (iso: string | null, withYear = true) =>
      iso
        ? new Date(iso).toLocaleDateString(intlLocale, {
            day: "2-digit",
            month: "short",
            ...(withYear ? { year: "numeric" as const } : {}),
          })
        : "",
  };
}

/** The course name, falling back to the raw group code from older backends. */
const courseLabel = (sub: Subscription) => sub.course_name || sub.group_code;

const getActions = (status: SubscriptionStatus): ActionType[] => {
  if (status === "active" || status === "authenticated")
    return ["pause", "cancel"];
  if (status === "paused") return ["resume", "cancel"];
  if (status === "created") return ["cancel"];
  return [];
};

/* ------------------------------------------------------------------ */
/* Toast                                                                */
/* ------------------------------------------------------------------ */

function Toast({ message }: { message: string }) {
  return (
    <AnimatePresence>
      <motion.div
        key={message}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap"
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm Sheet / Dialog                                               */
/* ------------------------------------------------------------------ */

function ConfirmSheet({
  isOpen,
  action,
  sub,
  loading,
  result,
  onConfirm,
  onCancelWithReason,
  onPauseInstead,
  onClose,
}: {
  isOpen: boolean;
  action: ActionType | null;
  sub: Subscription | null;
  loading: boolean;
  result: { action: "cancel" | "pause"; message: string } | null;
  onConfirm: () => void;
  onCancelWithReason: (reason: CancelReason, note: string) => void;
  onPauseInstead: (reason: CancelReason) => void;
  onClose: () => void;
}) {
  const isMobile = useIsMobile();
  const t = useTranslations("subscriptionsTab");
  const cfg = action
    ? {
        label: t(`action_${action}`),
        description: t(`desc_${action}`),
        confirmLabel: t(`confirm_${action}`),
        color: ACTION_COLOR[action],
      }
    : null;

  // Cancel asks why first and may offer a way to stay (CC-97); pause and
  // resume keep the one-step confirm below.
  const content = action === "cancel" && sub ? (
    <CancelFlowContent
      key={sub.id}
      subscriptionId={sub.id}
      courseName={courseLabel(sub)}
      canPause={getActions(sub.status).includes("pause")}
      loading={loading}
      result={result}
      onCancel={onCancelWithReason}
      onPause={onPauseInstead}
      onClose={onClose}
    />
  ) : cfg && (
    <div className="p-6 space-y-5">
      <div className="space-y-1.5">
        <p className="font-semibold text-[#192839]">
          {t("confirmTitle", { action: cfg.label })}
        </p>
        <p className="text-sm text-[#40566d] leading-relaxed">{cfg.description}</p>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          color="neutral"
          fullWidth
          rounded="12px"
        >
          {t("back")}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          loading={loading}
          color={cfg.color}
          variant="solid"
          fullWidth
          rounded="12px"
        >
          {cfg.confirmLabel}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <CustomBottomSheet isOpen={isOpen} onClose={onClose} isHeader={false}>
        <div className="pt-2">{content}</div>
      </CustomBottomSheet>
    );
  }

  if (!isOpen || !cfg) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full"
      >
        {content}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                             */
/* ------------------------------------------------------------------ */

function SubscriptionSkeleton() {
  return (
    <>
      {/* Desktop skeleton */}
      <div className="hidden md:block w-full bg-white border border-[#cbd5e2] rounded-xl overflow-hidden animate-pulse">
        <div className="px-4 py-3 bg-[#f1f5fa] grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-[#cbd5e2] rounded" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-4 grid grid-cols-5 gap-4 border-t border-[#f1f5fa]">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-4 bg-[#edf0f3] rounded" />
            ))}
          </div>
        ))}
        <div className="px-4 py-3 border-t border-[#f1f5fa] flex justify-between">
          <div className="h-4 w-36 bg-[#edf0f3] rounded" />
          <div className="h-8 w-24 bg-[#edf0f3] rounded" />
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-[#cbd5e2] rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-[#edf0f3] rounded" />
                <div className="h-3 w-20 bg-[#f1f5fa] rounded" />
              </div>
              <div className="h-6 w-16 bg-[#edf0f3] rounded-full" />
            </div>
            <div className="space-y-2 pt-1 border-t border-[#f1f5fa]">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-[#f1f5fa] rounded" />
                <div className="h-3 w-24 bg-[#f1f5fa] rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-[#f1f5fa] rounded" />
                <div className="h-3 w-20 bg-[#f1f5fa] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

function EmptyState() {
  const t = useTranslations("subscriptionsTab");
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#e8f2fb] flex items-center justify-center mb-4">
        <RotateCcw size={28} className="text-[#0083ff]" />
      </div>
      <p className="text-[#192839] font-medium text-sm">{t("empty")}</p>
      <p className="text-[#768ea7] text-xs mt-1 max-w-[200px]">
        {t("emptyHint")}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Action Buttons (shared)                                              */
/* ------------------------------------------------------------------ */

function ActionButtons({
  status,
  onAction,
}: {
  status: SubscriptionStatus;
  onAction: (a: ActionType) => void;
}) {
  const t = useTranslations("subscriptionsTab");
  const actions = getActions(status);
  if (actions.length === 0) return <span className="text-gray-300 text-xs">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <Button
          key={a}
          size="sm"
          variant="soft"
          color={ACTION_COLOR[a]}
          onClick={() => onAction(a)}
          rounded="8px"
        >
          {t(`action_${a}`)}
        </Button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop Table                                                         */
/* ------------------------------------------------------------------ */

function DesktopTable({
  rows,
  onAction,
}: {
  rows: Subscription[];
  onAction: (sub: Subscription, a: ActionType) => void;
}) {
  const t = useTranslations("subscriptionsTab");
  const fmt = useFormatters();
  return (
    <div className="hidden md:block w-full bg-white border border-[#cbd5e2] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#f1f5fa] text-[#768ea7] text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left font-medium">{t("plan")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("course")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("amount")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("nextPayment")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5fa]">
          {rows.map((sub) => {
            return (
              <tr key={sub.id} className="hover:bg-[#f1f5fa]/60 transition">
                <td className="px-4 py-3.5 font-medium text-[#192839]">
                  {t("monthlyPlan")}
                </td>
                <td className="px-4 py-3.5 text-[#768ea7]">
                  {courseLabel(sub)}
                </td>
                <td className={`px-4 py-3.5 font-medium ${STATUS_TEXT_CLASS[sub.status] ?? ""}`}>
                  {t(`status_${sub.status}`)}
                </td>
                <td className="px-4 py-3.5 font-medium text-[#192839]">
                  {sub.plan ? t("perMonth", { amount: fmt.money(sub.plan.amount) }) : ""}
                </td>
                <td className="px-4 py-3.5 text-[#40566d]">
                  {fmt.date(sub.next_billing_at)}
                </td>
                <td className="px-4 py-3.5">
                  <ActionButtons
                    status={sub.status}
                    onAction={(a) => onAction(sub, a)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile Card                                                           */
/* ------------------------------------------------------------------ */

function MobileCard({
  sub,
  onAction,
}: {
  sub: Subscription;
  onAction: (a: ActionType) => void;
}) {
  const t = useTranslations("subscriptionsTab");
  const fmt = useFormatters();
  const showsNextPayment =
    (sub.status === "active" || sub.status === "authenticated") && Boolean(sub.next_billing_at && sub.plan);

  return (
    <div className="bg-white border border-[#cbd5e2] rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[#192839] text-sm leading-tight">
            {courseLabel(sub)}
          </p>
          <p className="text-[11px] text-[#768ea7] mt-0.5">{t("monthlyPlan")}</p>
        </div>
        <span className={`text-sm font-medium ${STATUS_TEXT_CLASS[sub.status] ?? ""}`}>
          {t(`status_${sub.status}`)}
        </span>
      </div>

      {/* "Next payment: ₹99, 12 Nov" in plain words (CC-100). */}
      {showsNextPayment && sub.plan && (
        <p className="text-sm font-medium text-[#192839]">
          {t("nextPaymentLine", {
            amount: fmt.money(sub.plan.amount),
            date: fmt.date(sub.next_billing_at, false),
          })}
        </p>
      )}

      {/* Info rows */}
      <div className="space-y-1.5 border-t border-[#f1f5fa] pt-3 text-sm">
        {sub.plan && (
          <div className="flex justify-between">
            <span className="text-[#768ea7]">{t("amount")}</span>
            <span className="font-medium text-[#40566d]">
              {t("perMonth", { amount: fmt.money(sub.plan.amount) })}
            </span>
          </div>
        )}
        {sub.next_billing_at && !showsNextPayment && (
          <div className="flex justify-between">
            <span className="text-[#768ea7]">{t("nextPayment")}</span>
            <span className="font-medium text-[#40566d]">
              {fmt.date(sub.next_billing_at)}
            </span>
          </div>
        )}
        {sub.current_end && (
          <div className="flex justify-between">
            <span className="text-[#768ea7]">{t("periodEnds")}</span>
            <span className="font-medium text-[#40566d]">
              {fmt.date(sub.current_end)}
            </span>
          </div>
        )}
        {sub.cancelled_at && (
          <div className="flex justify-between">
            <span className="text-[#768ea7]">{t("cancelledOn")}</span>
            <span className="font-medium text-[#40566d]">
              {fmt.date(sub.cancelled_at)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[#768ea7]">{t("started")}</span>
          <span className="font-medium text-[#40566d]">
            {fmt.date(sub.created_at)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#768ea7]">{t("paymentsMade")}</span>
          <span className="font-medium text-[#40566d]">{sub.paid_count}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-1">
        <ActionButtons status={sub.status} onAction={onAction} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination Footer                                                     */
/* ------------------------------------------------------------------ */

function PaginationFooter({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-1 text-sm text-[#768ea7]">
      <p>
        {start}–{end} of {total}
      </p>
      <div className="flex gap-1">
        <Button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          variant="plain"
          color="neutral"
          size="sm"
          rounded="8px"
        >
          <ChevronLeft size={18} />
        </Button>
        <Button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          variant="plain"
          color="neutral"
          size="sm"
          rounded="8px"
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                  */
/* ------------------------------------------------------------------ */

function SubscriptionWrap() {
  const t = useTranslations("subscriptionsTab");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{
    sub: Subscription;
    action: ActionType;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Outcome of the cancel flow, shown in the sheet instead of a toast.
  const [flowResult, setFlowResult] = useState<{ action: "cancel" | "pause"; message: string } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---- Query ---- */
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getSubscriptions,
    staleTime: 1000 * 60 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  /* ---- Mutations ---- */
  const mutation = useMutation({
    mutationFn: ({ sub, action }: {
      sub: Subscription;
      action: ActionType;
      reason?: CancelReason;
      note?: string;
      fromFlow?: boolean;
    }) => {
      if (action === "pause")  return pauseSubscription(sub.id);
      if (action === "resume") return resumeSubscription(sub.id);
      return cancelSubscription(sub.id);
    },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      // The existing status event, from the app (CC-97 reason/note on it).
      // The backend sends it only for changes Razorpay makes on its own.
      trackEvent("Subscription Status Updated", {
        new_status: vars.action === "cancel" ? "cancelled" : vars.action === "pause" ? "paused" : "active",
        plan_name: vars.sub.plan?.name ?? "",
        exam_id: vars.sub.group_code,
        exam_name: courseLabel(vars.sub),
        subscription_id: String(vars.sub.id),
        source: "app",
        ...(vars.reason ? { reason: vars.reason } : {}),
        ...(vars.note ? { note: vars.note } : {}),
      });
      if (vars.fromFlow && vars.action !== "resume") {
        // Stay in the sheet with a clear end screen (the backend's message
        // carries the access end date).
        setFlowResult({ action: vars.action, message: res.message });
        return;
      }
      setConfirm(null);
      showToast(res.message);
    },
    onError: () => {
      setConfirm(null);
      showToast(t("genericError"));
    },
  });

  /* ---- Handlers ---- */
  const handleAction = useCallback(
    (sub: Subscription, action: ActionType) => setConfirm({ sub, action }),
    []
  );

  const handleConfirm = useCallback(() => {
    if (confirm) mutation.mutate(confirm);
  }, [confirm, mutation]);

  const handleCancelWithReason = useCallback(
    (reason: CancelReason, note: string) => {
      if (confirm) mutation.mutate({ sub: confirm.sub, action: "cancel", reason, note, fromFlow: true });
    },
    [confirm, mutation],
  );

  const handlePauseInstead = useCallback(
    (reason: CancelReason) => {
      if (confirm) mutation.mutate({ sub: confirm.sub, action: "pause", reason, fromFlow: true });
    },
    [confirm, mutation],
  );

  const closeSheet = useCallback(() => {
    setConfirm(null);
    setFlowResult(null);
  }, []);

  /* ---- Derived ---- */
  const all = useMemo(() => data?.subscriptions ?? [], [data]);
  const totalPages = useMemo(() => Math.ceil(all.length / PAGE_SIZE), [all]);
  const paginated = useMemo(
    () => all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [all, page]
  );

  /* ---- Render ---- */
  if (isLoading) return <SubscriptionSkeleton />;

  if (isError) {
    return (
      <div className="py-10 text-center">
        <p className="text-[#d92d20] text-sm">
          {t("loadError")}
        </p>
      </div>
    );
  }

  if (all.length === 0) return <EmptyState />;

  return (
    <>
      {toast && <Toast message={toast} />}

      <ConfirmSheet
        isOpen={!!confirm}
        action={confirm?.action ?? null}
        sub={confirm?.sub ?? null}
        loading={mutation.isPending}
        result={flowResult}
        onConfirm={handleConfirm}
        onCancelWithReason={handleCancelWithReason}
        onPauseInstead={handlePauseInstead}
        onClose={closeSheet}
      />

      <div className="space-y-4">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#192839]">
            {t("heading")}
            <span className="ml-1.5 text-[#768ea7] font-normal">
              ({all.length})
            </span>
          </h2>
        </div>

        {/* Desktop table */}
        <DesktopTable
          rows={paginated}
          onAction={handleAction}
        />

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {paginated.map((sub) => (
            <MobileCard
              key={sub.id}
              sub={sub}
              onAction={(a) => handleAction(sub, a)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationFooter
            page={page}
            totalPages={totalPages}
            total={all.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>
    </>
  );
}

export default memo(SubscriptionWrap);
