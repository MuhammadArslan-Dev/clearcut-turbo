import Link from "next/link";
import { Locale } from "@/lib/dictionary";

/**
 * Locale-aware internal link **scoped to one tool** (its public URL is
 * /tools/{tool}/*, one level below this app's own basePath — see
 * next.config.ts, which only covers the shared "/tools" prefix now that
 * multiple tools live here).
 *
 * On an English page this is a plain next/link — SPA transitions, prefetch,
 * all normal — but the tool's own route segment has to be spelled out
 * explicitly here since next.config.ts's basePath no longer includes it
 * (that segment lives in the Next route tree, not basePath).
 *
 * On a Hindi page this renders a plain <a> with the full absolute
 * "/hi/tools/{tool}/..." path instead of next/link, for two reasons: (1)
 * next/link would auto-prepend basePath ("/tools") to a "/hi/..." href,
 * landing on "/tools/hi/..." instead of the public "/hi/tools/{tool}/..."
 * one (see worker/src/index.ts's HI_PREFIX comment); (2) the browser's
 * actual URL on a Hindi page doesn't match the app's configured basePath at
 * all, which next/link's client-side router isn't built to navigate
 * correctly from. A plain <a> sidesteps both — full page load, but this is
 * a static export of simple content pages, so that's not a real cost.
 */
export default function LocaleLink({
  locale,
  href,
  tool = "resizer",
  className,
  children,
}: {
  locale: Locale;
  /** Tool-root-relative target, e.g. "/htet" or "/" — never pre-prefixed with "/hi" or the tool segment. */
  href: string;
  /** Which tool's route tree this link stays within. Defaults to "resizer" — every call site written before the age calculator existed relies on that default. */
  tool?: "resizer" | "age-eligibility-calculator";
  className?: string;
  children: React.ReactNode;
}) {
  const suffix = href === "/" ? "" : href;
  if (locale === "hi") {
    return (
      <a href={`/hi/tools/${tool}${suffix}`} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={`/${tool}${suffix}`} className={className}>
      {children}
    </Link>
  );
}
