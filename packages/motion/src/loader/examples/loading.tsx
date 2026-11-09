// app/(app)/loading.tsx  — Next.js App Router Suspense fallback.
// Put this in the logged-in app segment (tests, dashboard), NOT at app/loading.tsx
// above marketing/SEO pages — those should stream real content, not a splash.
import { CCLoader } from "@clearcut/motion/loader"; // adjust to your Turborepo package path

export default function Loading() {
  // Uncontrolled: shows after 250ms via CSS, so fast navigations never flash it.
  return <CCLoader variant="fullscreen" />;
}
