import React, { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ReferralRow {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  status: "pending" | "completed" | "expired";
  reward: number | null;
}

interface ReferralTableProps {
  data: ReferralRow[];
  totalItems: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const STATUS_MAP = {
  pending: { label: "Pending", bg: "bg-yellow-100", text: "text-yellow-700" },
  completed: { label: "Completed", bg: "bg-green-100", text: "text-green-700" },
  expired: { label: "Expired", bg: "bg-red-100", text: "text-red-600" },
} as const;

const formatReward = (amount: number | null) =>
  amount == null ? "-" : `₹${amount.toLocaleString("en-IN")}`;

function ReferralTable({
  data,
  totalItems,
  page,
  pageSize,
  loading = false,
  onPageChange,
  onPageSizeChange,
}: ReferralTableProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);
  const isEmpty = data.length === 0;

  if (loading) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-lg p-8 flex justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Reward</th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No referrals yet. Share your code to get started!
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const s = STATUS_MAP[row.status];
                return (
                  <tr key={row.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.email}</td>
                    <td className="px-4 py-3 text-gray-600">{row.joinedAt}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatReward(row.reward)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-gray-200">
        {isEmpty ? (
          <p className="p-6 text-center text-gray-500">
            No referrals yet. Share your code to get started!
          </p>
        ) : (
          data.map((row) => {
            const s = STATUS_MAP[row.status];
            return (
              <div key={row.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.email}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                    {s.label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Joined</span>
                  <span>{row.joinedAt}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reward</span>
                  <span className="font-medium">{formatReward(row.reward)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t text-sm text-gray-600">
        <p>
          {totalItems === 0
            ? "No referrals"
            : `Showing ${startItem}–${endItem} of ${totalItems}`}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="border rounded px-2 py-1"
            >
              {[5, 10, 20].map((s) => (
                <option key={s} value={s}>{s}</option>
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
              disabled={page === totalPages || totalPages === 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ReferralTable);
