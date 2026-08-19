"use client";

import * as Sentry from "@sentry/nextjs";

import FullScreenLoader from "@/components/FullScreenLoader";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";

export default function ProtectedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, tokenReady } = useAuth();
  const { get, remove } = useQueryParams();

  const user_sourse = get("user_source");
  useEffect(() => {
    if (!user_sourse) return

    remove("user_source");

  }, [user_sourse]);
  useEffect(() => {
    
    if (!loading && !user) {
      window.location.href = "https://clearcutoff.in";
    }

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email || undefined,
        phone: user.phone || undefined,
      });
    }
  }, [user, loading]);

  // Gate only on the token existing (near-instant), not on the full
  // /v1/auth-user round trip (`loading`, 2.6-4.2s measured) — children only
  // need the token to already be in storage (see AuthProvider), so this lets
  // the shell and any token-only query start well before the profile
  // resolves instead of sitting behind a full-screen spinner for it.
  if (!tokenReady) return <FullScreenLoader />;

  return <>{children}</>;
}
