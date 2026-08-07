import { Noto_Sans } from "next/font/google";
import "@/app/globals.css";

import ErrorPage from '@/components/error-page'

// This is the root-level not-found.tsx (outside [locale]), so it does not
// inherit [locale]/layout.tsx's <body> — including the Noto_Sans font
// variable class that lives on it. Without loading the font here too,
// var(--font-noto-sans) is undefined in this route, which invalidates the
// whole `font-family: var(--font-noto-sans), sans-serif;` declaration
// (per the CSS custom-properties spec: an undefined var() with no
// in-parens fallback invalidates the entire value it's used in, not just
// that one entry) — so every element here silently falls back to the
// browser's absolute default (Times New Roman) instead of Noto Sans.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export default function NotFound() {
  return (
    <html>
      <body className={`${notoSans.variable} antialiased`}>
        <div className="flex items-center justify-center min-h-screen w-full">
          <ErrorPage />
        </div>
      </body>
    </html>
  )
}