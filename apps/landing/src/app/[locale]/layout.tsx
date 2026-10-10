import type { Metadata, Viewport } from "next";
import "../../styles/globals.css";

import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ReactQueryProvider } from "@clearcut/react-query/provider";
import AnalyticsLoader from "@/components/global/AnalyticsLoader";
import { AuthProvider, AuthModal } from "@/lib/auth";
import AuthRedirectLoader from "@/components/layout/AuthRedirectLoader";
import FullScreenLoader from "@clearcut/ui/full-screen-loader";
import { Suspense } from "react";
import AnalyticsProvider from "@clearcut/analytics/provider";
import FacebookPixel from "@/components/thirdparties/FacebookPixel";
import { buildMetadata } from "@clearcut/utils/build-metadata";
import { Agentation } from "agentation";

const SITE_URL = "https://clearcutoff.in";
// Same var + fallback as REDIRECT_BASE_URL in lib/auth.ts.
const REDIRECT_BASE_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "https://app.clearcutoff.in";
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

// Devanagari face for Hindi and Marathi. Applied via the `:lang(hi)`/`:lang(mr)`
// rules in globals.css, so it only renders on those pages. Not preloaded to
// keep English pages lean (it still loads on demand via font-display: swap).
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

// Pre-render every locale at build time. Only `en`, `hi` and `mr` are valid.
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
            never be opening connections to a test origin.
            Same env var as REDIRECT_BASE_URL in lib/auth.ts, so a staging
            build resolves this hint to its own staging dashboard host
            instead of hard-coding production's. */}
        <link rel="dns-prefetch" href={REDIRECT_BASE_URL} />
        {/* Paired with the blocking script at the top of <body> and
            AuthRedirectLoader (src/components/layout/AuthRedirectLoader.tsx):
            this is what actually hides the static landing HTML before first
            paint for a visitor who might be about to get redirected, instead
            of hiding it only after React hydrates (which still showed a
            flash of landing first). */}
        <style>{`
          html[data-auth-pending] body > :not(#auth-pending-loader) { visibility: hidden; }
          html[data-auth-pending] #auth-pending-loader { display: block !important; }
        `}</style>
      </head>
      <body className="font-sans">
        {/* Runs synchronously while the HTML is still being parsed, before
            the browser paints anything below it — same "no-flash" technique
            commonly used for dark-mode theme detection, applied here to
            auth state instead. Mirrors the exact conditions
            AuthRedirectLoader and lib/auth.ts's shouldSkipRedirect check:
            Facebook/Instagram in-app-browser visitors are never gated, and
            a visitor with no stored session has nothing to check, so the
            vast majority of visitors (including every crawler) never hit
            this at all and the landing page paints exactly as fast as
            before this feature existed. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var ua=navigator.userAgent||"";if(/FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram/i.test(ua))return;if(!localStorage.getItem("CSRF_TOKEN"))return;document.documentElement.setAttribute("data-auth-pending","");}catch(e){}})();`,
          }}
        />
        {/* Static, always-rendered (so it's there for the blocking script to
            reveal above) — hidden by default via inline style so it costs
            nothing for the visitors who never trigger data-auth-pending. The
            same @clearcut/ui/full-screen-loader apps/dashboard uses — no
            per-app duplicate look anymore. Safe to server-render here
            unmounted/hidden since it's plain markup with no hooks. */}
        <div id="auth-pending-loader" style={{ display: "none" }}>
          <FullScreenLoader />
        </div>
        <ReactQueryProvider>
          <NextIntlClientProvider>
            <AuthProvider>
              <AuthRedirectLoader />
              {children}
            </AuthProvider>
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

          {process.env.NODE_ENV === "development" && <Agentation />}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
