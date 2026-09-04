import type { LandingLocale } from "@/i18n/routing";

// Types `useLocale()`/`getLocale()` as `LandingLocale` instead of the generic
// `string` next-intl falls back to without this augmentation. Declared here
// (per-app) rather than in a shared package — see the comment in
// @/i18n/routing.ts for why landing forks its own routing config.
declare module "next-intl" {
  interface AppConfig {
    Locale: LandingLocale;
  }
}
