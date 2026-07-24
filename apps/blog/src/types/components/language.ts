export type AppLocale = "en" | "hi";

export const locales: AppLocale[] = ["en", "hi"];

export interface LocalizedText {
  en: string;
  hi: string;
}