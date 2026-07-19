"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { createQueryClient } from "./query-client";

/**
 * Mounts a browser-side QueryClient once per component lifetime (not once
 * per render) via `useState`'s lazy initializer. Wrap the app root with
 * this — it does not itself prefetch or hydrate anything; pair it with
 * `getQueryClient` + `<HydrationBoundary>` in a Server Component when you
 * need SSR prefetching for a specific query.
 *
 * Devtools are intentionally not bundled here to keep this package
 * dependency-free of dev tooling; add `@tanstack/react-query-devtools` in
 * an app that wants it and render it alongside this provider locally.
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
