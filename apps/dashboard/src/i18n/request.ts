import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const baseMessages = (await import(`../../messages/${locale}.json`)).default;
  // A missing/corrupt namespace file must never take down every page on the
  // site — this runs in next-intl's global request config, so an unhandled
  // throw here 500s the entire app for every route and every locale, not
  // just whichever screen uses that namespace.
  const load = async (locale: string, path?: string) => {
    try {
      return (await import(`../../messages/${locale}/${path}.json`)).default;
    } catch (err) {
      console.error(`Missing/invalid message namespace "${path}" for locale "${locale}"`, err);
      return {};
    }
  };

  const messages = {
    ...baseMessages,
    testListContent: await load(locale, "testListContent"),
    relatedContent: await load(locale, "relatedContent"),
    examType: await load(locale, "examType"),
    Onboarding: await load(locale, "onboarding"),
    modals: await load(locale, "modals"),
    payment: await load(locale, "payment"),
    DailyTests: await load(locale, "dailyTests"),
    DashboardHome: await load(locale, "dashboardHome"),
  };

  return {
    locale,
    messages,
  };
});
