import MainAppLogo from "./icons/main-app-logo";
import LocaleSwitcher from "./LocaleSwitcher";
import { Locale } from "@/lib/dictionary";

/**
 * Deliberately minimal — no nav links or auth CTA, just the EN/HI switcher
 * (see dictionary.ts) for tools that actually have a Hindi version. Logo
 * links back to clearcutoff.in itself (each tool here is served under it,
 * e.g. at /tools/resizer, but the logo should still go to the site root,
 * not any one tool's own hub page).
 */
export default function SiteHeader({
  locale = "en",
  showLocaleSwitcher = true,
  tool = "resizer",
}: {
  locale?: Locale;
  /** Set false on tools with no Hindi copy — the switcher would otherwise link into pages that have nothing to do with the current tool. */
  showLocaleSwitcher?: boolean;
  /** Which tool's route tree the switcher stays within. */
  tool?: "resizer" | "age-eligibility-calculator";
}) {
  return (
    <header className="relative flex items-center justify-center py-4 px-4 md:px-6">
      <a href="https://clearcutoff.in" aria-label="Clear Cutoff">
        <MainAppLogo width={200} height={51} />
      </a>
      {showLocaleSwitcher && (
        <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2">
          <LocaleSwitcher locale={locale} tool={tool} />
        </div>
      )}
    </header>
  );
}
