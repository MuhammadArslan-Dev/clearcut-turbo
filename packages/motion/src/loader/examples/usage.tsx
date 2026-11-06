"use client";
// Usage patterns. Copy what you need; this file isn't imported anywhere.
import { useState } from "react";
import { CCLoader } from "@clearcut/motion/loader";

// 1) Controlled overlay — e.g. starting a test or verifying a Razorpay payment.
export function StartTestButton({ start }: { start: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        className="rounded-[50px] bg-brand px-6 py-3 font-semibold text-white disabled:opacity-80"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try { await start(); } finally { setBusy(false); }
        }}
      >
        {busy ? <CCLoader variant="compact" tone="onBrand" label="Starting test" /> : "Start test"}
      </button>

      {/* delay 250ms → never flashes; minDuration 700ms → never flickers */}
      <CCLoader variant="fullscreen" active={busy} label="Setting up your test" />
    </>
  );
}

// 2) Inline — a card/section whose data is loading.
export function ResultsCard({ loading }: { loading: boolean }) {
  return loading ? (
    <CCLoader variant="inline" label="Checking your answers" tips={false} />
  ) : (
    <div>{/* results */}</div>
  );
}

// 3) Hindi copy + OMR options as क ख ग घ.
export const HindiLoader = () => <CCLoader variant="inline" lang="hi" />;

// 4) Replace the old ring spinner everywhere:
//    rg 'animate-spin rounded-full border-4' apps packages
//    → <CCLoader variant="compact" /> for small spots, "inline" for sections.
