import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "@/app/globals.css";
import MainThemeProvider from "@/components/providers/main-theme-provider";
import { AuthProvider, AuthModal } from "@/lib/auth";
import { buildMetadata } from "@clearcut/utils/build-metadata";

export const dynamicParams = true;

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"], // you can pick which weights you need
  display: "swap",
});

export const metadata: Metadata = {
  ...buildMetadata({
    siteName: "Clear Cutoff",
    description:
      "Clear Cutoff helps you crack teaching exams like CTET, HTET, UPTET with focused courses and test series.",
    ogImage: "https://www.clearcutoff.in/icons/og-image.png",
  }),
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

  const fontClass = notoSans.variable;
  // Enable static rendering
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fontClass} antialiased `}>
          <MainThemeProvider>
            <NextIntlClientProvider>
              <AuthProvider>
                {children}
                <AuthModal />
              </AuthProvider>
            </NextIntlClientProvider>
          </MainThemeProvider>
      </body>
    </html>
  );
}
