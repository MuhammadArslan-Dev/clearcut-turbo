"use client";

import { useRouter, Link } from "@/i18n/navigation";
import { PageNotFound } from "@clearcut/ui/page-not-found";

// 500 counterpart of not-found-content.tsx: locale-aware, for error.tsx under [locale].
export default function ErrorContent() {
  const router = useRouter();

  return (
    <PageNotFound
      code="500"
      title="Something went wrong"
      description="An unexpected error occurred on our side. Please try again in a moment."
      onGoBack={() => router.back()}
      HomeLinkComponent={Link}
    />
  );
}
