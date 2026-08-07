// Resolves a Payload asset URL for use on the blog. Payload serves media from
// the CMS origin and emits root-relative URLs (e.g. `/api/media/file/...`),
// which would resolve against the blog's own origin (and 404). Prepend the CMS
// base URL for root-relative paths; leave absolute/data URLs untouched.
const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL ?? "";

export function resolveMediaUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return `${PAYLOAD_URL}${url}`;
  return url;
}
