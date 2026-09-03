import MainAppLogo from "./icons/main-app-logo";
import LocaleSwitcher from "./LocaleSwitcher";
import { Locale } from "@/lib/dictionary";

/**
 * Deliberately minimal — this app has exactly one feature (the resizer
 * tool), so no nav links or auth CTA, just the EN/HI switcher now that
 * app/hi/* exists (see dictionary.ts). Logo links back to clearcutoff.in
 * itself (this app is served under it, at /tools/resizer, but the logo
 * should still go to the site root, not this app's own hub page).
 */
export default function SiteHeader({ locale = "en" }: { locale?: Locale }) {
  return (
    <header className="relative flex items-center justify-center py-4 px-4 md:px-6">
      <a href="https://clearcutoff.in" aria-label="Clear Cutoff">
        <MainAppLogo width={200} height={51} />
      </a>
      <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2">
        <LocaleSwitcher locale={locale} />
      </div>
    </header>
  );
}
