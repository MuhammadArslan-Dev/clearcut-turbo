"use client";

import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@clearcut/ui/site-footer";

interface ErrorPageLayoutProps {
  children: React.ReactNode;
}

export default function ErrorPageLayout({ children }: ErrorPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5fa]">
      {/* Header */}
      <header className="bg-white shadow-sm py-3 px-6">
        <Link href="/" className="inline-block">
          <Image
            src="/logos/clear_cutoff_logo.png"
            alt="Clear Cutoff"
            width={160}
            height={40}
            className="h-10 w-auto object-contain"
            unoptimized
          />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Shared footer (same component + config shape as apps/landing's
          Footer.tsx). LinkComponent is omitted: every link this footer
          renders — tel:, wa.me, the four policy pages, the social icons —
          is an absolute URL, not an internal dashboard route, so there's no
          relative path for a locale-aware Link to prefix. Dashboard doesn't
          host the policy pages itself (Sentry CLEARCUTOFF-NEXTJS-APP-2X, 97
          events, from the old relative-link 404s) — they live on the
          marketing site, hence pageLinksBaseUrl — same reasoning as
          apps/tools's SiteFooter wrapper. */}
      <SiteFooter
        pageLinksBaseUrl="https://clearcutoff.in"
        copyrightText={`© ${new Date().getFullYear()} Clear Cutoff. All rights reserved.`}
        phoneNumber="7210708599"
        phoneLabel="7210708599"
        whatsappNumber="917210708599"
        whatsappLabel="WhatsApp"
        policyLabel="Privacy"
        termsLabel="Terms"
        refundLabel="Refund"
        contactLabel="Contact"
      />
    </div>
  );
}
