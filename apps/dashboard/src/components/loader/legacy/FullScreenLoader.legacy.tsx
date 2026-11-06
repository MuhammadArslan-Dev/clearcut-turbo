/**
 * Shared full-screen loading state — originally apps/dashboard's own
 * FullScreenLoader, promoted here so apps/landing's auth-redirect loader
 * (see AuthRedirectLoader.tsx + the blocking pre-hydration script in
 * apps/landing/src/app/[locale]/layout.tsx) can show the exact same look
 * instead of a hand-duplicated copy. No "use client" and no hooks — pure
 * markup — so it renders identically whether mounted client-side (dashboard,
 * post-hydration) or server-rendered as static, always-present-but-hidden
 * HTML (landing, has to exist before hydration to avoid a content flash).
 */
export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <MainLoader />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Clear Cutoff
        </p>
        <Dots />
      </div>
    </div>
  );
}

export function MainLoader() {
  return (
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-[var(--color-brand)] border-t-transparent" />
    </div>
  );
}

/** Self-contained (not dashboard's parameterized DotsLoader, which is a
 * dashboard-local "use client" component — a shared package can't depend on
 * app code) — same 3-dot pulse animation, fixed to this component's needs. */
function Dots() {
  return (
    <div
      style={{
        width: "56px",
        height: "27px",
        background:
          "radial-gradient(circle closest-side, var(--color-brand) 90%, transparent) 0% 50%, radial-gradient(circle closest-side, var(--color-brand) 90%, transparent) 50% 50%, radial-gradient(circle closest-side, var(--color-brand) 90%, transparent) 100% 50%",
        backgroundSize: "calc(100% / 3) 13.5px",
        backgroundRepeat: "no-repeat",
        animation: "cc-full-screen-loader-dots 1s infinite linear",
      }}
    >
      <style>{`
        @keyframes cc-full-screen-loader-dots {
          20% { background-position: 0% 0%, 50% 50%, 100% 50%; }
          40% { background-position: 0% 100%, 50% 0%, 100% 50%; }
          60% { background-position: 0% 50%, 50% 100%, 100% 0%; }
          80% { background-position: 0% 50%, 50% 50%, 100% 100%; }
        }
      `}</style>
    </div>
  );
}
