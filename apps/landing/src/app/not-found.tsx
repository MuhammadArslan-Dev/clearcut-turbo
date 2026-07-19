import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "@/styles/globals.css";
import NotFoundContentRoot from "@/components/not-found-content-root";

// Root-level fallback for paths that don't match the [locale] segment at
// all (e.g. malformed/deeply-nested URLs) — Next.js falls through all the
// way to here, bypassing apps/landing/src/app/[locale]/not-found.tsx
// entirely, since no parent layout supplies <html>/<body> at this level —
// including [locale]/layout.tsx's Noto_Sans font variable classes. Without
// loading the font here too, var(--font-noto-sans) (which --font-latin is
// built from) is undefined in this route, which invalidates the whole
// `font-family: var(--font-latin);` declaration (per the CSS
// custom-properties spec: an undefined var() with no in-parens fallback
// invalidates the entire value it's used in) — so every element here
// silently falls back to the browser's absolute default (Times New Roman)
// instead of Noto Sans.
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

export default function NotFound() {
  return (
    <html className={`${notoSans.variable} ${notoSansDevanagari.variable}`}>
      <body>
        <div className="min-h-screen w-full flex justify-center items-center">
          <NotFoundContentRoot />
        </div>
      </body>
    </html>
  );
}
