import { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import StartPage from "@/components/pages/StartPage";
import { toLocale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Start Your Exam Preparation | Clear Cutoff",
  description:
    "Log in with your mobile number to start free exam preparation — videos, notes and PYQs for CTET, HTET, UPTET and more.",
  alternates: {
    canonical: "https://clearcutoff.in/start",
  },
  openGraph: {
    title: "Start Your Exam Preparation | Clear Cutoff",
    description:
      "Log in with your mobile number to start free exam preparation — videos, notes and PYQs.",
    url: "https://clearcutoff.in/start",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

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
