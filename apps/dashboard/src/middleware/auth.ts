import { NextRequest, NextResponse } from "next/server";
const locales = ["en", "hi"];
const defaultLocale = "en";
export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Locale is GUARANTEED here
  const locale = pathname.split("/")[1];

  if (pathname.startsWith(`/${locale}/login`)) {
    return NextResponse.next();
  }

  const hasToken = request.cookies.has("auth_token");

  if (!hasToken) {
    return NextResponse.redirect(
      new URL(`https://clearcutoff.in`, request.url)
    );
  }

  // Ignore internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  // 🚀 THIS fixes /dashboard/profile
  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }
}
