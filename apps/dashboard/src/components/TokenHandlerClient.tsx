// TokenHandlerClient.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setAuthToken } from "@/lib/auth-token-client";

export default function TokenHandlerClient({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      setAuthToken(token);
    }

    router.replace(`/${locale}/onboarding`);
  }, [locale, router, searchParams]);

  return null;
}
