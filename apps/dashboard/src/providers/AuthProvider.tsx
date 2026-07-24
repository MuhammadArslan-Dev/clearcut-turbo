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
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPreview | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * --------------------------------------
   * Auth bootstrap (runs only when token changes)
   * --------------------------------------
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

    getMeApi(token)
      .then((res) => {
        if (isMounted) {
          setUser(res.data);
          setCachedUser(res.data);
          setSentryUser(res.data);
        }
      })
      .catch(() => {
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
  const value = useMemo(() => ({ user, loading, logout }), [user, loading]);

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
