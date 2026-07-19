import { createQueryKeys } from "@clearcut/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/lib/auth";

export const authKeys = createQueryKeys("auth");

/**
 * Reference implementation of a `useQuery` hook built on the shared
 * @clearcut/api + @clearcut/react-query packages. Not currently wired into
 * `AuthContext` — that flow's on-success behavior is an imperative redirect
 * (`window.location.replace`) to a different app, not something to render,
 * so it's a poor fit for `useQuery`'s declarative "cache + render" model.
 * Kept here as the correctly-built starting point for the next feature that
 * genuinely needs cached, re-fetchable session data (e.g. a future
 * account/profile view rendered in this app rather than redirected away).
 */
export function useVerifyMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.detail("me"),
    queryFn: async () => {
      const response = await authApi.verifyMe();
      return response.data;
    },
    enabled,
    retry: false,
  });
}
