import Link from "next/link";
import { Locale } from "@/lib/dictionary";

/**
 * Locale-aware internal link. On an English page this is a plain
 * next/link — SPA transitions, prefetch, all normal, and next.config.ts's
 * basePath ("/tools/resizer") auto-prefixes `href` correctly since that's
 * the shape English is actually served at.
 *
 * On a Hindi page this renders a plain <a> with the full absolute
 * "/hi/tools/resizer/..." path instead of next/link, for two reasons: (1)
 * next/link would auto-prepend the SAME "/tools/resizer" basePath to a
 * "/hi/..." href, landing back on the old /tools/resizer/hi/* shape instead
 * of the public /hi/tools/resizer/* one (see worker/src/index.ts's
 * HI_PREFIX comment); (2) the browser's actual URL on a Hindi page doesn't
 * match the app's configured basePath at all, which next/link's
 * client-side router isn't built to navigate correctly from. A plain <a>
 * sidesteps both — full page load, but this is a static export of simple
 * content pages, so that's not a real cost.
 */
export default function LocaleLink({
  locale,
  href,
  className,
  children,
}: {
  locale: Locale;
  /** basePath-relative target, e.g. "/htet" or "/" — never pre-prefixed with "/hi". */
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (locale === "hi") {
    const suffix = href === "/" ? "" : href;
    return (
      <a href={`/hi/tools/resizer${suffix}`} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
