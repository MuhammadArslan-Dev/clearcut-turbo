"use client";
import { useLocale } from "next-intl";

export function useLang() {
  const locale = useLocale();

  // Map or normalize if needed
  const currentLang = locale; // alias (can add logic later)

  return { locale, currentLang };
}
