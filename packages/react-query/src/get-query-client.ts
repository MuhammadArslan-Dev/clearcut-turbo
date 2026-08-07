import { cache } from "react";

import { createQueryClient } from "./query-client";

/**
 * Server-only, per-request QueryClient for prefetching in Server Components.
 *
 * `React.cache()` memoizes per request, not globally — a plain module-level
 * singleton here would leak one user's prefetched data into another user's
 * concurrent request on the server. Never use this on the client; the
 * browser gets its own client via `ReactQueryProvider` (see ./provider).
 */
export const getQueryClient = cache(createQueryClient);
