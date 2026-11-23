import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import {routing} from './i18n/routing';
import { canonicalPathRedirect } from './lib/seo/url-normalize';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // /en/question/<slug>-<id>: the question route itself 301s to the chapter
  // page, so serve it as-is instead of first 301ing to /question/… (two hops).
  if (request.nextUrl.pathname.startsWith('/en/question/')) {
    return NextResponse.rewrite(request.nextUrl);
  }
  const target = canonicalPathRedirect(request.nextUrl.pathname);
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 301);
  }
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
