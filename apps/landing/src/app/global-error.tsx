"use client";

import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "@/styles/globals.css";
import ErrorContentRoot from "@/components/error-content-root";
import { ReportBoundaryError } from "@/components/page-error-reporter";

// Last-resort boundary: replaces the whole document (root layout included)
// when [locale]/layout itself throws, so it supplies <html>/<body> and, like
// the root not-found.tsx, its own font variables (no layout above to provide
// them). Reports the original error instead of swallowing it.
const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans",
  preload: true,
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-noto-devanagari",
  preload: false,
});

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html className={`${notoSans.variable} ${notoSansDevanagari.variable}`}>
      <body>
        <ReportBoundaryError error={error} boundary="global-error" />
        <div className="min-h-screen w-full flex justify-center items-center">
          <ErrorContentRoot />
        </div>
      </body>
    </html>
  );
}
