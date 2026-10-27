"use client";

import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, MoreVertical, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@clearcut/ui/button";
import {
  getSubscriptions,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  Subscription,
  SubscriptionStatus,
  type PaymentHistoryItem,
} from "@/lib/payment/payment";
import { CustomBottomSheet } from "@/components/modals/modals-bottom-sheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { trackEvent } from "@/lib/analytics/browser";
import CancelFlowContent, { CancelReason } from "./CancelFlowContent";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { PaymentCardIcon, TrophyIcon } from "@/components/ui/icons";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { usePaymentHistory } from "@/hooks/payment/usePaymentHistory";
import SwitchTabLink from "@/components/features/profile/SwitchTabLink";
import type { Tab } from "@/app/[locale]/(protected)/(dashboard)/dashboard/profile/page";
import { useRouter } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const QUERY_KEY = ["subscriptions"];
const PAGE_SIZE = 5;

type PlanFilter = "all" | "active" | "expired";
const FILTERS: PlanFilter[] = ["all", "active", "expired"];

type ActionType = "pause" | "resume" | "cancel";


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
    /** Already-rupee amounts (payment history sends rupees, plans send paise). */
    rupees: (amount: number) =>
      `₹${amount.toLocaleString(intlLocale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
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

/**
 * What the Amount column shows. A recurring plan reads "₹99 / month" — its
 * cycle price, not what the student has paid so far — while a one-time
 * purchase is the single sum it cost.
 */
function amountText(
  row: PlanRow,
  fmt: ReturnType<typeof useFormatters>,
  perMonth: (amount: string) => string,
): string {
  if (row.sub?.plan) return perMonth(fmt.money(row.sub.plan.amount));
  return row.amount !== null ? fmt.rupees(row.amount) : "";
}

/* ------------------------------------------------------------------ */
/* Row model                                                            */
/* ------------------------------------------------------------------ */

/**
 * This tab is the student's RECURRING (autopay) plans, and only those.
 * One-time purchases live under Profile → Payments; the two tabs used to list
 * the same one-time purchase twice, so they are now split by kind and each
 * links to the other (SwitchTabLink).
 *
 * Each row's Active/Expired state is looked up from the student's enrolment,
 * the only source that actually knows whether access is still live; the plan's
 * own status is just the fallback. No new endpoint.
 */
type PlanRow = {
  id: string;
  courseName: string;
  purchasedAt: string | null;
  /** Rupees — the price of ONE cycle (₹99/month), not what has been paid. */
  amount: number | null;
  /**
   * This plan's autopay charges, newest first - the rows revealed when the plan
   * is expanded. The Payments tab no longer lists autopay charges, so this is
   * the only place a student (or support) can find a charge's payment ID.
   */
  charges: PaymentHistoryItem[];
  /**
   * Rupees actually paid on this plan: the sum of `charges`. The plan's
   * `amount` is one cycle; the student has usually paid it several times, and
   * "Amount Paid" must say so. `null` while the history is unavailable, so we
   * show nothing rather than a wrong zero.
   */
  totalPaid: number | null;
  access: "active" | "expired";
  groupCode: string;
  sub: Subscription;
};

const ACTIVE_ENROLMENT_STATUSES = new Set(["active"]);

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
        <p className="font-semibold text-[var(--color-text-gray-normal)]">
          {t("confirmTitle", { action: cfg.label })}
        </p>
        <p className="text-sm text-[var(--color-text-gray-subtle)] leading-relaxed">{cfg.description}</p>
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
      <div className="hidden md:block w-full bg-white border border-[var(--color-border-gray-subtle)] rounded-xl overflow-hidden animate-pulse">
        <div className="px-4 py-3 bg-[var(--color-background-gray-subtle)] grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-[var(--color-border-gray-subtle)] rounded" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-4 grid grid-cols-5 gap-4 border-t border-[var(--color-background-gray-subtle)]">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-4 bg-[#edf0f3] rounded" />
            ))}
          </div>
        ))}
        <div className="px-4 py-3 border-t border-[var(--color-background-gray-subtle)] flex justify-between">
          <div className="h-4 w-36 bg-[#edf0f3] rounded" />
          <div className="h-8 w-24 bg-[#edf0f3] rounded" />
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-[var(--color-border-gray-subtle)] rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-[#edf0f3] rounded" />
                <div className="h-3 w-20 bg-[var(--color-background-gray-subtle)] rounded" />
              </div>
              <div className="h-6 w-16 bg-[#edf0f3] rounded-full" />
            </div>
            <div className="space-y-2 pt-1 border-t border-[var(--color-background-gray-subtle)]">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-[var(--color-background-gray-subtle)] rounded" />
                <div className="h-3 w-24 bg-[var(--color-background-gray-subtle)] rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-[var(--color-background-gray-subtle)] rounded" />
                <div className="h-3 w-20 bg-[var(--color-background-gray-subtle)] rounded" />
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

function EmptyState({ onSwitchTab }: { onSwitchTab?: (tab: Tab) => void }) {
  const t = useTranslations("subscriptionsTab");
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#e8f2fb] flex items-center justify-center mb-4">
        <RotateCcw size={28} className="text-[#0083ff]" />
      </div>
      <p className="text-[var(--color-text-gray-normal)] font-medium text-sm">{t("empty")}</p>
      <p className="text-[var(--color-surface-gray-muted)] text-xs mt-1 max-w-[200px]">
        {t("emptyHint")}
      </p>
      <SwitchTabLink
        className="mt-4"
        hint={t("oneTimeHint")}
        label={t("oneTimeLink")}
        onClick={onSwitchTab && (() => onSwitchTab("payment"))}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Action Buttons (shared)                                              */
/* ------------------------------------------------------------------ */

/**
 * The row's overflow menu. The design's action column shows only "View Course",
 * but pause/resume/cancel are live capabilities that must not disappear (D2-b),
 * so they moved in here. Local to this file and modelled on the existing
 * ProfileDropdown pattern — the repo has no generic menu primitive and no Radix.
 */
function RowMenu({
  status,
  onAction,
}: {
  status: SubscriptionStatus;
  onAction: (a: ActionType) => void;
}) {
  const t = useTranslations("subscriptionsTab");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const actions = getActions(status);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={t("actions")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--color-surface-gray-muted)] hover:bg-[var(--color-background-gray-subtle)]"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5"
        >
          {actions.map((a) => (
            <button
              key={a}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                onAction(a);
              }}
              className={`block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-[var(--color-background-gray-subtle)] ${
                a === "cancel" ? "text-[var(--color-danger)]" : "text-[var(--color-text-gray-normal)]"
              }`}
            >
              {t(`action_${a}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop Table                                                         */
/* ------------------------------------------------------------------ */

/** Type and Active/Expired pills, shared by the table and the mobile cards. */
function KindChip() {
  const t = useTranslations("subscriptionsTab");
  return (
    <StatusChip
      variant="soft"
      tone="info"
      radius="full"
      size="sm"
      label={t("typeSubscription")}
    />
  );
}

function AccessChip({ access }: { access: PlanRow["access"] }) {
  const t = useTranslations("subscriptionsTab");
  return (
    <StatusChip
      variant="soft"
      tone={access === "active" ? "success" : "neutral"}
      radius="full"
      size="sm"
      label={access === "active" ? t("accessActive") : t("accessExpired")}
    />
  );
}

const KNOWN_METHODS = ["upi", "card", "netbanking", "wallet", "emandate"] as const;

/**
 * The charges behind one autopay plan: date, amount, method, Razorpay payment
 * ID, status. A table from md up and a stacked list below it, so the same
 * component serves both the desktop row and the mobile card. Column headings
 * and method labels reuse the Payments tab's `paymentHistory` messages.
 */
function PlanCharges({ charges }: { charges: PaymentHistoryItem[] }) {
  const t = useTranslations("subscriptionsTab");
  const tp = useTranslations("paymentHistory");
  const fmt = useFormatters();

  const methodLabel = (method: string | null) => {
    if (!method) return "";
    const key = method.toLowerCase();
    return (KNOWN_METHODS as readonly string[]).includes(key)
      ? tp(`method_${key}` as "method_upi")
      : method;
  };

  if (charges.length === 0) {
    return <p className="text-sm text-[var(--color-surface-gray-muted)]">{tp("empty")}</p>;
  }

  const successChip = (
    <StatusChip variant="soft" tone="success" radius="full" size="sm" label={tp("success")} />
  );

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-surface-gray-muted)]">
        {t("paymentsTitle")}
      </p>

      <table className="hidden w-full text-sm md:table">
        <thead className="text-xs text-[var(--color-surface-gray-muted)]">
          <tr>
            <th className="py-2 pr-4 text-left font-medium">{tp("date")}</th>
            <th className="py-2 pr-4 text-left font-medium">{tp("amount")}</th>
            <th className="py-2 pr-4 text-left font-medium">{tp("paymentMethod")}</th>
            <th className="py-2 pr-4 text-left font-medium">{tp("paymentId")}</th>
            <th className="py-2 text-left font-medium">{tp("status")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-gray-subtle)]">
          {charges.map((c) => (
            <tr key={c.id}>
              <td className="py-2 pr-4 text-[var(--color-text-gray-subtle)]">{fmt.date(c.paid_at)}</td>
              <td className="py-2 pr-4 font-medium text-[var(--color-text-gray-normal)]">{fmt.rupees(c.amount)}</td>
              <td className="py-2 pr-4 text-[var(--color-text-gray-subtle)]">
                {c.method && (
                  <span className="inline-flex items-center gap-2">
                    <PaymentCardIcon size={16} variant="outline" color="var(--color-brand)" />
                    {methodLabel(c.method)}
                  </span>
                )}
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-[var(--color-surface-gray-muted)]">{c.payment_id ?? ""}</td>
              <td className="py-2">{successChip}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-2 md:hidden">
        {charges.map((c) => (
          <li key={c.id} className="rounded-lg bg-white p-3 text-sm ring-1 ring-[var(--color-border-gray-subtle)]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--color-text-gray-normal)]">{fmt.rupees(c.amount)}</span>
              {successChip}
            </div>
            <p className="mt-1 text-[var(--color-text-gray-subtle)]">
              {fmt.date(c.paid_at)}
              {c.method ? ` \u00b7 ${methodLabel(c.method)}` : ""}
            </p>
            {c.payment_id && (
              <p className="mt-1 break-all font-mono text-xs text-[var(--color-surface-gray-muted)]">{c.payment_id}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ViewCourseButton({ row, onView }: { row: PlanRow; onView: (r: PlanRow) => void }) {
  const t = useTranslations("subscriptionsTab");
  if (!row.groupCode) return null;
  return (
    <Button size="sm" variant="outlined" rounded="8px" onClick={() => onView(row)}>
      {t("viewCourse")}
    </Button>
  );
}

function DesktopTable({
  rows,
  expanded,
  onToggle,
  onAction,
  onView,
}: {
  rows: PlanRow[];
  expanded: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onAction: (sub: Subscription, a: ActionType) => void;
  onView: (row: PlanRow) => void;
}) {
  const t = useTranslations("subscriptionsTab");
  const fmt = useFormatters();
  return (
    <div className="hidden md:block w-full bg-white border border-[var(--color-border-gray-subtle)] rounded-xl overflow-visible">
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-background-gray-subtle)] text-[var(--color-surface-gray-muted)] text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left font-medium">{t("coursePlan")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("type")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("purchaseDate")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("amount")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
            <th className="px-4 py-3 text-left font-medium">{t("action")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-background-gray-subtle)]">
          {rows.map((row) => {
            const isOpen = expanded.has(row.id);
            return (
              <React.Fragment key={row.id}>
                <tr className="hover:bg-[var(--color-background-gray-subtle)]/60 transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`charges-${row.id}`}
                        aria-label={
                          isOpen
                            ? t("hidePayments")
                            : t("showPayments", { count: row.charges.length })
                        }
                        onClick={() => onToggle(row.id)}
                        className="mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--color-surface-gray-muted)] hover:bg-[var(--color-border-gray-subtle)]"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <div>
                        <p className="font-semibold text-[var(--color-text-gray-normal)]">
                          {t("courseTitle", { course: row.courseName })}
                        </p>
                        <p className="text-xs text-[var(--color-surface-gray-muted)]">{t("courseBlurb")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <KindChip />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[var(--color-text-gray-subtle)]">{fmt.date(row.purchasedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-[var(--color-text-gray-normal)]">
                    {amountText(row, fmt, (amount) => t("perMonth", { amount }))}
                  </td>
                  <td className="px-4 py-3.5">
                    <AccessChip access={row.access} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <ViewCourseButton row={row} onView={onView} />
                      <RowMenu status={row.sub.status} onAction={(a) => onAction(row.sub, a)} />
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr id={`charges-${row.id}`} className="bg-[var(--color-background-gray-subtle)]/60">
                    <td colSpan={6} className="px-4 py-3 pl-12">
                      <PlanCharges charges={row.charges} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
  row,
  isOpen,
  onToggle,
  onAction,
  onView,
}: {
  row: PlanRow;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onAction: (a: ActionType) => void;
  onView: (row: PlanRow) => void;
}) {
  const t = useTranslations("subscriptionsTab");
  const fmt = useFormatters();
  const sub = row.sub;
  // Only a live recurring plan has a next charge worth naming (CC-100).
  const nextPayment =
    sub && sub.plan && sub.next_billing_at &&
    (sub.status === "active" || sub.status === "authenticated")
      ? t("nextPaymentLine", {
          amount: fmt.money(sub.plan.amount),
          date: fmt.date(sub.next_billing_at, false),
        })
      : null;

  return (
    <div className="bg-white border border-[var(--color-border-gray-subtle)] rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-text-gray-normal)] text-sm leading-tight">
            {t("courseTitle", { course: row.courseName })}
          </p>
          <p className="text-[11px] text-[var(--color-surface-gray-muted)] mt-0.5">{t("courseBlurb")}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <KindChip />
            <AccessChip access={row.access} />
          </div>
        </div>
        <RowMenu status={sub.status} onAction={onAction} />
      </div>

      {nextPayment && (
        <p className="text-sm font-medium text-[var(--color-text-gray-normal)]">{nextPayment}</p>
      )}

      <div className="space-y-1.5 border-t border-[var(--color-background-gray-subtle)] pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-surface-gray-muted)]">{t("purchaseDate")}</span>
          <span className="font-medium text-[var(--color-text-gray-subtle)]">{fmt.date(row.purchasedAt)}</span>
        </div>
        {amountText(row, fmt, (amount) => t("perMonth", { amount })) && (
          <div className="flex justify-between">
            <span className="text-[var(--color-surface-gray-muted)]">{t("amount")}</span>
            <span className="font-medium text-[var(--color-text-gray-normal)]">
              {amountText(row, fmt, (amount) => t("perMonth", { amount }))}
            </span>
          </div>
        )}
        {sub?.cancelled_at && (
          <div className="flex justify-between">
            <span className="text-[var(--color-surface-gray-muted)]">{t("cancelledOn")}</span>
            <span className="font-medium text-[var(--color-text-gray-subtle)]">{fmt.date(sub.cancelled_at)}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`charges-${row.id}`}
        onClick={() => onToggle(row.id)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-[var(--color-background-gray-subtle)] px-3 py-2 text-sm font-medium text-[var(--color-text-gray-subtle)]"
      >
        <span>
          {isOpen ? t("hidePayments") : t("showPayments", { count: row.charges.length })}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div id={`charges-${row.id}`}>
          <PlanCharges charges={row.charges} />
        </div>
      )}

      <div className="pt-1">
        <ViewCourseButton row={row} onView={onView} />
      </div>
    </div>
  );
}


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
    <div className="flex items-center justify-between px-1 text-sm text-[var(--color-surface-gray-muted)]">
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

function SubscriptionWrap({ onSwitchTab }: { onSwitchTab?: (tab: Tab) => void }) {
  const t = useTranslations("subscriptionsTab");
  const fmt = useFormatters();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<PlanFilter>("all");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
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

  /* ---- Queries ---- */
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getSubscriptions,
    staleTime: 1000 * 60 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // The other half of the row list (D1-a) plus the enrolment statuses that say
  // whether access is still live. Both are already cached by the Payments tab
  // and the dashboard, so this usually costs no extra request.
  const history = usePaymentHistory();
  const { courses } = useMyActiveCourses();

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

  /* ---- Derived: the merged row list (D1-a) ---- */
  const accessByGroup = useMemo(() => {
    const map = new Map<string, "active" | "expired">();
    for (const c of courses?.courses ?? []) {
      if (!c?.group_code) continue;
      map.set(
        c.group_code,
        ACTIVE_ENROLMENT_STATUSES.has(String(c.status)) ? "active" : "expired",
      );
    }
    return map;
  }, [courses]);

  // Which plan each autopay charge belongs to. The history carries the course
  // but not the subscription, and a student who cancels and re-subscribes has
  // two plans for one course - so a charge goes to the NEWEST plan for its
  // course that already existed when it was paid. Each charge lands on exactly
  // one plan, never both. (A charge dated before every plan, from clock skew,
  // falls to the oldest rather than vanishing.)
  const chargesBySub = useMemo(() => {
    const subs = data?.subscriptions ?? [];
    const map = new Map<number, PaymentHistoryItem[]>(subs.map((sb) => [sb.id, []]));
    const plansOfCourse = new Map<string, Subscription[]>();
    for (const sb of subs) {
      const list = plansOfCourse.get(sb.group_code) ?? [];
      list.push(sb);
      plansOfCourse.set(sb.group_code, list);
    }
    for (const list of plansOfCourse.values()) {
      list.sort((x, y) => Date.parse(y.created_at) - Date.parse(x.created_at));
    }

    for (const pay of history.data?.payments ?? []) {
      const group = pay.course?.group_code;
      if (pay.type !== "autopay" || !group || !pay.paid_at) continue;
      const candidates = plansOfCourse.get(group);
      if (!candidates?.length) continue;
      const paidAt = Date.parse(pay.paid_at);
      const owner =
        candidates.find((sb) => Date.parse(sb.created_at) <= paidAt) ??
        candidates[candidates.length - 1];
      map.get(owner.id)?.push(pay);
    }
    for (const list of map.values()) {
      list.sort((x, y) => Date.parse(y.paid_at ?? "") - Date.parse(x.paid_at ?? ""));
    }
    return map;
  }, [data, history.data]);

  const all: PlanRow[] = useMemo(() => {
    const subs = (data?.subscriptions ?? []).map<PlanRow>((sub) => ({
      id: `sub-${sub.id}`,
      courseName: courseLabel(sub),
      purchasedAt: sub.created_at,
      amount: sub.plan ? sub.plan.amount / 100 : null,
      charges: chargesBySub.get(sub.id) ?? [],
      totalPaid: history.data
        ? (chargesBySub.get(sub.id) ?? []).reduce(
            (sum, c) => sum + (Number.isFinite(c.amount) ? c.amount : 0),
            0,
          )
        : null,
      // The enrolment answers "is access live"; the plan's own status is only
      // the fallback when no enrolment is on record.
      access:
        accessByGroup.get(sub.group_code) ??
        (sub.status === "active" || sub.status === "authenticated" ? "active" : "expired"),
      groupCode: sub.group_code,
      sub,
    }));

    return subs.sort((x, y) =>
      (y.purchasedAt ?? "").localeCompare(x.purchasedAt ?? ""),
    );
  }, [data, accessByGroup, chargesBySub, history.data]);

  const counts = useMemo(
    () => ({
      all: all.length,
      active: all.filter((r) => r.access === "active").length,
      expired: all.filter((r) => r.access === "expired").length,
    }),
    [all],
  );

  const filteredRows = useMemo(() => {
    return filter === "all" ? all : all.filter((r) => r.access === filter);
  }, [all, filter]);

  /** The hero: the newest row that still has live access. */
  const currentPlan = useMemo(
    () => all.find((r) => r.access === "active") ?? null,
    [all],
  );

  const totalPages = useMemo(() => Math.ceil(filteredRows.length / PAGE_SIZE), [filteredRows]);
  const paginated = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  const handleView = useCallback(
    (row: PlanRow) => {
      if (row.groupCode) router.push(`/preparation/${row.groupCode}`);
    },
    [router],
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

  if (all.length === 0) return <EmptyState onSwitchTab={onSwitchTab} />;

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
        <div>
          <p className="heading-large !font-semibold text-surface-gray-normal">
            {t("paneTitle")}
          </p>
          <p className="body-small !font-normal text-surface-gray-muted">
            {t("paneSubtitle")}
          </p>
        </div>

        {/* Current plan */}
        {currentPlan && (
          <div className="flex flex-col gap-4 rounded-xl bg-[var(--color-background-gray-subtle)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-subtle)]">
                <TrophyIcon size={26} color="var(--color-brand)" />
              </span>
              <div className="min-w-0">
                <p className="body-small !font-normal text-surface-gray-muted">
                  {t("currentPlan")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="heading-medium !font-semibold text-surface-gray-normal">
                    {t("courseTitle", { course: currentPlan.courseName })}
                  </p>
                  <AccessChip access={currentPlan.access} />
                </div>
                <p className="body-small !font-normal text-surface-gray-muted">
                  {t("courseBlurb")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <div>
                <p className="body-small !font-normal text-surface-gray-muted">
                  {t("purchaseDate")}
                </p>
                <p className="body-medium !font-semibold text-surface-gray-normal">
                  {fmt.date(currentPlan.purchasedAt)}
                </p>
              </div>
              {currentPlan.totalPaid !== null && (
                <div>
                  <p className="body-small !font-normal text-surface-gray-muted">
                    {t("amountPaid")}
                  </p>
                  <p className="body-medium !font-semibold text-surface-gray-normal">
                    {fmt.rupees(currentPlan.totalPaid)}
                  </p>
                </div>
              )}
              <ViewCourseButton row={currentPlan} onView={handleView} />
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const selected = filter === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? "border-brand bg-brand text-white"
                    : "border-[var(--color-border-gray-subtle)] bg-white text-[var(--color-text-gray-subtle)] hover:border-blue-300"
                }`}
              >
                {t(`filter_${f}`)} ({counts[f]})
              </button>
            );
          })}
        </div>

        {/* Desktop table */}
        <DesktopTable
          rows={paginated}
          expanded={expanded}
          onToggle={toggleExpanded}
          onAction={handleAction}
          onView={handleView}
        />

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {paginated.map((row) => (
            <MobileCard
              key={row.id}
              row={row}
              isOpen={expanded.has(row.id)}
              onToggle={toggleExpanded}
              onAction={(a) => handleAction(row.sub, a)}
              onView={handleView}
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

        <SwitchTabLink
          hint={t("oneTimeHint")}
          label={t("oneTimeLink")}
          onClick={onSwitchTab && (() => onSwitchTab("payment"))}
        />
      </div>
    </>
  );
}

export default memo(SubscriptionWrap);
