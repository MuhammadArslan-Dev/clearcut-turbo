"use client";

import { useLocale } from "next-intl";
import { courseLangFor, type CourseLang } from "./hindi-page";

/**
 * The course language question cards show: the URL's locale (/hi -> Hindi,
 * English URLs -> English), never a saved browser preference — see
 * courseLangFor. Server HTML and every client render agree, so there is no
 * flash of the other language after hydration.
 */
export function useCourseLang(): CourseLang {
  return courseLangFor(useLocale());
}
