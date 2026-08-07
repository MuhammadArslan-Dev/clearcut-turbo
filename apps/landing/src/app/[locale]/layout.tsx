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
import AnalyticsProvider from "@clearcut/analytics/provider";
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
        {/* dns-prefetch only — no preconnect.
            Lighthouse flagged this app for too many preconnect origins. A
            preconnect holds a DNS + TCP + TLS connection open, which is only
            worth paying for an origin needed during FIRST RENDER.
            app.clearcutoff.in is the authenticated dashboard: it is reached by
            navigating away after a login click, never during first paint, so
            the DNS hint is the right weight of hint for it.
            apptest.clearcutoff.in (the staging backend) was preconnected from
            production pages and is removed entirely — production traffic should
            never be opening connections to a test origin. */}
        <link rel="dns-prefetch" href="https://app.clearcutoff.in" />
      </head>
      <body className="font-sans">
        <ReactQueryProvider>
          <NextIntlClientProvider>
            <AuthProvider>{children}</AuthProvider>
          </NextIntlClientProvider>

          <AnalyticsProvider />

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
