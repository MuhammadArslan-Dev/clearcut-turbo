import type { Metadata } from "next";
import "./globals.css";
import { Agentation } from "agentation";
import LazyGTM from "@clearcut/analytics/lazy-gtm";
import LazyClarity from "@clearcut/analytics/lazy-clarity";
import PageViewTracker from "@/components/analytics/PageViewTracker";

// Same shared GTM container blog/landing use — hardcoded fallback so this
// works with zero env setup (matching toolsAnalytics.ts's Amplitude key),
// same "NEXT_PUBLIC_* can override per-env" pattern. Clarity has no safe
// default to hardcode (its project ID isn't shared/public like this GTM
// container), so it stays env-only (blank = off) until one is configured for
// tools specifically; it also already rides along with whatever tags are
// configured inside this GTM container once GTM itself loads.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-WC2GWW9Z";

// Next's Metadata API does NOT auto-prefix icons/manifest URLs with
// basePath (unlike next/image or next/link). These files live in public/,
// which basePath serves at the app's root — /tools/favicon.ico etc — so the
// emitted <link> tags must spell that prefix out explicitly or they 404.
const BASE_PATH = "/tools";

export const metadata: Metadata = {
  metadataBase: new URL("https://clearcutoff.in"),
  title: {
    default: "Free Tools | Clear Cutoff",
    template: "%s",
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon-96x96.png`, sizes: "96x96", type: "image/png" },
      { url: `${BASE_PATH}/favicon.svg`, type: "image/svg+xml" },
    ],
    shortcut: `${BASE_PATH}/favicon.ico`,
    apple: [{ url: `${BASE_PATH}/apple-touch-icon.png`, sizes: "180x180" }],
  },
  manifest: `${BASE_PATH}/site.webmanifest`,
  applicationName: "Clear Cutoff Tools",
  // Explicit index/follow plus the preview limits Google documents for
  // snippets/thumbnails. Pages that must stay out of the index opt out per
  // page via buildMetadata({ noindex: true }) (lib/seo.ts).
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  appleWebApp: {
    title: "ClearCutOff",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-text-gray-normal">
        {children}
        <LazyGTM gtmId={GTM_ID} />
        <LazyClarity />
        <PageViewTracker />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
