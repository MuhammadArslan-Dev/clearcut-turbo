'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type QueryValue = string | number | boolean | null | undefined;

export type SetParamsOptions = {
  replace?: boolean;       // default: true
  scroll?: boolean;        // default: false
  removeIfEmpty?: boolean; // default: true
};

/* -------------------------------------------------------------------------- */
/*                                 MAIN HOOK                                  */
/* -------------------------------------------------------------------------- */

export function useQueryParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  /* ---------------------------------- READ --------------------------------- */

  const get = useCallback(
    (key: string): string | null => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  const getAll = useCallback((): Record<string, string> => {
    const result: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }, [searchParams]);

  /* ---------------------------------- WRITE -------------------------------- */

  const set = useCallback(
    (
      values: Record<string, QueryValue>,
      options: SetParamsOptions = {}
    ) => {
      const {
        replace = true,
        scroll = false,
        removeIfEmpty = true,
      } = options;

      const params = new URLSearchParams(searchParams.toString());

      Object.entries(values).forEach(([key, value]) => {
        const shouldRemove =
          value === null ||
          value === undefined ||
          (removeIfEmpty && value === '');

        if (shouldRemove) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      // Writing the same value that's already there is a common pattern
      // (an effect re-asserting a param) — router.replace()/push() still
      // changes useSearchParams()'s identity even when the URL is
      // byte-identical, which can re-trigger any effect that has this
      // hook's setter in its dependency array, looping forever. Skipping
      // a genuine no-op navigation is what breaks that loop.
      if (url === `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`) {
        return;
      }

      if (replace) {
        router.replace(url, { scroll });
      } else {
        router.push(url, { scroll });
      }
    },
    [router, pathname, searchParams]
  );

  /* --------------------------------- REMOVE -------------------------------- */

  const remove = useCallback(
    (keys: string | string[], options: SetParamsOptions = {}) => {
      const { replace = true, scroll = false } = options;

      const params = new URLSearchParams(searchParams.toString());
      const list = Array.isArray(keys) ? keys : [keys];

      list.forEach((key) => params.delete(key));

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      // See the same check in set() — skip a no-op navigation (e.g.
      // removing keys that were never present) so it can't re-trigger an
      // effect that depends on this setter's identity.
      if (url === `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`) {
        return;
      }

      if (replace) {
        router.replace(url, { scroll });
      } else {
        router.push(url, { scroll });
      }
    },
    [router, pathname, searchParams]
  );

  /* ---------------------------------- API ---------------------------------- */

  return {
    get,
    getAll,
    set,
    remove,
  };
}
