"use client";

import { useRouter } from "next/navigation";
import { PageNotFound } from "@clearcut/ui/page-not-found";

// 500 counterpart of not-found-content-root.tsx: used by global-error.tsx,
// which replaces the whole document, so there is no NextIntlClientProvider
// and it must use plain next/navigation.
export default function ErrorContentRoot() {
  const router = useRouter();

  return (
    <PageNotFound
      code="500"
      title="Something went wrong"
      description="An unexpected error occurred on our side. Please try again in a moment."
      onGoBack={() => router.back()}
    />
  );
}
