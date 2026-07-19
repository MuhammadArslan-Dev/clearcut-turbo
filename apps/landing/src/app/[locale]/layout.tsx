import type { Metadata, Viewport } from "next";
import "../../styles/globals.css";

import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@clearcut/i18n/routing";
import { ReactQueryProvider } from "@clearcut/react-query/provider";
import AnalyticsLoader from "@/components/global/AnalyticsLoader";
import { AuthProvider, AuthModal } from "@/lib/auth";
import { Suspense } from "react";
import LazyGTM from "@/components/thirdparties/LazyGTM";
import FacebookPixel from "@/components/thirdparties/FacebookPixel";
import { buildMetadata } from "@clearcut/utils/build-metadata";

const SITE_URL = "https://clearcutoff.in";
const SITE_NAME = "Clear Cutoff";
const DESCRIPTION =
  "Clear Cutoff helps you crack teaching exams like CTET, HTET, UPTET with focused courses and test series.";
const OG_IMAGE = "https://www.clearcutoff.in/icons/og-image.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...buildMetadata({
    siteName: SITE_NAME,
    description: DESCRIPTION,
    ogImage: OG_IMAGE,
  }),
};

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans",
  preload: true,
});

// Devanagari face for Hindi. Applied via the `:lang(hi)` rule in globals.css,
// so it only renders on Hindi (`/hi`) pages. Not preloaded to keep English
// pages lean (it still loads on demand via font-display: swap).
const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-noto-devanagari",
  preload: false,
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};

const isProduction = process.env.ENVIRONMENT === "production";

// Pre-render both locales at build time. Only `en` and `hi` are valid.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${notoSans.variable} ${notoSansDevanagari.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://app.clearcutoff.in" />
        <link rel="dns-prefetch" href="https://app.clearcutoff.in" />
        <link rel="preconnect" href="https://apptest.clearcutoff.in" />
        <link rel="dns-prefetch" href="https://apptest.clearcutoff.in" />
      </head>
      <body className="font-sans">
        <ReactQueryProvider>
          <NextIntlClientProvider>
            <AuthProvider>{children}</AuthProvider>
          </NextIntlClientProvider>

          {isProduction && <LazyGTM />}

          <Suspense fallback={null}>
            <FacebookPixel />
          </Suspense>

          <Suspense fallback={null}>
            <AuthModal />
          </Suspense>

          <Suspense fallback={null}>
            <AnalyticsLoader />
          </Suspense>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
