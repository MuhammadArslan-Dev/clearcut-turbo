import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// On-demand ISR revalidation, triggered by a Payload CMS webhook (e.g. an
// `afterChange` hook on the Faq global) instead of waiting out the page's
// own `revalidate` window (see src/app/[locale]/faq/page.tsx) plus whatever
// CDN edge cache sits in front of it. `path` defaults to the FAQ page in
// both locales since that's the only caller today; pass `?path=/some/route`
// to revalidate anything else CMS-driven (comparisons, alternatives, ...).
const DEFAULT_PATHS = ["/faq", "/hi/faq"];

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  const provided = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-revalidate-secret");
  return provided === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ revalidated: false, message: "Invalid secret" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");
  const paths = path ? [path] : DEFAULT_PATHS;

  for (const p of paths) {
    revalidatePath(p);
  }

  return NextResponse.json({ revalidated: true, paths, now: Date.now() });
}

// Convenience for manual/browser-triggered revalidation (e.g. a quick curl
// during an incident) — same auth and behavior as POST.
export const GET = POST;
