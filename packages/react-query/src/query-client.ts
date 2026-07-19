import { QueryClient } from "@tanstack/react-query";

/**
 * Shared caching policy for every app. Kept intentionally small — apps
 * override per-query where a specific fetch needs different behavior
 * rather than this factory growing app-specific branches.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // > 0 is required for Next.js SSR: with staleTime 0 (the React Query
        // default), data hydrated from a server prefetch is immediately
        // considered stale and refetches on mount, defeating the prefetch.
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
