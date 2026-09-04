import type { Metadata } from "next";
import "./globals.css";
import { Agentation } from "agentation";

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
  appleWebApp: {
    title: "ClearCutOff",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-text-gray-normal">
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
