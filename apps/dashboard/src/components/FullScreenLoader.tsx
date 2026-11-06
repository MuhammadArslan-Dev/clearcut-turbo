// src/components/FullScreenLoader.tsx
//
// The one place the dashboard's loader is chosen. Every call site (ProtectedPage, /dashboard, payment/initiated,
// ContentShell) imports from here, so switching is a one-line change and nothing else moves.
//
// Phase 83 (approved): the new "Lesson Path" loader (loader/AppLoader.tsx, @clearcut/motion CCLoader) is active.
// The previous loader is kept untouched — packages/ui/src/full-screen-loader.tsx (still used by apps/landing) —
// and backed up in loader/legacy/ (see its README). Revert: NEXT_PUBLIC_LEGACY_LOADER=true (rebuild) or
// USE_LEGACY = true below.
import LegacyFullScreenLoader, { MainLoader as LegacyMainLoader } from "@clearcut/ui/full-screen-loader";
import { AppFullScreenLoader, AppMainLoader } from "@/components/loader/AppLoader";

const USE_LEGACY = process.env.NEXT_PUBLIC_LEGACY_LOADER === "true";

const FullScreenLoader = USE_LEGACY ? LegacyFullScreenLoader : AppFullScreenLoader;
export const MainLoader = USE_LEGACY ? LegacyMainLoader : AppMainLoader;
export default FullScreenLoader;
