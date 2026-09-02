import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@clearcut/i18n/routing";

import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "@/app/globals.css";
import MainThemeProvider from "@/components/providers/main-theme-provider";
import { AuthProvider, AuthModal } from "@/lib/auth";
import { buildMetadata } from "@clearcut/utils/build-metadata";
import AnalyticsProvider from "@clearcut/analytics/provider";
import { Agentation } from "agentation";

export const dynamicParams = true;

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"], // you can pick which weights you need
  display: "swap",
});

// Devanagari face for the `hi` locale, applied via the `:lang(hi)` rule in
// globals.css. Blog serves /hi but previously shipped no Devanagari font, so
// Hindi text rendered in whatever the OS substituted. `preload: false` mirrors
// apps/landing: English pages must not pay for a font they never paint, and the
// face still arrives on demand under font-display: swap. Weights match the Latin
// face so the shared --fw-* defaults (400/500/600) resolve to real faces.
const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  ...buildMetadata({
    siteName: "Clear Cutoff",
    description:
      "Clear Cutoff helps you crack teaching exams like CTET, HTET, UPTET with focused courses and test series.",
    ogImage: "https://www.clearcutoff.in/icons/og-image.png",
  }),
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

  // Both faces expose their CSS variable; which one paints is decided by the
  // `:lang(hi)` rule, not by the class list.
  //
  // These MUST sit on <html>, not <body> (matching apps/landing). --font-latin is
  // declared at :root by @theme, and its value references --font-noto-sans; if the
  // next/font class is on <body>, that reference is out of scope at :root, so
  // --font-latin becomes invalid at computed-value time and resolves to nothing.
  // Measured: with the class on <body>, --font-latin read EMPTY and every page
  // fell back to Times New Roman.
  const fontClass = `${notoSans.variable} ${notoSansDevanagari.variable}`;
  // Enable static rendering
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontClass} suppressHydrationWarning>
      <body className="antialiased">
          <MainThemeProvider>
            <NextIntlClientProvider>
              <AuthProvider>
                {children}
                <AuthModal />
              </AuthProvider>
            </NextIntlClientProvider>
          </MainThemeProvider>

          <AnalyticsProvider />

          {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
