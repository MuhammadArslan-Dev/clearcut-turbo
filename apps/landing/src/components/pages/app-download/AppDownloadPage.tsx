import AppDownloadHero, { type AppPlatform } from "@/components/sections/app-download/AppDownloadHero";
import AppShowcaseSection from "@/components/sections/app-download/AppShowcaseSection";
import AppDownloadFaqSection from "@/components/sections/app-download/AppDownloadFaqSection";
import AppDownloadFinalCta from "@/components/sections/app-download/AppDownloadFinalCta";
import { Locale, defaultLocale } from "@/lib/i18n/config";

export default function AppDownloadPage({
  platform,
  locale = defaultLocale,
}: {
  platform: AppPlatform;
  locale?: Locale;
}) {
  return (
    <>
      <AppDownloadHero platform={platform} locale={locale} />
      <AppShowcaseSection locale={locale} />
      <AppDownloadFaqSection platform={platform} locale={locale} />
      <AppDownloadFinalCta platform={platform} locale={locale} />
    </>
  );
}
