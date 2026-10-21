"use client";

import { useLocale } from "next-intl";
import { useLanguageStore } from "@/store/useLanguageStore";
import { courseLangFor, type CourseLang } from "./hindi-page";

/**
 * The course language question cards show: the visitor's own pick from the
 * language modal when they made one, else the URL's locale (/hi -> Hindi).
 * Server HTML and the first client render never have the persisted pick
 * (the store hydrates after mount), so both follow the URL — /hi pages
 * server-render their Hindi translations.
 */
export function useCourseLang(): CourseLang {
  const locale = useLocale();
  const stored = useLanguageStore((s) => s.courseLanguage);
  const chosen = useLanguageStore((s) => s.courseLanguageChosen);
  return courseLangFor(locale, stored, chosen);
}
