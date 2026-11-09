import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * next/link without prefetch. Every request under clearcutoff.in/tools counts
 * against the Cloudflare Workers free limit (100k a day), and prefetch fetched
 * several files per link on every page view, many of them 404s. Use this for
 * every internal link in this app.
 */
export default function NoPrefetchLink(props: ComponentProps<typeof Link>) {
  return <Link prefetch={false} {...props} />;
}
