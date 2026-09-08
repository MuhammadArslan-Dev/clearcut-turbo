"use client";
import DotsLoader from "./ui/loader/DotsLoader";

// src/components/FullScreenLoader.tsx
//
// Deliberately no mount-gate here: every caller (ProtectedPage etc.) renders
// this from state that starts identically on server and client (e.g.
// `tokenReady = useState(false)`), so there's no hydration mismatch to guard
// against — and gating the loader itself behind a client-only "mounted" flip
// meant the one thing meant to give INSTANT feedback instead rendered
// nothing until after hydration, showing a blank white screen on every fresh
// load/refresh before the spinner ever appeared.
export default function FullScreenLoader() {
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
