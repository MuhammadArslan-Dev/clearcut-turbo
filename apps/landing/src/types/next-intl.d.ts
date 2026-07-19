import type { AppLocale } from "@clearcut/i18n/routing";

// Types `useLocale()`/`getLocale()` as `AppLocale` instead of the generic
// `string` next-intl falls back to without this augmentation. Declared here
// (per-app) rather than in the shared @clearcut/i18n package — see the
// comment in packages/i18n/routing.ts for why.
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
  }
}
