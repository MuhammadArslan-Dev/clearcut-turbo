"use client";

import React, { useState, useCallback } from "react";
import { Copy, Check, Users, Gift, Clock } from "lucide-react";
import ReferralTable, { ReferralRow } from "./ReferralTable";

/* ----------------------------------------------------------
 * Static mock data — replace with API calls when backend ready
 * ---------------------------------------------------------- */
const MOCK_REFERRALS: ReferralRow[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    joinedAt: "01 Jun 2026",
    status: "completed",
    reward: 200,
  },
  {
    id: "2",
    name: "Priya Singh",
    email: "priya@example.com",
    joinedAt: "05 Jun 2026",
    status: "pending",
    reward: null,
  },
  {
    id: "3",
    name: "Amit Kumar",
    email: "amit@example.com",
    joinedAt: "08 Jun 2026",
    status: "pending",
    reward: null,
  },
];

const REFERRAL_CODE = "CLEAR2026";

/* ----------------------------------------------------------
 * Stat card
 * ---------------------------------------------------------- */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 px-5 py-4">
      <div className={`flex items-center justify-center w-11 h-11 rounded-full ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
 * Main component
 * ---------------------------------------------------------- */
export default function ReferralWrap() {
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const data = MOCK_REFERRALS;
  const totalReferrals = data.length;
  const completed = data.filter((r) => r.status === "completed").length;
  const pending = data.filter((r) => r.status === "pending").length;
  const totalEarned = data.reduce((sum, r) => sum + (r.reward ?? 0), 0);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(REFERRAL_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handlePageChange = useCallback((p: number) => setPage(p), []);
  const handlePageSizeChange = useCallback((s: number) => {
    setPageSize(s);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-sm text-gray-500 mt-1">
          Invite friends to ClearCutoff and earn rewards when they subscribe.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Referrals"
          value={totalReferrals}
          color="bg-brand"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={pending}
          color="bg-yellow-400"
        />
        <StatCard
          icon={Gift}
          label="Total Earned"
          value={`₹${totalEarned.toLocaleString("en-IN")}`}
          color="bg-green-500"
        />
      </div>

      {/* Referral code box */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Your Referral Code</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 border border-dashed border-gray-300 rounded-md px-4 py-3">
            <span className="text-lg font-bold tracking-widest text-brand">
              {REFERRAL_CODE}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-3 rounded-md bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Share this code with friends. You earn ₹200 when they complete their first subscription.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">How It Works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Share Your Code", desc: "Send your referral code to friends via WhatsApp, email or social media." },
            { step: "2", title: "Friend Signs Up", desc: "Your friend creates an account on ClearCutoff using your referral code." },
            { step: "3", title: "Earn Rewards", desc: "Once they subscribe to any plan, you both earn rewards automatically." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-bold">
                {step}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral history table */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Referral History</p>
        <ReferralTable
          data={data}
          totalItems={data.length}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}
