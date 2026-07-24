// src/hooks/useLanguageSwitch.ts
"use client";

import { useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@clearcut/i18n/routing";
import type { AppLocale } from "@/types/components/language";

export type UseLanguageSwitchReturn = {
  locale: AppLocale;
  nextLocale: AppLocale;
  isPending: boolean;
  switchLanguage: (targetLocale?: AppLocale) => void;
};

export default function useLanguageSwitch(): UseLanguageSwitchReturn {
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;

  const locales = useMemo(() => routing.locales as readonly AppLocale[], []);

  const currentIndex = useMemo(() => {
    const index = locales.indexOf(locale);
    return index === -1 ? 0 : index;
  }, [locale, locales]);

  const nextLocale = useMemo(
    () => locales[(currentIndex + 1) % locales.length],
    [currentIndex, locales],
  );

  const switchLanguage = useCallback(
    (targetLocale?: AppLocale) => {
      const next = targetLocale ?? nextLocale;
      if (next === locale) return;

      // Hard redirect preserves the locale across the full page load,
      // avoiding a race condition where React context still holds the old
      // locale while the client-side navigation is in flight.
      const query = typeof window !== "undefined" ? window.location.search : "";
      const isDefault = next === (routing.defaultLocale as AppLocale);
      window.location.href = isDefault
        ? `${pathname}${query}`
        : `/${next}${pathname}${query}`;
    },
    [nextLocale, pathname, locale],
  );

  return {
    locale,
    nextLocale,
    isPending: false,
    switchLanguage,
  };
}
