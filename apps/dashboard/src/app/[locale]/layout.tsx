import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@clearcut/i18n/routing";

import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "../../styles/globals.css";
import ThemeProvider from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import LazyGTM from "@/components/thirdparties/LazyGTM";
import LazyClarity from "@/components/thirdparties/LazyClarity";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { Suspense } from "react";
import FacebookPixel from "@/components/thirdparties/FacebookPixel";
import GlobalModalReset from "@/components/thirdparties/GlobalModalReset";
import ChunkErrorReload from "@/components/thirdparties/ChunkErrorReload";
import { SoundProvider } from "@/context/SoundContext";
import { Agentation } from "agentation";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"], // you can pick which weights you need
  display: "swap",
});

// Devanagari face for the `hi` locale, applied via the `:lang(hi)` rule in
// styles/globals.css. Dashboard serves /hi but shipped no Devanagari font before
// this. `preload: false` mirrors apps/landing so English pages don't pay for a
// face they never paint; it still loads on demand under font-display: swap.
const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Clear Cutoff",
    template: "%s | Clear Cutoff",
  },
  description:
    "Clear Cutoff helps you crack teaching exams like CTET, HTET, UPTET with focused courses and test series.",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    title: "ClearCutOff",
  },
  openGraph: {
    title: "Clear Cutoff",
    description:
      "Clear Cutoff helps you crack teaching exams like CTET, HTET, UPTET with focused courses and test series.",
    url: "/",
    siteName: "Clear Cutoff",
    images: [
      {
        url: "https://www.clearcutoff.in/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clear Cutoff preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Clear Cutoff",
    description:
      "Clear Cutoff helps you crack teaching exams like CTET, HTET, UPTET with focused courses and test series.",
    images: ["https://www.clearcutoff.in/icons/og-image.png"],
  },
  manifest: "/site.webmanifest",
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // const fontClass =
  //   locale === "ur"
  //     ? `${notoNastaliqUrdu.variable}`
  //     : `${notoSans.variable}`;

  // Both faces expose their CSS variable; the `:lang(hi)` rule decides which one
  // paints. These MUST sit on <html>, not <body> (matching apps/landing):
  // --font-latin is declared at :root by @theme and references --font-noto-sans,
  // so if the next/font class is on <body> that reference is out of scope at :root
  // and --font-latin resolves to nothing. Measured in blog: with the class on
  // <body>, --font-latin read EMPTY and pages fell back to Times New Roman.
  const fontClass = `${notoSans.variable} ${notoSansDevanagari.variable}`;
  // Enable static rendering
  setRequestLocale(locale);
  return (
    <html lang={locale} className={fontClass}>
      <body suppressHydrationWarning className="antialiased">
        <Suspense fallback={null}>
          <GlobalModalReset />
          <ChunkErrorReload />
          <FacebookPixel />
          <AuthProvider>
            <SoundProvider>
              <NextIntlClientProvider>
                <ReactQueryProvider>
                  {/* <AuthProvider> */}
                  <ThemeProvider>
                    <AnalyticsProvider>{children}</AnalyticsProvider>
                    <LazyGTM />
                    <LazyClarity />
                  </ThemeProvider>
                </ReactQueryProvider>

                {/* </AuthProvider> */}
              </NextIntlClientProvider>
              {/* {process.env.MODE === "production" && (
          <> */}
            </SoundProvider>
          </AuthProvider>
        </Suspense>

        {/* </> */}
        {/* )} */}

        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
