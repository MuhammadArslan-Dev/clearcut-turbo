// src/components/FullScreenLoader.tsx
//
// Re-exports the shared @clearcut/ui/full-screen-loader component (same one
// apps/landing uses for its auth-redirect loader — see that app's
// AuthRedirectLoader.tsx) so both apps show the identical loading state
// instead of maintaining duplicate copies. Kept as a re-export file, not a
// straight import-and-replace at every call site, so every existing
// `@/components/FullScreenLoader` import (ProtectedPage, payment/initiated,
// ContentShell, dashboard/page.tsx) keeps working unchanged.
export { default, MainLoader } from "@clearcut/ui/full-screen-loader";
