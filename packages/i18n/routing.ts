import { defineRouting } from "next-intl/routing";

// Canonical locale routing config, shared across every app in the workspace.
// English is the default and served without a URL prefix; Hindi is served
// under `/hi`. Matches the behavior every app already relied on individually.
export const routing = defineRouting({
  locales: ["en", "hi"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];

// The `declare module "next-intl" { interface AppConfig {...} } }` typing
// augmentation deliberately does NOT live here. pnpm's isolated node_modules
// can resolve this package's "next-intl" to a different physical instance
// than a consuming app's own "next-intl" (different peer-dependency hash),
// and TypeScript's module augmentation only applies to the exact instance
// it targets — so an augmentation declared in this shared package silently
// fails to reach apps that resolve a different instance. Each app declares
// its own copy (see src/types/next-intl.d.ts), importing `AppLocale` from
// here — that's just a plain type alias, unaffected by the instance issue.
