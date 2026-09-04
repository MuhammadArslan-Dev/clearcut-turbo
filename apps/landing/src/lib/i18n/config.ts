// Thin compatibility layer over landing's local routing config (@/i18n/routing
// — forked from @clearcut/i18n, see that file for why). Kept so the many
// components that only need the `Locale` type / `defaultLocale` constant for
// prop typing don't need to change their import path.

import { routing, type LandingLocale } from "@/i18n/routing";

export const locales = routing.locales;

export type Locale = LandingLocale;

export const defaultLocale: Locale = routing.defaultLocale;

export function isLocale(value: string | undefined | null): value is Locale {
  return (routing.locales as readonly string[]).includes(value ?? "");
}

/** Normalise any incoming value to a supported locale (unknown → English). */
export function toLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}
