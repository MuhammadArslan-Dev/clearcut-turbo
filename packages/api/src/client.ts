import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { ApiError, normalizeError } from "./errors";

export interface ApiClientConfig {
  /** Base URL for this client. Each app resolves this from its own env vars. */
  baseURL: string;
  /** Request timeout in ms. Defaults to 10s. */
  timeout?: number;
  /** Extra default headers merged into every request. */
  headers?: Record<string, string>;
  /**
   * Returns the current auth token (or null/undefined if unauthenticated).
   * Deliberately pluggable — the package makes no assumption about where a
   * token lives (localStorage on the client, a cookie header on the server,
   * a different session mechanism per app, etc).
   */
  getAuthToken?: () => string | null | undefined;
  /**
   * Called whenever a request comes back 401. The package does not decide
   * what "unauthorized" means for an app (clear token + redirect, attempt a
   * refresh-token call, silently retry, ...) — it only guarantees the hook
   * fires so each app can wire its own strategy in one place.
   */
  onUnauthorized?: (error: ApiError) => void | Promise<void>;
}

/**
 * Creates a configured axios instance with centralized error normalization
 * and a pluggable auth/401 hook. Always use this factory instead of calling
 * `axios.create()` directly — a single ad-hoc instance per API concern is
 * how a codebase ends up with several near-duplicate, inconsistently
 * configured axios clients.
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 10_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.headers,
    },
  });

  instance.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
    const token = config.getAuthToken?.();
    if (token) {
      requestConfig.headers.set("Authorization", `Bearer ${token}`);
    }
    return requestConfig;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const apiError = normalizeError(error);

      if (apiError.isUnauthorized) {
        await config.onUnauthorized?.(apiError);
      }

      return Promise.reject(apiError);
    },
  );

  return instance;
}

export type { ApiError } from "./errors";
