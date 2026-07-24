import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@clearcut/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const baseMessages = (await import(`../../messages/${locale}.json`)).default;
  const load = async (locale: string, path?: string) => {
    return (await import(`../../messages/${locale}/${path}.json`)).default;
  };

  const messages = {
    ...baseMessages,
    testListContent: await load(locale, "testListContent"),
    relatedContent: await load(locale, "relatedContent"),
    examType: await load(locale, "examType"),
    Onboarding: await load(locale, "onboarding"),
    modals: await load(locale, "modals"),
    payment: await load(locale, "payment"),
  };

  return {
    locale,
    messages,
  };
});
