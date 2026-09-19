// URL <-> tracker-state sync for the Syllabus Tracker. This app is a fully
// static export (next.config.ts: output "export", basePath "/tools") with no
// server behind it in production — Cloudflare Pages just serves files, and a
// Worker proxies /tools/* (and /hi/tools/*, /mr/tools/*) to that Pages
// deployment (see CLAUDE.md's "apps/tools deployment" section). Real
// exam/level slugs come from a live backend and can't be known at build
// time, so this deliberately does NOT use Next's router (`router.push`) to
// change routes — App Router navigation to a path that was never statically
// generated has no server to fetch from and 404s.
//
// Instead the URL bar is updated with the raw History API (cosmetic only —
// never triggers Next routing/data-fetching), and the current step is always
// derived by parsing `window.location.pathname` directly. A hard reload or
// deep link to a nested path (e.g. /tools/syllabus-tracker/htet/level-1-prt,
// or /hi/tools/syllabus-tracker/htet) is served by `public/_redirects`'
// SPA-fallback rule, which returns the same pre-rendered shell (built for
// the bare root of that locale) for any path under /syllabus-tracker/* or
// /hi/syllabus-tracker/* or /mr/syllabus-tracker/*; this file's parsing then
// restores the right step client-side from the URL the browser actually
// shows.
import type { Locale } from "./dictionary";

const BASE_PATH = "/tools";

// Locale-outermost, matching the PUBLIC production URL the browser actually
// shows — /tools/syllabus-tracker (en), /hi/tools/syllabus-tracker,
// /mr/tools/syllabus-tracker (see LocaleLink.tsx and apps/tools/worker's
// HI_PREFIX/MR_PREFIX, which only recognize this order: the Worker strips
// "/hi/tools" or "/mr/tools" as one unit and proxies to Pages' upstream
// "/hi/..."/"/mr/..." path). Next's own basePath ("/tools") would put the
// locale segment INSIDE it instead (/tools/mr/syllabus-tracker) when served
// directly by `next dev` with no Worker in front — that's only ever true in
// local dev, never in production, so don't "fix" this to match local dev's
// shape; doing so once already silently broke every hi/mr page load in the
// one environment (production, behind the Worker) this whole module exists
// to serve deep links in.
function rootPath(locale: Locale): string {
  return locale === "en" ? `${BASE_PATH}/syllabus-tracker` : `/${locale}${BASE_PATH}/syllabus-tracker`;
}

// The basePath-outermost shape (/tools/mr/syllabus-tracker) `next dev`
// itself would serve this route at directly, with no Worker involved.
// Never written by push/replaceSyllabusUrl (production never sees it), but
// accepted when reading — see next.config.ts's dev-only `redirects()`,
// which bounces the real production-shaped URL here locally so there's
// something for `next dev` to actually 200. Same string for every locale
// (English has no locale segment either way), so nothing extra to compute
// for "en".
function altRootPath(locale: Locale): string {
  return locale === "en" ? rootPath(locale) : `${BASE_PATH}/${locale}/syllabus-tracker`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/** Stable slug for the synthetic "Full Exam" level option, independent of its
 * per-exam display name (`Full HTET (all levels)`, `Full REET (all levels)`, ...).
 *
 * Prefers an English name (`name_en`/`nameEn` — the two casings cover the
 * raw API shape and the TrackedPaper/TrackedLevel shape) over `name` when
 * available: `name` can be pure Devanagari in Hindi/Marathi (e.g. "पेपर 2"),
 * and slugify() only keeps ASCII a-z0-9 — slugifying that collapses to
 * whatever stray digits happen to be in the string ("2") or, for a name
 * with none at all, an empty path segment. Falls back to `name` only for
 * data saved before this field existed. */
export function levelSlug(level: {
  id: number | "full-exam";
  name: string;
  name_en?: string;
  nameEn?: string;
}): string {
  if (level.id === "full-exam") return "full-exam";
  return slugify(level.name_en ?? level.nameEn ?? level.name);
}

/** Reads the current [examSlug, levelSlug] segments straight from the
 * browser URL — not from Next's `useParams()`, which can't be trusted to
 * reflect a URL this module wrote itself via the raw History API. */
export function readSlugFromLocation(locale: Locale = "en"): string[] {
  if (typeof window === "undefined") return [];
  const path = window.location.pathname;
  const root = [rootPath(locale), altRootPath(locale)].find((candidate) => path.startsWith(candidate));
  if (!root) return [];
  return path
    .slice(root.length)
    .split("/")
    .filter(Boolean);
}

function buildPath(locale: Locale, segments: string[]): string {
  const root = rootPath(locale);
  return segments.length ? `${root}/${segments.join("/")}` : root;
}

/** Pushes a new history entry (back button steps back through the wizard). */
export function pushSyllabusUrl(locale: Locale, ...segments: string[]) {
  if (typeof window === "undefined") return;
  const path = buildPath(locale, segments);
  if (window.location.pathname === path) return;
  window.history.pushState(null, "", path);
}

/** Replaces the current entry (resuming from localStorage, or a slug that
 * turned out not to match anything real). */
export function replaceSyllabusUrl(locale: Locale, ...segments: string[]) {
  if (typeof window === "undefined") return;
  const path = buildPath(locale, segments);
  if (window.location.pathname === path) return;
  window.history.replaceState(null, "", path);
}
