"use client";

export type UseLanguageSwitchReturn = {
  locale: string;
  nextLocale: string;
  isPending: boolean;
  switchLanguage: (targetLocale?: string) => void;
};

export default function useLanguageSwitch(): UseLanguageSwitchReturn {
  return {
    locale: "en",
    nextLocale: "en",
    isPending: false,
    switchLanguage: () => {},
  };
}
