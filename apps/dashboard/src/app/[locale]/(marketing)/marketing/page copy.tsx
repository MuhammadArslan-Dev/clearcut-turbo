"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

export default function Page() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType) => {
    const id = Date.now();

    const presets: Record<ToastType, Pick<Toast, "title" | "message">> = {
      success: {
        title: "Saved successfully",
        message: "Your changes have been stored in the database.",
      },
      error: {
        title: "Something went wrong",
        message: "We couldn’t reach the server. Please try again.",
      },
      info: {
        title: "Heads up",
        message: "New features are rolling out to your account today.",
      },
    };

    setToasts((prev) => [...prev, { id, type, ...presets[type] }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      {/* Controls */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl max-w-md w-full">
        <h1 className="text-lg font-semibold mb-1">Toast notifications</h1>
        <p className="text-[11px] text-slate-400 mb-4">
          Click any button to spawn an animated toast. Try swiping a toast to
          dismiss it.
        </p>

        <div className="flex gap-3 text-[11px]">
          <button
            type="button"
            onClick={() => addToast("success")}
            className="flex-1 rounded-full bg-emerald-500/90 px-3 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Show success
          </button>
          <button
            type="button"
            onClick={() => addToast("error")}
            className="flex-1 rounded-full bg-rose-500/90 px-3 py-2 font-semibold text-slate-950 hover:bg-rose-400"
          >
            Show error
          </button>
          <button
            type="button"
            onClick={() => addToast("info")}
            className="flex-1 rounded-full bg-sky-500/90 px-3 py-2 font-semibold text-slate-950 hover:bg-sky-400"
          >
            Show info
          </button>
        </div>
      </div>

      {/* Toast stack in bottom-right */}
      <ToastStack toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

/* ================= Toast stack ================= */

const toastVariants = {
  initial: { opacity: 0, x: 80, y: 10, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
  exit: {
    opacity: 0,
    x: 80,
    scale: 0.9,
    transition: { duration: 0.18 },
  },
};

function ToastStack({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ================= Single toast ================= */

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: number) => void;
}) {
  // auto‑dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const colors =
    toast.type === "success"
      ? { bar: "bg-emerald-400", icon: "✅" }
      : toast.type === "error"
      ? { bar: "bg-rose-400", icon: "⚠️" }
      : { bar: "bg-sky-400", icon: "ℹ️" };

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80) onRemove(toast.id);
      }}
      className="pointer-events-auto flex min-w-[260px] max-w-xs items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/95 px-3 py-3 text-[11px] shadow-xl"
    >
      {/* Colored bar */}
      <div className="flex flex-col items-center">
        <motion.div
          className={`h-8 w-1 rounded-full ${colors.bar}`}
          layout
        />
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">{colors.icon}</span>
            <h3 className="text-[11px] font-semibold text-slate-50">
              {toast.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onRemove(toast.id)}
            className="text-[10px] text-slate-400 hover:text-slate-100"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-[10px] text-slate-300">
          {toast.message}
        </p>

        {/* progress bar that shrinks over time */}
        <motion.div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800"
        >
          <motion.div
            className={`h-full ${colors.bar}`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 4, ease: "linear" }}
            style={{ originX: 0 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}