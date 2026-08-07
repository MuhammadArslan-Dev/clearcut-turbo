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
