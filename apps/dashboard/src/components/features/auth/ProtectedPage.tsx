"use client";

import * as Sentry from "@sentry/nextjs";

import FullScreenLoader from "@/components/FullScreenLoader";
import SlowLoadNotice from "@/components/ui/SlowLoadNotice";
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
  const { user, loading, tokenReady, authError, retryAuth } = useAuth();
  const holdLoader = useLoaderHold(!tokenReady);
  const { get, remove } = useQueryParams();

  const user_sourse = get("user_source");
  useEffect(() => {
    if (!user_sourse) return

    remove("user_source");

  }, [user_sourse]);
  useEffect(() => {
    
    // To login only when there is no token or the backend rejected it (401). A
    // failed check for any other reason (offline, timeout, 5xx) keeps the user
    // signed in — in the RN app this redirect is read as a logout (phase 124).
    if (!loading && !user && !authError) {
      window.location.href = "https://clearcutoff.in";
    }

    if (user) {
      // Id only: the backend user id finds the student; email and phone
      // stay out of Sentry.
      Sentry.setUser({ id: user.id });
    }
  }, [user, loading, authError]);

  // Session check failed (not a 401) and no cached profile to render with: the
  // existing "Taking longer than usual" + Try again notice, token untouched.
  if (tokenReady && authError && !user) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 px-4">
        <SlowLoadNotice className="w-full max-w-[480px]" onRetry={retryAuth} />
      </div>
    );
  }

  // Gate only on the token existing (near-instant), not on the full
  // /v1/auth-user round trip (`loading`, 2.6-4.2s measured) — children only
  // need the token to already be in storage (see AuthProvider), so this lets
  // the shell and any token-only query start well before the profile
  // resolves instead of sitting behind a full-screen spinner for it.
  if (!tokenReady || (fallbackProp === undefined && holdLoader)) return <>{fallback}</>;

  return <>{children}</>;
}
