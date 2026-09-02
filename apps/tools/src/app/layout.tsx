import type { Metadata } from "next";
import "./globals.css";

// Next's Metadata API does NOT auto-prefix icons/manifest URLs with
// basePath (unlike next/image or next/link) — the same class of bug as
// ToolBreadcrumbs' basePath fix. These files are served at
// /tools/resizer/favicon.ico etc, so the emitted <link> tags must spell
// that prefix out explicitly or they 404.
const BASE_PATH = "/tools/resizer";

export const metadata: Metadata = {
  metadataBase: new URL("https://clearcutoff.in"),
  title: {
    default: "Photo & Signature Resizer | Clear Cutoff",
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
  appleWebApp: {
    title: "ClearCutOff",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-text-gray-normal">{children}</body>
    </html>
  );
}
