"use client";

import { useRouter, Link } from "@clearcut/i18n/navigation";
import { PageNotFound } from "@clearcut/ui/page-not-found";

export default function NotFoundContent() {
  const router = useRouter();

  return <PageNotFound onGoBack={() => router.back()} HomeLinkComponent={Link} />;
}
