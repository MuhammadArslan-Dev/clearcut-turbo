/**
 * Sentry tags `page` and `language` (CC-95): which funnel page an error came
 * from, and in which language. Read from the URL path only, never the query
 * string, so nothing a redaction rule would remove can end up in a tag.
 * apps/dashboard keeps its own copy in src/lib/sentry/sentry-shared.ts.
 */
const PAGES: readonly (readonly [RegExp, string])[] = [
  [/^\/payment(?:\/|$)/, "payment"],
  [/^\/onboarding(?:\/|$)/, "onboarding"],
  [/^\/start(?:\/|$)/, "start"],
];

export function pageTags(
  url: string | undefined,
  locales: readonly string[],
  defaultLocale: string,
): { page: string; language: string } | null {
  if (!url) return null;
  let path: string;
  try {
    path = new URL(url, "https://placeholder.invalid").pathname;
  } catch {
    return null;
  }
  const first = path.split("/")[1] ?? "";
  // `/en/...` can still show up (old links) even though en is unprefixed.
  const prefixed = locales.includes(first);
  const bare = prefixed ? path.slice(first.length + 1) || "/" : path;
  return {
    page: PAGES.find(([pattern]) => pattern.test(bare))?.[1] ?? "other",
    language: prefixed ? first : defaultLocale,
  };
}

type TaggableEvent = {
  tags?: Record<string, unknown>;
  request?: { url?: string };
  contexts?: Record<string, Record<string, unknown> | undefined>;
};

/** Adds `page` + `language` to an event, from its request URL (browser) or
 * Next's `request_path` (server). */
export function tagPage<T extends TaggableEvent>(
  event: T,
  locales: readonly string[],
  defaultLocale: string,
): T & Pick<TaggableEvent, "tags"> {
  const url = event.request?.url ?? (event.contexts?.nextjs?.request_path as string | undefined);
  const tags = pageTags(url, locales, defaultLocale);
  if (tags) event.tags = { ...event.tags, ...tags };
  return event;
}
