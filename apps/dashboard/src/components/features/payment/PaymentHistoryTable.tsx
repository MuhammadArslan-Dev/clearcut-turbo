import React, { memo, useMemo } from 'react'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import PaymentHistorySkeleton from './PaymentHistorySkeleton'
import StatusChip from '@/components/ui/cards/preparation/chapter-list/StatusChip'

/* ----------------------------------
 * Types
 * ---------------------------------*/

export interface PaymentRow {
  id: string
  date: string
  program: string
  status: 'active' | 'trial' | 'trial-ended' | 'expired'
  amount?: number | null
  paymentMethod?: string | null
  invoiceUrl?: string | null
}

interface PaymentHistoryTableProps {
  data: PaymentRow[]
  totalItems: number
  page: number
  pageSize: number
  loading?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

/* ----------------------------------
 * Constants
 * ---------------------------------*/

const STATUS_MAP = {
  active: { label: 'Active', tone: 'success' },
  trial: { label: 'Trial', tone: 'warning' },
  'trial-ended': { label: 'Trial ended', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'error' },
} as const

const formatCurrency = (amount?: number | null) =>
  amount == null
    ? '-'
    : `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    })}`

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
  // All hooks must be called at the top level, before any conditional returns
  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  )

  const { startItem, endItem } = useMemo(() => {
    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, totalItems)
    return { startItem: start, endItem: end }
  }, [page, pageSize, totalItems])

  const isEmpty = data.length === 0

  if (loading) return <PaymentHistorySkeleton />

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* ---------------- Desktop ---------------- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Program</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-center">Invoice</th>
            </tr>
          </thead>

          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No payment records found
                </td>
              </tr>
            ) : (
              data.map(row => {
                const status = STATUS_MAP[row.status]

                return (
                  <tr key={row.id} className="border-t border-gray-200">
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">{row.program}</td>
                    <td className="px-4 py-3">
                      <StatusChip
                        label={status.label}
                        tone={status.tone}
                        variant="soft"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {row.paymentMethod || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.invoiceUrl ? (
                        <a
                          href={row.invoiceUrl}
                          download
                          className="inline-flex text-gray-600 hover:text-gray-900"
                        >
                          <Download size={18} />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- Mobile ---------------- */}
      <div className="md:hidden divide-y">
        {isEmpty ? (
          <p className="p-6 text-center text-gray-500">
            No payment records found
          </p>
        ) : (
          data.map(row => {
            const status = STATUS_MAP[row.status]

            return (
              <div key={row.id} className="p-4 space-y-2">
                <div className="flex justify-between">
                  <p className="font-medium">{row.program}</p>
                  <StatusChip
                    label={status.label}
                    tone={status.tone}
                    variant="soft"
                  />
                </div>

                <p className="text-sm text-gray-500">{row.date}</p>

                <div className="flex justify-between text-sm">
                  <span>Amount</span>
                  <span className="font-medium">
                    {formatCurrency(row.amount)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Payment</span>
                  <span>{row.paymentMethod || '-'}</span>
                </div>

                {row.invoiceUrl && (
                  <a
                    href={row.invoiceUrl}
                    download
                    className="inline-flex items-center gap-1 text-blue-600 text-sm"
                  >
                    <Download size={16} />
                    Download Invoice
                  </a>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ---------------- Footer ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t text-sm text-gray-600">
        <p>
          Showing {startItem}–{endItem} of {totalItems}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => {
                onPageSizeChange(Number(e.target.value))
                onPageChange(1)
              }}
              className="border rounded px-2 py-1"
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>rows / page</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(PaymentHistoryTable)
