export type AppLocale = "en" | "ur";

export const locales: AppLocale[] = ["en", "ur"];

export interface LocalizedText {
  en: string;
  hi: string;
}