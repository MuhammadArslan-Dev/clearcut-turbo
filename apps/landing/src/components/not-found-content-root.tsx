"use client";

import { useRouter } from "next/navigation";
import { PageNotFound } from "@clearcut/ui/page-not-found";

// Used only by the root-level apps/landing/src/app/not-found.tsx — a path
// that doesn't even match the [locale] segment has no NextIntlClientProvider
// ancestor, so this deliberately uses plain next/navigation instead of
// @clearcut/i18n/navigation (same reasoning as apps/blog/src/components/
// error-page.tsx). Every real, locale-scoped 404 goes through
// not-found-content.tsx instead, which does use the locale-aware router.
export default function NotFoundContentRoot() {
  const router = useRouter();

  return <PageNotFound onGoBack={() => router.back()} />;
}
