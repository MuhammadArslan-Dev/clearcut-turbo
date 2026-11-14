import StartAuthForm from "./StartAuthForm";
import { Locale, defaultLocale } from "@/lib/i18n/config";

/**
 * Server Component shell. Phase 101 (Nibbu redesign): the mascot panel and the
 * form share one layout (one screen on phones, a card on desktop), so the
 * whole page now lives in the StartAuthForm client island. The previous right
 * panel (StartHero.tsx) is kept, unrendered, for a quick restore:
 *   return (<div className="min-h-screen md:h-screen flex flex-col md:flex-row"><StartAuthForm locale={locale} /><StartHero locale={locale} /></div>)
 * (with the pre-101 StartAuthForm from git).
 */
export default function StartPage({ locale = defaultLocale }: { locale?: Locale }) {
  return <StartAuthForm locale={locale} />;
}
