import { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import StartPage from "@/components/pages/StartPage";
import { defaultLocale, toLocale } from "@/lib/i18n/config";
import { pageTitle, SITE_URL } from "@/lib/seo/metadata";

// StartPage is translated on /hi and /mr, so each locale is its own canonical.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = toLocale(locale);
  const url = resolvedLocale === defaultLocale ? `${SITE_URL}/start` : `${SITE_URL}/${resolvedLocale}/start`;
  return {
    title: pageTitle("Start Your Exam Preparation | Clear Cutoff"),
    description:
      "Log in with your mobile number to start free exam preparation — videos, notes and PYQs for CTET, HTET, UPTET and more.",
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: "Start Your Exam Preparation | Clear Cutoff",
      description:
        "Log in with your mobile number to start free exam preparation — videos, notes and PYQs.",
      url,
      siteName: "Clear Cutoff",
      type: "website",
    },
  };
}

export default async function Start({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <StartPage locale={toLocale(locale)} />;
}
