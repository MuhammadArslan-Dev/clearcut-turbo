// components/providers/AuthProvider.tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMeApi, logoutApi } from "@/lib/api/auth";
import {
  getAuthTokenClient,
  clearAuthToken,
  setAuthToken,
  getCachedUser,
  setCachedUser,
  clearCachedUser,
} from "@/lib/auth-token-client";
import type { UserPreview } from "@/types/User";
import { setSentryUser } from "@/lib/sentry/sentry-logger";

type AuthContextType = {
  user: UserPreview | null;
  loading: boolean;
  /**
   * True as soon as we know whether a token exists and (if so) have written
   * it to storage — near-instant, unlike `loading`, which stays true for the
   * full /v1/auth-user round trip (measured 2.6-4.2s). ProtectedPage gates
   * rendering on this instead of `loading` so the shell and any query that
   * only needs the token (not the resolved user object) can start as soon as
   * the token is actually in storage, rather than waiting out that request.
   */
  tokenReady: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Shared in-flight /v1/auth-user request, keyed by token. Module scope (not a ref)
 * on purpose: it must survive React StrictMode's mount/unmount/remount cycle,
 * which is exactly the case a ref cannot cover. One browser tab is one user, so
 * there is no cross-user leakage concern — and this module is client-only.
 */
let inFlightAuthUser: { token: string; promise: ReturnType<typeof getMeApi> } | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenReady, setTokenReady] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Deduplicates the /v1/auth-user revalidation across effect re-runs. Without it
   * the effect re-validated the SAME token repeatedly, because:
   *
   *   1. the effect depends on `searchParams`;
   *   2. when it finds `?token=` it calls `router.replace()` to strip it;
   *   3. that changes `searchParams`, so the effect re-runs;
   *   4. on the re-run `tokenFromQuery` is null, so it falls through to the
   *      stored token and calls getMeApi() again.
   *
   * React StrictMode's dev double-invoke added a third call on top. Measured on
   * the token-handoff entry page: /v1/auth-user fired 3x for 10.6s of cumulative
   * latency (2667 + 4262 + 3660 ms), and 1x on every later navigation.
   *
   * The fix shares the in-flight PROMISE per token rather than just recording
   * "already started". That distinction matters: a first attempt at suppressing
   * this with a plain ref caused a real regression — under StrictMode, effect run
   * #1 started the fetch, its cleanup set `isMounted = false` so the result was
   * discarded, and run #2 then skipped the fetch entirely. `user` stayed null and
   * the app redirected to the login host. Sharing the promise means both runs
   * await the SAME request and each applies the result under its own live
   * `isMounted` guard, so exactly one network call happens and state is still set.
   *
   * Behaviour is otherwise unchanged: a genuinely new token starts a fresh
   * revalidation, a cleared token still hits the `!token` early return, and the
   * failure path that clears the token/cache is untouched (it also clears the
   * shared entry so a transient error can be retried). This makes the code do what
   * its own heading already claimed — "runs only when token changes".
   */

  useEffect(() => {
    let isMounted = true;

    const tokenFromQuery = searchParams.get("token");

    // 1️⃣ Save token if present
    if (tokenFromQuery) {
      setAuthToken(tokenFromQuery);

      // 2️⃣ Remove token from URL (IMPORTANT)
      const params = new URLSearchParams(searchParams.toString());
      params.delete("token");

      router.replace(
        params.toString() ? `?${params.toString()}` : window.location.pathname,
        { scroll: false },
      );
    }

    const token = tokenFromQuery || getAuthTokenClient();

    // Token existence is now known and (if present) already written to
    // storage by setAuthToken() above — safe for anything that only needs
    // the token, before we wait out the slower /v1/auth-user validation below.
    if (isMounted) setTokenReady(true);

    if (!token) {
      if (isMounted) setLoading(false);
      return;
    }

    // Render instantly from cache, then revalidate in background
    const cached = getCachedUser<UserPreview>();
    if (cached && isMounted) {
      setUser(cached);
      setLoading(false);
    }

    // Reuse the in-flight request for this token instead of repeating the ~3s
    // round trip; only start a new one when the token actually changes.
    if (!inFlightAuthUser || inFlightAuthUser.token !== token) {
      inFlightAuthUser = { token, promise: getMeApi(token) };
    }

    inFlightAuthUser.promise
      .then((res) => {
        if (isMounted) {
          setUser(res.data);
          setCachedUser(res.data);
          setSentryUser(res.data);
        }
      })
      .catch(() => {
        // Drop the shared entry so a transient network failure can be retried
        // rather than being permanently suppressed by the dedupe above.
        inFlightAuthUser = null;
        clearAuthToken();
        clearCachedUser();
        setSentryUser(null);
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  /**
   * --------------------------------------
   * Logout (stable reference)
   * --------------------------------------
   */
  const logout = async () => {
    try {
      const res = await logoutApi();
      // console.log("logout", res);

      if (res?.message === "Logged out") {
        // clearAuthToken(); // remove token from storage/cookies
        clearCachedUser();
        setUser(null);
        setSentryUser(null);
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  /**
   * --------------------------------------
   * Memoized context value (IMPORTANT)
   * --------------------------------------
   */
  const value = useMemo(
    () => ({ user, loading, tokenReady, logout }),
    [user, loading, tokenReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * --------------------------------------
 * Safe consumer hook
 * --------------------------------------
 */
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}
