import { ALLOWED_EXAMS } from "@/lib/exams";

/**
 * The permanent-redirect target for a non-canonical path, or null when the
 * path is already canonical. Covers the two variants pages would otherwise
 * render as duplicates: uppercase letters in an exam path (/CTET/paper-1,
 * /ctet/Paper-1) and the explicit default-locale prefix (/en/ctet, which
 * next-intl only 307s).
 */
export function canonicalPathRedirect(pathname: string): string | null {
  let path = pathname;
  let changed = false;

  if (path === "/en" || path.startsWith("/en/")) {
    path = path.slice(3) || "/";
    changed = true;
  }

  // Every slug under an exam (level, subject, chapter, year, blog post) is
  // lowercase, so an uppercase letter anywhere in an exam path (/HTET,
  // /htet/Level-1-PRT) is a variant of the lowercase URL: one 301 straight
  // to the fully lowercased path.
  const match = /^(\/hi)?\/([^/]+)(\/.*)?$/.exec(path);
  if (match) {
    const [, hi = "", segment, rest = ""] = match;
    const lowerRest = rest.toLowerCase();
    if (ALLOWED_EXAMS.includes(segment.toLowerCase()) && (segment !== segment.toLowerCase() || rest !== lowerRest)) {
      path = `${hi}/${segment.toLowerCase()}${lowerRest}`;
      changed = true;
    }
  }

  return changed ? path : null;
}
