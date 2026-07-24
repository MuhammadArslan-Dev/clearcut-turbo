"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { setAuthToken } from "@/lib/auth-token-client";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenFromQuery = searchParams.get("token");

    if (tokenFromQuery) {
      setAuthToken(tokenFromQuery);
    }

    router.replace('/dashboard');
  }, [searchParams]);

  return null; // nothing to render
}
