"use client";
import { useEffect, useState } from "react";
import DotsLoader from "./ui/loader/DotsLoader";

// src/components/FullScreenLoader.tsx
export default function FullScreenLoader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // 🔥 critical

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner */}
        <MainLoader />
        {/* Text */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Clear Cutoff
          </p>
          {/* <p className="mt-2 text-lg font-semibold text-white">
            Preparing your dashboard…
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Authenticating your session. This will only take a moment.
          </p> */}
        </div>

        {/* Subtle pulsing dots */}
        <DotsLoader />
      </div>
    </div>
  );
}

export const MainLoader = () => {
  return (
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand border-t-transparent" />
    </div>
  );
};
