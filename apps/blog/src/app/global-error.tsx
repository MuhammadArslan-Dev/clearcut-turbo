"use client";

import { Noto_Sans } from "next/font/google";
import "@/app/globals.css";
import ErrorPage from "@/components/error-page";
import { ReportBoundaryError } from "@/components/page-error-reporter";

// Last-resort boundary: replaces the whole document (root layout included)
// when the root layout itself throws, so it must supply <html>/<body> and, like
// the root not-found.tsx, load its own font (no layout above to provide the
// CSS variable). Must live at app/global-error.tsx — the previous copy under
// [locale]/ was never picked up by Next and, being unreachable, reported
// nothing either.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body className={`${notoSans.variable} antialiased`}>
        <ReportBoundaryError error={error} boundary="global-error" />
        <div className="flex items-center justify-center min-h-screen w-full">
          <ErrorPage variant="500" />
        </div>
      </body>
    </html>
  );
}
