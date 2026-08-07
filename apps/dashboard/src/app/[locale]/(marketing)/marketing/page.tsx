"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "reports", label: "Reports", icon: "📊" },
  { id: "billing", label: "Billing", icon: "💳" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

const sidebarVariants = {
  open: { width: 220 },
  closed: { width: 72 },
};

const navLabelVariants = {
  open: { opacity: 1, x: 0, pointerEvents: "auto" as const },
  closed: { opacity: 0, x: -10, pointerEvents: "none" as const },
};

const cardsContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 160, damping: 18 },
  },
};

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("overview");
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {/* Sidebar */}
      <motion.aside
        className="flex flex-col border-r border-slate-800 bg-slate-900/80"
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        initial="open"
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-sky-500 flex items-center justify-center text-xs font-bold">
              DX
            </div>
            <motion.span
              className="text-xs font-semibold tracking-wide text-slate-200"
              variants={navLabelVariants}
            >
              DashX
            </motion.span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-full p-1 text-xs text-slate-400 hover:bg-slate-800"
          >
            {sidebarOpen ? "«" : "»"}
          </button>
        </div>

        <nav className="mt-2 flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const active = item.id === activeNav;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className="relative flex items-center gap-3 rounded-xl px-2 py-2 text-xs text-slate-300"
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-slate-800/80"
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 22,
                    }}
                  />
                )}
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80">
                  {item.icon}
                </span>
                <motion.span
                  className="relative z-10"
                  variants={navLabelVariants}
                  transition={{ duration: 0.15 }}
                >
                  {item.label}
                </motion.span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 text-[11px] text-slate-500">
          <p className="mb-1 font-medium text-slate-300">Usage</p>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-400"
              initial={{ width: "0%" }}
              animate={{ width: "64%" }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </div>
          <p className="mt-1">64% of monthly limit</p>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-4">
          <div>
            <h1 className="text-sm font-semibold">
              {activeNav === "overview" && "Overview"}
              {activeNav === "reports" && "Reports"}
              {activeNav === "billing" && "Billing"}
              {activeNav === "settings" && "Settings"}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Animated dashboard layout with sidebar and modal.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <motion.button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-400 px-4 py-1.5 font-semibold text-slate-950"
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -1, boxShadow: "0 12px 30px rgba(56,189,248,0.45)" }}
            >
              New report
            </motion.button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-slate-800" />
              <span className="text-slate-300">You</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* cards */}
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={cardsContainer}
            initial="hidden"
            animate="show"
            key={activeNav} // re-run animation when section changes
          >
            <DashboardCard
              title="Revenue"
              value="$12,340"
              change="+8.2% vs last month"
            />
            <DashboardCard
              title="Active Users"
              value="1,284"
              change="+3.1% vs last week"
            />
            <DashboardCard
              title="Conversion"
              value="4.8%"
              change="+0.6 pts vs yesterday"
            />
            <DashboardCard
              title="Bounce rate"
              value="32%"
              change="-4.2% vs last month"
            />
            <DashboardCard
              title="Avg. session"
              value="03:24"
              change="+18s vs last week"
            />
            <DashboardCard
              title="Support tickets"
              value="14"
              change="-6 open today"
            />
          </motion.div>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ReportModal onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------ Reusable components ------------ */

function DashboardCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) {
  return (
    <motion.div
      className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm shadow-sm"
      variants={cardVariant}
      whileHover={{
        y: -3,
        borderColor: "#38bdf8",
        boxShadow: "0 18px 40px rgba(15,23,42,0.85)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="text-[11px] text-slate-400 mb-1">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-lg font-semibold text-slate-50">{value}</div>
        <div className="text-[11px] text-emerald-400">{change}</div>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-sky-400"
          initial={{ width: "0%" }}
          animate={{ width: `${40 + Math.random() * 40}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
      </div>
    </motion.div>
  );
}

function ReportModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 px-5 py-5 shadow-2xl"
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Create quick report</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mb-4">
          Pick a range and metric. This is only a mock modal for practicing
          animation.
        </p>

        <div className="space-y-3 text-[11px]">
          <div>
            <label className="block mb-1 text-slate-300">
              Date range
            </label>
            <div className="flex gap-2">
              {["Last 7 days", "Last 30 days", "This year"].map((r) => (
                <motion.button
                  key={r}
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-1"
                >
                  {r}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-slate-300">
              Primary metric
            </label>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]">
              <option>Revenue</option>
              <option>Active users</option>
              <option>Conversion rate</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 text-[11px]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 px-3 py-1 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-400 px-4 py-1 font-semibold text-slate-950"
          >
            Generate
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}