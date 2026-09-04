import { defineRouting } from "next-intl/routing";

// Landing-local fork of @clearcut/i18n's routing config — NOT the shared
// package. Deliberately forked rather than widening `packages/i18n/routing.ts`
// to add "mr": that config is also consumed by apps/blog and apps/dashboard,
// and dashboard's `AppLocale` doubles as an exam *content*-language selector
// (see apps/dashboard's useLanguageSwitch/LanguageModal) — there is no
// Marathi exam content in the Laravel backend, so widening the shared type
// would surface "mr" as a selectable content language there with nothing
// behind it. CLAUDE.md's dashboard section warns against exactly this kind
// of unchecked shared-package change. Landing is the only app with real
// Marathi marketing copy, so it gets its own locale list.
export const routing = defineRouting({
  locales: ["en", "hi", "mr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type LandingLocale = (typeof routing.locales)[number];
