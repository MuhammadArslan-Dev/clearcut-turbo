"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { clearToken, getToken, setToken as storeToken } from "./token";

export interface AuthContextConfig {
  /** Full base URL for the `/v1/me` verify call, e.g. `${NEXT_PUBLIC_API_URL}/api`. */
  apiBaseUrl: string;
  /** Base URL to redirect an already-logged-in user to, e.g. NEXT_PUBLIC_FRONTEND_URL. */
  redirectBaseUrl: string;
  /** Path `login()` navigates to. Defaults to "/app". */
  loginRedirectPath?: string;
  /** Path `logout()` navigates to. Defaults to "/". */
  logoutRedirectPath?: string;
  /** Abort the mount-time verify call after this many ms. Defaults to 8000. */
  verifyTimeoutMs?: number;
}

export interface AuthContextValue {
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

/**
 * Factory producing an {AuthProvider, useAuth} pair, generalizing the
 * mount-time "verify stored token, redirect if valid" mechanism that
 * previously lived directly in apps/landing/src/context/AuthContext.tsx.
 * Each app supplies its own URLs; the state/effect/abort/timeout mechanism
 * is identical across apps.
 */
export function createAuthContext(config: AuthContextConfig) {
  const {
    apiBaseUrl,
    redirectBaseUrl,
    loginRedirectPath = "/app",
    logoutRedirectPath = "/",
    verifyTimeoutMs = 8000,
  } = config;

  const AuthContext = createContext<AuthContextValue | null>(null);

  function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const [token, setTokenState] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const verifyMe = async (tok: string, signal: AbortSignal) => {
      const res = await fetch(`${apiBaseUrl}/v1/me`, {
        headers: { Authorization: `Bearer ${tok}` },
        signal,
      });
      if (!res.ok) throw new Error("unauthorized");
      return res.json();
    };

    useEffect(() => {
      const tok = getToken();
      if (!tok) return;

      const redirectUrl = `${redirectBaseUrl}/dashboard?token=${encodeURIComponent(tok)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), verifyTimeoutMs);

      setLoading(true);

      (async () => {
        try {
          const data = await verifyMe(tok, controller.signal);
          clearTimeout(timeoutId);

          if (data?.status === "success") {
            setTokenState(tok);
            window.location.replace(redirectUrl);
          } else {
            clearToken();
            setTokenState(null);
          }
        } catch (err) {
          clearTimeout(timeoutId);
          // AbortError means the component unmounted (or React StrictMode
          // cleanup) — the token is still valid, so don't clear it.
          if (err instanceof Error && err.name === "AbortError") return;
          clearToken();
          setTokenState(null);
        } finally {
          setLoading(false);
        }
      })();

      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }, []);

    const login = (tok: string) => {
      storeToken(tok);
      setTokenState(tok);
      router.replace(loginRedirectPath);
    };

    const logout = () => {
      clearToken();
      setTokenState(null);
      router.replace(logoutRedirectPath);
    };

    const value = useMemo(
      () => ({ token, loading, login, logout }),
      [token, loading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
  }

  return { AuthProvider, useAuth };
}
