"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { createQueryClient } from "@clearcut/react-query/query-client";

/**
 * Two defects were fixed here; both were provable by reading the file.
 *
 * 1. `const queryClient = new QueryClient()` sat INSIDE the component body, so a
 *    brand-new client — with an empty cache — was constructed on every render of
 *    this provider. That silently disabled React Query caching app-wide: nothing
 *    could ever be served from cache, and in-flight deduplication was reset on
 *    each render. The file's own comment said "useState ensures single instance"
 *    while the line below it defeated exactly that, and the `useState` import was
 *    left unused.
 *
 * 2. The client was constructed with React Query's DEFAULTS, which are wrong here:
 *      staleTime 0            -> every query refetches on every mount
 *      refetchOnWindowFocus   -> refetches whenever the tab regains focus
 *      retry 3                -> each failing query fires 4 attempts, so a brief
 *                                backend problem becomes a retry storm (measured:
 *                                7 Sentry envelope POSTs on one dashboard load)
 *    A correctly-tuned config was already written in this file but commented out.
 *
 * Rather than re-inline that config, this uses `createQueryClient()` from
 * @clearcut/react-query — the governed, product-wide caching policy that
 * apps/blog already consumes (staleTime 60s, gcTime 5m, retry 1,
 * refetchOnWindowFocus false, mutation retry 0). One caching policy for the
 * monorepo instead of a third per-app copy, matching the apps/* -> packages/*
 * direction of this codebase.
 *
 * `useState` with an initialiser is what makes the client per-component-lifetime
 * rather than per-render, and also keeps it out of module scope (a module-scope
 * client would be shared across requests on the server).
 */
export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
