"use client";

import * as Sentry from "@sentry/nextjs";

import FullScreenLoader from "@/components/FullScreenLoader";
import { useLoaderHold } from "@/components/loader/useLoaderHold";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";

export default function ProtectedPage({
  children,
  fallback: fallbackProp,
}: {
  children: React.ReactNode;
  /** What to show while `!tokenReady`. Defaults to the shared spinner — pass
   * a route-specific skeleton (e.g. onboarding's own wizard shape) when a
   * generic spinner doesn't fit that page's content. */
  fallback?: React.ReactNode;
}) {
  // Only the default loader is held until its animation loop ends; a custom fallback (a skeleton) is not.
  const fallback = fallbackProp ?? <FullScreenLoader />;
  const { user, loading, tokenReady } = useAuth();
  const holdLoader = useLoaderHold(!tokenReady);
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
      // Id only: the backend user id finds the student; email and phone
      // stay out of Sentry.
      Sentry.setUser({ id: user.id });
    }
  }, [user, loading]);

  // Gate only on the token existing (near-instant), not on the full
  // /v1/auth-user round trip (`loading`, 2.6-4.2s measured) — children only
  // need the token to already be in storage (see AuthProvider), so this lets
  // the shell and any token-only query start well before the profile
  // resolves instead of sitting behind a full-screen spinner for it.
  if (!tokenReady || (fallbackProp === undefined && holdLoader)) return <>{fallback}</>;

  return <>{children}</>;
}
