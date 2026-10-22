import React, { memo, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import PaymentHistorySkeleton from "./PaymentHistorySkeleton";

/* ----------------------------------
 * Types
 * ---------------------------------*/

export interface PaymentRow {
  id: string;
  /** ISO date-time of the payment. */
  date: string | null;
  program: string | null;
  /** null for rows from the old enrollment-based fallback. */
  kind: "one_time" | "autopay" | null;
  /** Rupees; null when unknown (the cell is then left empty). */
  amount: number | null;
  method: string | null;
  paymentId: string | null;
}

interface PaymentHistoryTableProps {
  data: PaymentRow[];
  totalItems: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const KNOWN_METHODS = ["upi", "card", "netbanking", "wallet", "emandate"] as const;

/* ----------------------------------
 * Component
 * ---------------------------------*/

function PaymentHistoryTable({
  data,
  totalItems,
  page,
  pageSize,
  loading = false,
  onPageChange,
  onPageSizeChange,
}: PaymentHistoryTableProps) {
  const t = useTranslations("paymentHistory");
  const locale = useLocale();
  const intlLocale = `${locale}-IN`;

  // All hooks must be called at the top level, before any conditional returns
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [totalItems, pageSize]);

  const { startItem, endItem } = useMemo(() => {
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);
    return { startItem: start, endItem: end };
  }, [page, pageSize, totalItems]);

  if (loading) return <PaymentHistorySkeleton />;

  const isEmpty = data.length === 0;

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(intlLocale, { day: "2-digit", month: "short", year: "numeric" })
      : "";
  const formatAmount = (amount: number | null) =>
    amount === null
      ? ""
      : `₹${amount.toLocaleString(intlLocale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const kindLabel = (kind: PaymentRow["kind"]) =>
    kind === "autopay" ? t("autopay") : kind === "one_time" ? t("oneTime") : t("paid");
  const methodLabel = (method: string | null) => {
    if (!method) return "";
    const key = method.toLowerCase();
    return (KNOWN_METHODS as readonly string[]).includes(key) ? t(`method_${key}` as "method_upi") : method;
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* ---------------- Desktop ---------------- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">{t("date")}</th>
              <th className="px-4 py-3 text-left">{t("course")}</th>
              <th className="px-4 py-3 text-left">{t("type")}</th>
              <th className="px-4 py-3 text-left">{t("amount")}</th>
              <th className="px-4 py-3 text-left">{t("payment")}</th>
            </tr>
          </thead>

          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  <p className="font-medium">{t("empty")}</p>
                  <p className="text-xs mt-1">{t("emptyHint")}</p>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-t border-gray-200">
                  <td className="px-4 py-3">{formatDate(row.date)}</td>
                  <td className="px-4 py-3">{row.program ?? ""}</td>
                  {/* A plain label, not a pill: it isn't tappable (CC-100). */}
                  <td className="px-4 py-3 text-gray-600">{kindLabel(row.kind)}</td>
                  <td className="px-4 py-3 font-medium">{formatAmount(row.amount)}</td>
                  <td className="px-4 py-3">
                    {methodLabel(row.method)}
                    {row.paymentId && (
                      <span className="block text-xs text-gray-500 font-mono">{row.paymentId}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- Mobile ---------------- */}
      <div className="md:hidden divide-y">
        {isEmpty ? (
          <div className="p-6 text-center text-gray-500">
            <p className="font-medium">{t("empty")}</p>
            <p className="text-xs mt-1">{t("emptyHint")}</p>
          </div>
        ) : (
          data.map((row) => (
            <div key={row.id} className="p-4 space-y-2">
              <div className="flex justify-between gap-2">
                <p className="font-medium">{row.program ?? ""}</p>
                <span className="text-sm text-gray-600">{kindLabel(row.kind)}</span>
              </div>

              {row.date && <p className="text-sm text-gray-500">{formatDate(row.date)}</p>}

              {row.amount !== null && (
                <div className="flex justify-between text-sm">
                  <span>{t("amount")}</span>
                  <span className="font-medium">{formatAmount(row.amount)}</span>
                </div>
              )}

              {row.method && (
                <div className="flex justify-between text-sm">
                  <span>{t("payment")}</span>
                  <span>{methodLabel(row.method)}</span>
                </div>
              )}

              {row.paymentId && (
                <div className="flex justify-between gap-2 text-sm">
                  <span>{t("paymentId")}</span>
                  <span className="text-xs text-gray-500 font-mono break-all text-right">{row.paymentId}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ---------------- Footer ---------------- */}
      {totalItems > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t text-sm text-gray-600">
          <p>{t("showing", { start: startItem, end: endItem, total: totalItems })}</p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>{t("rowsPerPage")}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label={t("previous")}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label={t("next")}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PaymentHistoryTable);
