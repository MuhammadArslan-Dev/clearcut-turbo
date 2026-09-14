import { defineRouting } from "next-intl/routing";

// Dashboard-local fork of @clearcut/i18n's routing config — NOT the shared
// package. Deliberately forked rather than widening `packages/i18n/routing.ts`
// to add "mr": that config is also consumed by apps/blog, and dashboard's own
// `AppLocale` doubles as a backend-content-language key (paper/section/test
// names are stored in the Laravel backend as locale-keyed JSON, en/hi only —
// see src/utils/text/contentLocale.ts). Widening the shared type would leak
// "mr" as a route locale into blog too, which has no Marathi content or
// messages of its own. See apps/landing/src/i18n/routing.ts for the same
// pattern with more detail.
export const routing = defineRouting({
  locales: ["en", "hi", "mr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type DashboardLocale = (typeof routing.locales)[number];
