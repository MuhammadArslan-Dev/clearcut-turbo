"use client";

import type { ComponentProps } from "react";
import { useCallback, useMemo } from "react";
import { Link as BaseLink, useRouter as useBaseRouter } from "./navigation-base";
import { markNavPending, useNavLoadingStore } from "@/store/navigation/useNavLoadingStore";

/**
 * Drop-in replacement for next-intl's Link: same props, same rendering,
 * plus marking the clicked element as navigation-pending (see
 * useNavLoadingStore) so it dims + shows a spinner + stops accepting
 * further clicks, and kicking off the global top progress bar. No call
 * site needs to change — this is exported as `Link` from `@/i18n/navigation`,
 * the same import every page already uses.
 */
export function Link({ onClick, ...props }: ComponentProps<typeof BaseLink>) {
  const start = useNavLoadingStore((s) => s.start);

  return (
    <BaseLink
      {...props}
      onClick={(e) => {
        markNavPending(e.currentTarget);
        start();
        onClick?.(e);
      }}
    />
  );
}

/**
 * Drop-in replacement for next-intl's useRouter: same returned object,
 * except push()/replace() also mark the currently-focused element (clicking
 * a button focuses it, so this is almost always the element the user just
 * clicked) as navigation-pending and start the top progress bar — the same
 * feedback Link clicks get, for the imperative `router.push(...)` pattern
 * used in onClick handlers across the app.
 */
export function useRouter(): ReturnType<typeof useBaseRouter> {
  const router = useBaseRouter();
  const start = useNavLoadingStore((s) => s.start);

  const push = useCallback<typeof router.push>(
    (...args) => {
      markNavPending(document.activeElement);
      start();
      return router.push(...args);
    },
    [router, start],
  );

  const replace = useCallback<typeof router.replace>(
    (...args) => {
      markNavPending(document.activeElement);
      start();
      return router.replace(...args);
    },
    [router, start],
  );

  // Memoized: an inline object literal here would be a NEW reference every
  // render, and any consumer that puts the returned router in a useEffect/
  // useMemo dependency array (a common pattern) would then re-run on every
  // render of that consumer too — on components where that triggers a state
  // update, that's an infinite render loop, not just a wasted render.
  return useMemo(() => ({ ...router, push, replace }), [router, push, replace]);
}
