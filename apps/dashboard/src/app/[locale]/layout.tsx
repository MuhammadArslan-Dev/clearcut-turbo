import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@clearcut/i18n/routing";

import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import "../../styles/globals.css";
import ThemeProvider from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import LazyGTM from "@/components/thirdparties/LazyGTM";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { Suspense } from "react";
import FacebookPixel from "@/components/thirdparties/FacebookPixel";
import { SoundProvider } from "@/context/SoundContext";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"], // you can pick which weights you need
  display: "swap",
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
      { url: "/icons/Logo-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/Logo-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/Logo-48x48.png",
    shortcut: "/icons/favicon.ico",
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

  const fontClass = notoSans.variable;
  // Enable static rendering
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <head>
        {/* MathJax config must be a synchronous inline script so it runs before the CDN loads.
            next/script "beforeInteractive" only works in the root layout, so we use a raw <script> here. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$']],
                  displayMath: [['$$', '$$']],
                  processEscapes: true,
                  tags: 'ams',
                  tagSide: 'right',
                  tagIndent: '0.2em'
                },
                output: { font: 'mathjax-newcm' },
                startup: {
                  pageReady: function() {
                    return MathJax.startup.defaultPageReady().then(function() {
                      window.dispatchEvent(new Event('mathjax-ready'));
                    });
                  }
                }
              };
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${fontClass} antialiased `}>
        <Suspense fallback={null}>
          <FacebookPixel />
          <AuthProvider>
            <SoundProvider>
              <NextIntlClientProvider>
                <ReactQueryProvider>
                  {/* <AuthProvider> */}
                  <ThemeProvider>
                    <AnalyticsProvider>{children}</AnalyticsProvider>
                    <LazyGTM />
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
      </body>
    </html>
  );
}
