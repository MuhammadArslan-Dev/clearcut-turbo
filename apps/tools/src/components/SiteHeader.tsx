import MainAppLogo from "./icons/main-app-logo";

/**
 * Deliberately minimal — this app has exactly one feature (the resizer
 * tool), so no nav links, locale switcher, or auth CTA. Logo links back to
 * clearcutoff.in itself (this app is served under it, at /tools/resizer, but
 * the logo should still go to the site root, not this app's own hub page).
 */
export default function SiteHeader() {
  return (
    <header className="flex items-center justify-center py-4 px-4 md:px-6">
      <a href="https://clearcutoff.in" aria-label="Clear Cutoff">
        <MainAppLogo width={160} height={41} />
      </a>
    </header>
  );
}
