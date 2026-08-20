import StartHero from "./StartHero";
import StartAuthForm from "./StartAuthForm";
import { Locale, defaultLocale } from "@/lib/i18n/config";

/**
 * Server Component shell — no "use client" here. StartHero (right panel) is
 * itself a Server Component, so only StartAuthForm (the actual form) ships
 * as client JS. Keeps this page's client bundle to just the interactive
 * part instead of the whole page.
 */
export default function StartPage({ locale = defaultLocale }: { locale?: Locale }) {
  return (
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row">
      <StartAuthForm locale={locale} />
      <StartHero locale={locale} />
    </div>
  );
}
