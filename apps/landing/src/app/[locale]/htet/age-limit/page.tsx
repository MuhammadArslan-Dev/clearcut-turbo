import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import HtetInfoPage from "@/components/pages/htet/HtetInfoPage";
import { htetPageMetadata } from "@/lib/seo/htet-pages";
import { toLocale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return htetPageMetadata("age-limit", locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <HtetInfoPage page="age-limit" locale={toLocale(locale)} />;
}
