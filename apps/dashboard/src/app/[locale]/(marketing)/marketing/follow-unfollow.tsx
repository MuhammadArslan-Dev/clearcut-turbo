"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Page() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <AnimatedProfileCard />
    </div>
  );
}

/* ---------- Animated background ---------- */

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <motion.div
        className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl"
        animate={{ x: [0, 40, -10, 0], y: [0, 10, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-16 h-80 w-80 rounded-full bg-purple-500/25 blur-3xl"
        animate={{ x: [0, -20, 30, 0], y: [0, -30, 10, 0] }}
        transition={{ duration: 22, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
        animate={{ y: [0, -25, 15, 0] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
      />
    </div>
  );
}

/* ---------- Animated card ---------- */

function AnimatedProfileCard() {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <motion.div
      className="relative w-[320px] rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-slate-50 shadow-2xl backdrop-blur-xl"
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      whileHover={{ y: -10, boxShadow: "0 25px 70px rgba(15,23,42,0.8)" }}
    >
      {/* floating glow behind avatar */}
      <motion.div
        className="absolute left-1/2 top-6 h-24 w-24 -translate-x-1/2 rounded-full bg-blue-500/40 blur-2xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
      />

      {/* Avatar */}
      <motion.div
        className="mx-auto mb-4 h-20 w-20 rounded-full border border-white/30 bg-gradient-to-br from-sky-400 to-indigo-500 p-[3px]"
        whileHover={{ rotate: 2 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-3xl font-bold">
          JP
        </div>
      </motion.div>

      {/* Name + role */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Jay Patel</h2>
        <p className="text-xs text-slate-400">
          Frontend Engineer · Motion UI Lover
        </p>
      </div>

      {/* Tags */}
      <div className="mb-5 flex flex-wrap justify-center gap-2 text-[11px]">
        <Tag>React</Tag>
        <Tag>Next.js</Tag>
        <Tag>Framer Motion</Tag>
      </div>

      {/* Follow button with animated text */}
      <motion.button
        type="button"
        onClick={() => setIsFollowing((v) => !v)}
        className={`relative flex w-full items-center justify-center rounded-full px-4 py-2 text-xs font-semibold tracking-wide
          ${
            isFollowing
              ? "bg-slate-900 border border-emerald-400 text-emerald-200"
              : "bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-400 text-slate-950"
          }`}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isFollowing ? (
            <motion.span
              key="following"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2"
            >
              <motion.span
                className="h-3 w-3 rounded-full bg-emerald-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              />
              Following
            </motion.span>
          ) : (
            <motion.span
              key="follow"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              Follow
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Small stats row */}
      <div className="mt-5 flex items-center justify-between text-[11px] text-slate-400">
        <Stat label="Projects" value="24" />
        <Stat label="Followers" value="3.2k" />
        <Stat label="Following" value="180" />
      </div>
    </motion.div>
  );
}

/* ---------- Small sub‑components ---------- */

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-0.5"
      whileHover={{ scale: 1.05, y: -1 }}
      transition={{ type: "spring", stiffness: 250, damping: 18 }}
    >
      {children}
    </motion.span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-xs text-slate-100 font-semibold">{value}</div>
      <div>{label}</div>
    </motion.div>
  );
}